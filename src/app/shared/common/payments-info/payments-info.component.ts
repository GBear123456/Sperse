/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, ViewChild, ElementRef, Input } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import {
    map,
    switchMap, tap
} from 'rxjs/operators';
import { CreditCard } from 'angular-cc-library';
import * as moment from 'moment';

/** Application imports */
import {
    ShortPaymentInfo,
    BankCardShortInfo,
    PaymentMethodInfo,
    PaymentInfoType
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { SettingsHelper } from '@shared/common/settings/settings.helper';
import { PaymentsInfoService } from './payments-info.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'payments-info',
    templateUrl: './payments-info.component.html',
    styleUrls: ['./payments-info.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsInfoComponent implements OnInit {
    @Input() paymentInfoScrollHeight: number;

    @ViewChild('paymentsContainer', { static: true }) paymentsContainer: ElementRef;
    @ViewChild('paymentMethodsContainer', { static: true }) paymentMethodsContainer: ElementRef;
    totalPaymentAmount: number;
    amountCurrency: string;
    hasRecurringBilling: boolean;
    payments$: Observable<ShortPaymentInfo[]>;
    displayedPayments$: Observable<ShortPaymentInfo[]>;
    paymentMethods$: Observable<PaymentMethodInfo[]>;
    paymentMethodsTypes = PaymentInfoType;
    paymentsDisplayLimit$: BehaviorSubject<number | null> = new BehaviorSubject<number>(9);
    selectedPayment: ShortPaymentInfo = null;

    constructor(
        paymentsInfoService: PaymentsInfoService,
        private changeDetectorRef: ChangeDetectorRef,
        private loadingService: LoadingService,
        public ls: AppLocalizationService
    ) {
        this.payments$ = paymentsInfoService.getPaymentsObserverable()
            .pipe(
                tap((res) => {
                    this.totalPaymentAmount = res.totalPaymentAmount;
                    this.amountCurrency = res.payments.length ? res.payments[0].currencyId : SettingsHelper.getCurrency();
                    this.hasRecurringBilling = res.hasRecurringBilling;
                    this.changeDetectorRef.detectChanges();
                }),
                map(res => res.payments)
            );
        this.paymentMethods$ = paymentsInfoService.getPaymentMethodsObserverable();
    }

    ngOnInit() {
        this.displayedPayments$ = combineLatest([
            this.payments$,
            this.paymentsDisplayLimit$
        ]).pipe(
            switchMap(([payments, limit]) => {
                return of(limit !== null && payments ? payments.slice(0, limit) : payments);
            })
        );
    }

    formatDate(date: moment.Moment) {
        return date.utc().format('MMM D, YYYY');
    }

    viewAllTransactions() {
        /** Show all payments */
        this.paymentsDisplayLimit$.next(null);
    }

    addNewPaymentMethod() {}

    editPaymentMethod() {}

    removePaymentMethod() {}

    getCardType(cardInfo: BankCardShortInfo): string {
        if (cardInfo.network)
            return cardInfo.network;

        let numberInfo = CreditCard.cardFromNumber(cardInfo.cardNumber);
        return numberInfo && numberInfo.type || 'credit-card';
    }

    paymentsScrollHeight() {
        return this.paymentInfoScrollHeight || (document.body.clientHeight - this.paymentsContainer.nativeElement.querySelector('h3').getBoundingClientRect().bottom);
    }

    paymentMethodsScrollHeight() {
        return this.paymentInfoScrollHeight || (document.body.clientHeight - this.paymentMethodsContainer.nativeElement.querySelector('.title').getBoundingClientRect().bottom);
    }

    highlightPaymentInfo(paymentInfo: ShortPaymentInfo) {
        this.selectedPayment = this.selectedPayment == paymentInfo ? null : paymentInfo;
        this.changeDetectorRef.detectChanges();
    }
}
