/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';

/** Third party imports */
import { finalize, first } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { NotifyService } from '@abp/notify/notify.service';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { EmailTemplateType, InvoiceServiceProxy, InvoiceSettings, InvoiceCurrency } from '@shared/service-proxies/service-proxies';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';

@Component({
    templateUrl: 'invoice-settings-dialog.component.html',
    styleUrls: [ 'invoice-settings-dialog.component.less' ],
    providers: [ DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceSettingsDialogComponent implements AfterViewInit {
    @ViewChild(EmailTemplateDialogComponent) modalDialog: EmailTemplateDialogComponent;
    settings = new InvoiceSettings();
    currencies = Object.keys(InvoiceCurrency).map(item => {
        return {
            id: item,
            text: this.ls.l(item)
        }
    });
    nextInvoiceNumber;

    constructor(
        private notifyService: NotifyService,
        private invoicesService: InvoicesService,
        private dialogRef: MatDialogRef<InvoiceSettingsDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        private invoiceProxy: InvoiceServiceProxy,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        data.templateType = EmailTemplateType.Invoice;
        data.title = ls.l('Invoice Settings');
        data.saveTitle = ls.l('Save');
    }

    ngAfterViewInit() {
        this.modalDialog.startLoading();        
        this.invoicesService.settings$.pipe(first(),
            finalize(() => this.modalDialog.finishLoading())
        ).subscribe(res => {
            this.settings = new InvoiceSettings(res);
            //this.nextInvoiceNumber = res.nextInvoiceNumber; TODO:
            this.data.templateId = res.defaultTemplateId;
            this.changeDetectorRef.markForCheck();
        });
        this.changeDetectorRef.detectChanges();
    }

    allowDigitsOnly(event, exceptions = []) {
        let key = event.event.key;
        if (exceptions.indexOf(key) < 0 && key.length == 1 && isNaN(key)) {
            event.event.preventDefault();
            event.event.stopPropagation();
        }
    }

    save() {        
        this.modalDialog.startLoading();
        this.settings.defaultTemplateId = this.data.templateId;
        this.invoiceProxy.updateSettings(this.settings).pipe(
            finalize(() => this.modalDialog.finishLoading())
        ).subscribe(() => {
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.invoicesService.invalidateSettings(this.settings);
            this.dialogRef.close(this.settings);
        });
    }

    templateChanged(data) {
        this.changeDetectorRef.markForCheck();
    }
}
