/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, Injector, ViewChild, ElementRef } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { concatAll, first, pluck, publishReplay, refCount, map, tap, switchMap, finalize } from 'rxjs/operators';
import { CreditCard } from 'angular-cc-library';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactGroupServiceProxy, MonthlyPaymentInfo, PaymentMethodInfo, PaymentMethodInfoType, PaymentServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'payment-information',
    templateUrl: './payment-information.component.html',
    styleUrls: ['./payment-information.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentInformationComponent extends AppComponentBase implements OnInit {
    @ViewChild('paymentsContainer') paymentsContainer: ElementRef;
    @ViewChild('paymentMethodsContainer') paymentMethodsContainer: ElementRef;
    warningMessage$: Observable<string>;
    lastPaymentDate: string;
    lastPaymentAmount: number;
    amountCurrency = '$';
    balanceAmount$: Observable<number>;
    payments$: Observable<MonthlyPaymentInfo[]>;
    dispayedPayments$: Observable<MonthlyPaymentInfo[]>;
    paymentMethods$: Observable<PaymentMethodInfo[]>;
    paymentMethodsTypes: PaymentMethodInfoType;
    paymentsDisplayLimit$: BehaviorSubject<number | null> = new BehaviorSubject<number>(9);
    constructor(
        injector: Injector,
        private paymentServiceProxy: PaymentServiceProxy,
        private contactGroupService: ContactGroupServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        const groupId = this.contactGroupService['data'].contactInfo.id;
        this.balanceAmount$ = of(0);
        /** Create data prop if not exists */
        this.paymentServiceProxy['data'] = this.paymentServiceProxy['data'] && this.paymentServiceProxy['data'][groupId]
                                           ? this.paymentServiceProxy['data']
                                           : { [groupId]: { payments: null, paymentMethods: null } };
        this.payments$ = this.getPayments(groupId);
        this.dispayedPayments$ =
            combineLatest(
                this.payments$,
                this.paymentsDisplayLimit$
            ).pipe(
                switchMap(([payments, limit]) => {
                    return of(limit !== null ? payments.slice(0, limit) : payments);
                })
            );
        this.paymentMethods$ = this.getPaymentMethods(groupId);
        // this.warningMessage$ = this.paymentMethods$.pipe(
        //     concatAll(),
        //     pluck('issues'),
        //     map(issues => issues[0]),
        //     first()
        // );
    }

    getPayments(contactGroupId): Observable<MonthlyPaymentInfo[]> {
        abp.ui.setBusy(this.paymentsContainer.nativeElement);
        return (this.paymentServiceProxy['data'][contactGroupId] && this.paymentServiceProxy['data'][contactGroupId].payments ?
               of(this.paymentServiceProxy['data'][contactGroupId].payments) :
               this.paymentServiceProxy.getPayments(contactGroupId).pipe(
                   publishReplay(),
                   refCount(),
                   tap(payments => this.paymentServiceProxy['data'][contactGroupId].payments = payments)
               )).pipe(
                   finalize(() => abp.ui.clearBusy(this.paymentsContainer.nativeElement))
                );
    }

    getPaymentMethods(contactGroupId): Observable<PaymentMethodInfo[]> {
        return this.paymentServiceProxy['data'][contactGroupId] && this.paymentServiceProxy['data'][contactGroupId].paymentMethods ?
               of(this.paymentServiceProxy['data'][contactGroupId].paymentMethods) :
               this.paymentServiceProxy.getPaymentMethods(contactGroupId).pipe(
                   tap(paymentMethods => this.paymentServiceProxy['data'][contactGroupId].paymentMethods = paymentMethods)
               );
    }

    updateCard() {}

    viewAllTransactions() {
        /** Show all payments */
        this.paymentsDisplayLimit$.next(null);
    }

    addNewPaymentMethod() {}

    editPaymentMethod() {}

    removePaymentMethod() {}

    getCardTypeFromNumber(cardNumber: string): string {
        return CreditCard.cardFromNumber(cardNumber).type;
    }

    paymentsScrollHeight() {
        return document.body.clientHeight - this.paymentsContainer.nativeElement.querySelector('h3').getBoundingClientRect().bottom;
    }

    paymentMethodsScrollHeight() {
        return document.body.clientHeight - this.paymentMethodsContainer.nativeElement.querySelector('.title').getBoundingClientRect().bottom;
    }
}
