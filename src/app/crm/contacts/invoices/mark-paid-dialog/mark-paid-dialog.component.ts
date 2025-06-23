<<<<<<< HEAD
/** Core imports */
import { Component, Inject, ElementRef } from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InvoiceServiceProxy, AddBankCardPaymentInput, PaymentTransactionType, PaymentServiceProxy, InvoiceStatus } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
@Component({
    templateUrl: 'mark-paid-dialog.html',
    styleUrls: ['mark-paid-dialog.less']
})
export class MarkAsPaidDialogComponent {
    date = DateHelper.addTimezoneOffset(new Date(), true);
    amount = this.data.invoice.Amount;
    currency = '';
    transactionTypes = [];
    model: AddBankCardPaymentInput = new AddBankCardPaymentInput();
    paymentProviders$ = this.paymentProxy.getPaymentProviders();
    PaymentTransactionType = PaymentTransactionType;

    constructor(
        private elementRef: ElementRef,
        private invoiceProxy: InvoiceServiceProxy,
        private paymentProxy: PaymentServiceProxy,
        private loadingService: LoadingService,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public ls: AppLocalizationService,
        public dialogRef: MatDialogRef<MarkAsPaidDialogComponent>
    ) {
        this.initTransactionTypes(data.invoice.InvoiceStatus);

        this.currency = getCurrencySymbol(data.invoice.CurrencyId, 'narrow');
        this.model.invoiceId = data.invoice.InvoiceId;
        this.model.invoiceNumber = data.invoice.InvoiceNumber;
        this.model.orderStage = data.invoice.OrderStage;
        this.model.transactionType = data.invoice.InvoiceStatus == InvoiceStatus.Paid ? PaymentTransactionType.Refund : PaymentTransactionType.Sale;
    }

    initTransactionTypes(invoiceStatus: InvoiceStatus): void {
        this.transactionTypes = [
            { text: PaymentTransactionType.Sale, disabled: invoiceStatus == InvoiceStatus.Paid },
            { text: PaymentTransactionType.Refund, disabled: invoiceStatus != InvoiceStatus.Paid && invoiceStatus != InvoiceStatus.PartiallyPaid },
            { text: PaymentTransactionType.Chargeback, disabled: invoiceStatus != InvoiceStatus.Paid && invoiceStatus != InvoiceStatus.PartiallyPaid }
        ]
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

        this.model.amount = this.model.transactionType == PaymentTransactionType.Sale ? this.amount : -this.amount;
        this.model.date = this.date ? DateHelper.removeTimezoneOffset(this.date, true) : this.date;

        if (!this.model.gatewayName) {
            this.model.gatewayTransactionId = null;
            this.model.gatewayOriginTransactionId = null;
        }
        if (this.model.transactionType == PaymentTransactionType.Sale) {
            this.model.gatewayOriginTransactionId = null;
        }

        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.invoiceProxy.addBankCardPayment(this.model).pipe(finalize(() => {
            this.loadingService.finishLoading(this.elementRef.nativeElement);
        })).subscribe(() => {
            this.dialogRef.close(true);
        });
    }
=======
/** Core imports */
import { Component, Inject, ElementRef } from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InvoiceServiceProxy, AddBankCardPaymentInput, PaymentTransactionType, PaymentServiceProxy, InvoiceStatus } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
@Component({
    templateUrl: 'mark-paid-dialog.html',
    styleUrls: ['mark-paid-dialog.less']
})
export class MarkAsPaidDialogComponent {
    date = DateHelper.addTimezoneOffset(new Date(), true);
    amount = this.data.invoice.Amount;
    currency = '';
    transactionTypes = [];
    model: AddBankCardPaymentInput = new AddBankCardPaymentInput();
    paymentProviders$ = this.paymentProxy.getPaymentProviders();
    PaymentTransactionType = PaymentTransactionType;

    constructor(
        private elementRef: ElementRef,
        private invoiceProxy: InvoiceServiceProxy,
        private paymentProxy: PaymentServiceProxy,
        private loadingService: LoadingService,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public ls: AppLocalizationService,
        public dialogRef: MatDialogRef<MarkAsPaidDialogComponent>
    ) {
        this.initTransactionTypes(data.invoice.InvoiceStatus);

        this.currency = getCurrencySymbol(data.invoice.CurrencyId, 'narrow');
        this.model.invoiceId = data.invoice.InvoiceId;
        this.model.invoiceNumber = data.invoice.InvoiceNumber;
        this.model.orderStage = data.invoice.OrderStage;
        this.model.transactionType = data.invoice.InvoiceStatus == InvoiceStatus.Paid ? PaymentTransactionType.Refund : PaymentTransactionType.Sale;
    }

    initTransactionTypes(invoiceStatus: InvoiceStatus): void {
        this.transactionTypes = [
            { text: PaymentTransactionType.Sale, disabled: invoiceStatus == InvoiceStatus.Paid },
            { text: PaymentTransactionType.Refund, disabled: invoiceStatus != InvoiceStatus.Paid && invoiceStatus != InvoiceStatus.PartiallyPaid },
            { text: PaymentTransactionType.Chargeback, disabled: invoiceStatus != InvoiceStatus.Paid && invoiceStatus != InvoiceStatus.PartiallyPaid }
        ]
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

        this.model.amount = this.model.transactionType == PaymentTransactionType.Sale ? this.amount : -this.amount;
        this.model.date = this.date ? DateHelper.removeTimezoneOffset(this.date, true) : this.date;

        if (!this.model.gatewayName) {
            this.model.gatewayTransactionId = null;
            this.model.gatewayOriginTransactionId = null;
        }
        if (this.model.transactionType == PaymentTransactionType.Sale) {
            this.model.gatewayOriginTransactionId = null;
        }

        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.invoiceProxy.addBankCardPayment(this.model).pipe(finalize(() => {
            this.loadingService.finishLoading(this.elementRef.nativeElement);
        })).subscribe(() => {
            this.dialogRef.close(true);
        });
    }
>>>>>>> f999b481882149d107812286d0979872df712626
}