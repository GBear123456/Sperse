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
import { EmailTemplateType, TenantPaymentSettingsServiceProxy, InvoiceSettings } from '@shared/service-proxies/service-proxies';
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
    editorHeight = innerHeight - 560 + 'px';
    tagsList = [
        EmailTags.ClientFirstName,
        EmailTags.ClientLastName,
        EmailTags.LegalName,
        EmailTags.InvoiceNumber,
        EmailTags.InvoiceGrandTotal,
        EmailTags.InvoiceDueDate,
        EmailTags.InvoiceLink,
        EmailTags.InvoiceAnchor,
        EmailTags.SenderFullName,
        EmailTags.SenderPhone,
        EmailTags.SenderEmail,
        EmailTags.SenderWebSite1,
        EmailTags.SenderWebSite2,
        EmailTags.SenderWebSite3,
        EmailTags.SenderCompany,
        EmailTags.SenderCompanyTitle,
        EmailTags.SenderCompanyLogo,
        EmailTags.SenderCompanyPhone,
        EmailTags.SenderCompanyEmail,
        EmailTags.SenderCompanyWebSite,
        EmailTags.SenderCalendly,
        EmailTags.SenderAffiliateCode,
        EmailTags.SenderEmailSignature
    ];
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

    showEmailTemplateDialog() {
        let dialogComponent = this.dialog.open(EmailTemplateDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                title: this.ls.l('Template'),
                templateType: EmailTemplateType.Invoice,
                saveTitle: this.ls.l('Save'),
                hideContextMenu: false,
                templateId: this.settings.defaultTemplateId
            }
        }).componentInstance;
        dialogComponent.tagsList = this.tagsList;
        dialogComponent.editorHeight = this.editorHeight;
        dialogComponent.templateEditMode = true;
        dialogComponent.onSave.subscribe((data) => {
            this.settings.defaultTemplateId = data.templateId;
            dialogComponent.close();
        });
        dialogComponent.onTagItemClick.subscribe((e) => this.onTagItemClick(e, dialogComponent));
        return dialogComponent;
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

    onTagItemClick(tag: string, modalDialog) {
        if (tag == 'InvoiceAnchor')
            modalDialog.addLinkTag('InvoiceLink', this.ls.l('Invoice'));
        else
            modalDialog.addTextTag(tag);
    }
}