/** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, Inject, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

/** Application imports */
import { NotifyService } from '@abp/notify/notify.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { TenantPaymentSettingsServiceProxy, BankTransferSettings, BeneficiaryInfo } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'bank-settings-dialog',
    templateUrl: 'bank-settings-dialog.component.html',
    styleUrls: [ 'bank-settings-dialog.component.less' ],
    providers: [ TenantPaymentSettingsServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankSettingsDialogComponent {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;

    settings = new BankTransferSettings({
        bankAccountNumber: undefined,
        bankRoutingNumberForACH: undefined,
        bankRoutingNumber: undefined,
        swiftCodeForUSDollar: undefined,
        swiftCode: undefined,
        beneficiaryInfo: new BeneficiaryInfo(),
        beneficiaryBank: new BeneficiaryInfo()
    });

    buttons: IDialogButton[] = [
        {
            id: 'saveOption',
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        public dialog: MatDialog,
        private notifyService: NotifyService,
        private settingsProxy: TenantPaymentSettingsServiceProxy,
        private dialogRef: MatDialogRef<BankSettingsDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.settingsProxy.getBankTransferSettings().subscribe(res => {
            changeDetectorRef.markForCheck();
            this.settings = res;
        });
    }

    save() {
        this.modalDialog.startLoading();
        this.settingsProxy.updateBankTransferSettings(this.settings).pipe(
            finalize(() => this.modalDialog.finishLoading())
        ).subscribe(() => {
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
        });
    }

    close() {
        this.modalDialog.close();
    }
}