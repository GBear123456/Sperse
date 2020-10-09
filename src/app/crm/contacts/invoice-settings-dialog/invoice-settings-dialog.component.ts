/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';

/** Third party imports */
import { filter, finalize, first } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { NotifyService } from '@abp/notify/notify.service';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { EmailTemplateType, InvoiceServiceProxy, InvoiceSettings, Currency } from '@shared/service-proxies/service-proxies';
import { BankSettingsDialogComponent } from '@app/crm/shared/bank-settings-dialog/bank-settings-dialog.component';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { EmailTags } from '../contacts.const';

@Component({
    templateUrl: 'invoice-settings-dialog.component.html',
    styleUrls: [ 'invoice-settings-dialog.component.less' ],
    providers: [ DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceSettingsDialogComponent implements AfterViewInit {
    @ViewChild(EmailTemplateDialogComponent, { static: false }) modalDialog: EmailTemplateDialogComponent;
    settings = new InvoiceSettings();
    currencies = Object.keys(Currency).map(item => {
        return {
            id: item,
            text: this.ls.l(item)
        };
    });

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
        EmailTags.SenderAffiliateCode
    ];

    constructor(
        public dialog: MatDialog,
        private notifyService: NotifyService,
        private invoicesService: InvoicesService,
        private dialogRef: MatDialogRef<InvoiceSettingsDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        private invoiceProxy: InvoiceServiceProxy,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.invoicesService.invalidateSettings();
        data.templateType = EmailTemplateType.Invoice;
        data.title = ls.l('Invoice Settings');
        data.saveTitle = ls.l('Save');
    }

    ngAfterViewInit() {
        this.modalDialog.startLoading();
        this.invoicesService.settings$.pipe(filter(Boolean), first(),
            finalize(() => this.modalDialog.finishLoading())
        ).subscribe((res: InvoiceSettings) => {
            this.settings = new InvoiceSettings(res);
            if (this.settings.defaultAffiliateRate !== null)
                this.settings.defaultAffiliateRate = this.settings.defaultAffiliateRate * 100;
            this.data.templateId = res.defaultTemplateId;
            this.changeDetectorRef.markForCheck();
        });
        this.changeDetectorRef.detectChanges();
    }

    save() {
        this.modalDialog.startLoading();
        if (this.settings.defaultAffiliateRate !== null)
            this.settings.defaultAffiliateRate = this.settings.defaultAffiliateRate / 100;
        this.settings.defaultTemplateId = this.data.templateId;
        this.invoiceProxy.updateSettings(this.settings).pipe(
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
            data: {}
        });
    }

    onTagItemClick(tag: string) {
        if (tag == 'InvoiceAnchor')
            this.modalDialog.addLinkTag('InvoiceLink', this.ls.l('Invoice'));
        else
            this.modalDialog.addTextTag(tag);
    }

    templateChanged(data) {
        this.changeDetectorRef.markForCheck();
    }
}