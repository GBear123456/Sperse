/** Core imports */
import { Component, Inject, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DxValidationGroupComponent } from 'devextreme-angular/ui/validation-group';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { CreateSpreedlyGatewayInput, TenantPaymentSettingsServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { environment } from '@root/environments/environment';

@Component({
    templateUrl: 'add-spreedly-provider-dialog.component.html',
    styleUrls: [
        '../../../../../shared/common/styles/form.less',
        'add-spreedly-provider-dialog.component.less'
    ],
    providers: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSpreedlyProviderDialog {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild(DxValidationGroupComponent) validationGroup: DxValidationGroupComponent;

    titleText = this.ls.l('Add provider');
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this),
            disabled: false
        }
    ];
    gateways: any[];
    selectedGatewayType;
    selectedGateway: any;
    selectedGatewayAuth: any;
    isTestSandbox = false;

    sandbox = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private changeDetectorRef: ChangeDetectorRef,
        private paymentSettingsService: TenantPaymentSettingsServiceProxy,
        public ls: AppLocalizationService,
        public dialogRef: MatDialogRef<AddSpreedlyProviderDialog>,
    ) {
        this.gateways = data.spreedlyProviders;
        if (environment.releaseStage == 'production') {
            let testGatewayIndex = this.gateways.findIndex(g => g.gateway_type == 'test');
            this.gateways.splice(testGatewayIndex, 1);
        } else {
            let testGateway = this.gateways.find(g => g.gateway_type == 'test');
            testGateway.name = 'Test Gateway';
        }
    }

    onGatewaySelect(type: string) {
        this.selectedGateway = this.gateways.find(g => g.gateway_type === type);
        this.selectedGatewayAuth = this.selectedGateway.auth_modes?.[0] ?? null;
        this.isTestSandbox = this.selectedGateway.gateway_type == 'test';
    }

    save() {
        if (!this.validationGroup.instance.validate().isValid)
            return;

        this.modalDialog.startLoading();

        const fields: Record<string, string> = {};
        this.selectedGatewayAuth?.credentials.forEach((field: any) => {
            fields[field.name] = field.value;
        });
        this.selectedGateway.gateway_settings?.forEach((field: any) => {
            fields[field.name] = field.value;
        });
        let request = new CreateSpreedlyGatewayInput({
            gatewayType: this.selectedGatewayType,
            fields: fields,
            sandbox: this.isTestSandbox || this.sandbox
        });

        this.paymentSettingsService.createSpreedlyGatewayConnection(request)
            .pipe(
                finalize(() => this.modalDialog.finishLoading())
            )
            .subscribe(() => {
                this.modalDialog.close(true, true);
            });
    }
}