/** Core imports */
import { Component, Inject, ElementRef } from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize, first } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InvoiceServiceProxy, AddBankCardPaymentInput } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';

@Component({
    templateUrl: 'mark-paid-dialog.html',
    styleUrls: ['mark-paid-dialog.less']
})
export class MarkAsPaidDialogComponent {
    date = DateHelper.addTimezoneOffset(new Date(), true);
    stage = this.data.invoice.OrderStage;
    amount = this.data.invoice.Amount;
    description: string;
    currency = '$';

    constructor(
        private elementRef: ElementRef,
        private invoiceProxy: InvoiceServiceProxy,
        private invoicesService: InvoicesService,
        private loadingService: LoadingService,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public ls: AppLocalizationService,
        public dialogRef: MatDialogRef<MarkAsPaidDialogComponent>
    ) {
        invoicesService.settings$.pipe(first()).subscribe(res =>
            this.currency = getCurrencySymbol(res.currency, 'wide'));
    }

    allowDigitsOnly(event, exceptions = []) {
        let key = event.event.key;
        if (exceptions.indexOf(key) < 0 && key.length == 1 && isNaN(key)) {
            event.event.preventDefault();
            event.event.stopPropagation();
        }
    }

    markAsPaid(dateComponent: DxDateBoxComponent) {
        if (!dateComponent.instance.option('isValid'))
            return false;

        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.invoiceProxy.addBankCardPayment(new AddBankCardPaymentInput({
            invoiceId: this.data.invoice.InvoiceId,
            invoiceNumber: this.data.invoice.InvoiceNumber,
            date: this.date ? DateHelper.removeTimezoneOffset(this.date, true) : this.date,
            description: this.description,
            orderStage: this.stage,
            amount: this.amount,
            gatewayName: undefined,
            gatewayTransactionId: undefined,
            bankCardInfo: undefined
        })).pipe(finalize(() => {
            this.loadingService.finishLoading(this.elementRef.nativeElement);
        })).subscribe(() => {
            this.dialogRef.close(true);
        });
    }
}