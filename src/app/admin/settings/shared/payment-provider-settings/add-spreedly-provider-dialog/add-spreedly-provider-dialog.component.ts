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

    authModes: any[] = [];
    selectedGatewayAuthType;
    selectedGatewayAuth: any;

    isTestSandbox = false;

    sandbox = false;
    isActive = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private changeDetectorRef: ChangeDetectorRef,
        private paymentSettingsService: TenantPaymentSettingsServiceProxy,
        public ls: AppLocalizationService,
        public dialogRef: MatDialogRef<AddSpreedlyProviderDialog>,
    ) {
        this.gateways = data.spreedlyProviders;
    }

    onGatewaySelect(type: string) {
        this.selectedGateway = this.gateways.find(g => g.gateway_type === type);

        let authModes: any[] = this.selectedGateway.auth_modes || [];
        if (authModes.length) {
            authModes = authModes.filter(v => v.credentials && v.credentials.length);
        }

        this.authModes = authModes;
        if (authModes.length == 1) {
            this.selectedGatewayAuth = this.selectedGateway.auth_modes[0];
        }
        else {
            this.selectedGatewayAuth = null;
        }

        this.isTestSandbox = this.selectedGateway.gateway_type == 'test';
    }

    onGatewayAuthSelect(type: string) {
        this.selectedGatewayAuth = this.authModes.find(g => g.auth_mode_type === type);
    }

    save() {
        if (!this.validationGroup.instance.validate().isValid)
            return;

        this.modalDialog.startLoading();

        const fields: Record<string, string> = {};

        if (this.selectedGatewayAuth) {
            if (this.selectedGatewayAuth.auth_mode_type != 'default')
                fields['mode'] = this.selectedGatewayAuth.auth_mode_type;

            this.selectedGatewayAuth.credentials.forEach((field: any) => {
                fields[field.name] = field.value;
            });
        }

        this.selectedGateway.gateway_settings?.forEach((field: any) => {
            fields[field.name] = field.value;
        });
        let request = new CreateSpreedlyGatewayInput({
            gatewayType: this.selectedGatewayType,
            fields: fields,
            sandbox: this.isTestSandbox || this.sandbox,
            isActive: this.isActive
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