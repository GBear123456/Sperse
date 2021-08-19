/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';

/** Third party imports */
import { filter, finalize, first } from 'rxjs/operators';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { NotifyService } from '@abp/notify/notify.service';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { EmailTemplateType, TenantPaymentSettingsServiceProxy, InvoiceSettings, Tier2CommissionSource } from '@shared/service-proxies/service-proxies';
import { BankSettingsDialogComponent } from '@app/crm/shared/bank-settings-dialog/bank-settings-dialog.component';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppPermissions } from '@shared/AppPermissions';
import { EmailTags } from '../contacts.const';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppFeatures } from '@shared/AppFeatures';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    templateUrl: 'invoice-settings-dialog.component.html',
    styleUrls: [ 'invoice-settings-dialog.component.less' ],
    providers: [ DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceSettingsDialogComponent implements AfterViewInit {
    @ViewChild(ModalDialogComponent, { static: false }) modalDialog: ModalDialogComponent;

    settings = new InvoiceSettings();
    hasCommissionsFeature: boolean = this.featureCheckerService.isEnabled(AppFeatures.CRMCommissions);
    isManageUnallowed = !this.permission.isGranted(AppPermissions.CRMSettingsConfigure);
    isRateDisabled = this.isManageUnallowed || !this.permission.isGranted(AppPermissions.CRMAffiliatesCommissionsManage);
    buttons: IDialogButton[] = [
        {
            id: 'cancelTemplateOptions',
            title: this.ls.l('Cancel'),
            class: 'default',
            action: () => this.modalDialog.close()
        },
        {
            id: 'saveTemplateOptions',
            title: this.ls.l('Save'),
            disabled: this.isManageUnallowed,
            class: 'primary',
            action: this.save.bind(this)
        }
    ]
    EmailTemplateType = EmailTemplateType;
    tier2SourceOptions = Object.keys(Tier2CommissionSource).map(item => {
        return {
            id: Tier2CommissionSource[item],
            text: this.ls.l(item)
        };
    });

    constructor(
        public dialog: MatDialog,
        private notifyService: NotifyService,
        private invoicesService: InvoicesService,
        private dialogRef: MatDialogRef<InvoiceSettingsDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy,
        private permission: AppPermissionService,
        private featureCheckerService: FeatureCheckerService,
        public ls: AppLocalizationService,
    ) {
        this.invoicesService.invalidateSettings();
    }

    ngAfterViewInit() {
        this.modalDialog.startLoading();
        this.invoicesService.settings$.pipe(filter(Boolean), first(),
            finalize(() => this.modalDialog.finishLoading())
        ).subscribe((res: InvoiceSettings) => {
            this.settings = new InvoiceSettings(res);
            if (this.settings.defaultAffiliateRate !== null)
                this.settings.defaultAffiliateRate = parseFloat(
                    (this.settings.defaultAffiliateRate * 100).toFixed(2)
                );
            this.changeDetectorRef.markForCheck();
        });
        this.changeDetectorRef.detectChanges();
    }

    save() {
        if (this.isManageUnallowed)
            return;

        this.modalDialog.startLoading();
        if (this.settings.defaultAffiliateRate !== null)
            this.settings.defaultAffiliateRate = parseFloat(
                (this.settings.defaultAffiliateRate / 100).toFixed(4)
            );
        this.tenantPaymentSettingsProxy.updateInvoiceSettings(this.settings).pipe(
            finalize(() => this.modalDialog.finishLoading())
        ).subscribe(() => {
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.invoicesService.invalidateSettings(this.settings);
            this.dialogRef.close(this.settings);
        });
    }

    showBankSettingsDialog() {
        this.dialog.open(BankSettingsDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                isManageUnallowed: this.isManageUnallowed
            }
        });
    }
}