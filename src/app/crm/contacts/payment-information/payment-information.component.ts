/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, Injector, ViewChild, ElementRef } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { publishReplay, refCount, tap, map, switchMap, finalize, distinctUntilChanged } from 'rxjs/operators';
import { CreditCard } from 'angular-cc-library';
import * as moment from 'moment';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactsService } from '../contacts.service';
import { ContactServiceProxy, MonthlyPaymentInfo, PaymentMethodInfo, PaymentMethodInfoType, PaymentServiceProxy } from '@shared/service-proxies/service-proxies';

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
    paymentMethodsTypes = PaymentMethodInfoType;
    paymentsDisplayLimit$: BehaviorSubject<number | null> = new BehaviorSubject<number>(9);
    private _refresh: BehaviorSubject<boolean> = new BehaviorSubject(false);
    refresh: Observable<boolean> = this._refresh.asObservable();
    groupId$: Observable<number>;
    contactIdAndRefreshSubscribe$: Observable<[number, boolean]>;
    constructor(
        injector: Injector,
        private paymentServiceProxy: PaymentServiceProxy,
        private contactService: ContactServiceProxy,
        private _contactsService: ContactsService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        this.balanceAmount$ = of(0);
        this.groupId$ = this._contactsService.contactInfo$.pipe(map(contactInfo => contactInfo.id));
        this.groupId$.subscribe(groupId => {
            /** Create data prop if not exists */
            this.paymentServiceProxy['data'] = this.paymentServiceProxy['data'] && this.paymentServiceProxy['data'][groupId]
                ? this.paymentServiceProxy['data']
                : { [groupId]: { payments: null, paymentMethods: null } };
        });

        this.contactIdAndRefreshSubscribe$ = combineLatest(
            this.groupId$.pipe(distinctUntilChanged()),
            this.refresh
        );
        this.payments$ = this.contactIdAndRefreshSubscribe$.pipe(
            tap(() => abp.ui.setBusy(this.paymentsContainer.nativeElement)),
            switchMap(
                ([contactId, refresh]: [number, boolean]) => {
                    return (!refresh && this.paymentServiceProxy['data'][contactId] && this.paymentServiceProxy['data'][contactId].payments
                        ? of(this.paymentServiceProxy['data'][contactId].payments)
                        : this.paymentServiceProxy.getPayments(contactId).pipe(
                            tap(payments => {
                                this.paymentServiceProxy['data'][contactId].payments = payments;
                            })
                        )).pipe(finalize(() => {abp.ui.clearBusy(this.paymentsContainer.nativeElement); }));
                }
            ),
            publishReplay(),
            refCount()
        );

        this.dispayedPayments$ =
            combineLatest(
                this.payments$,
                this.paymentsDisplayLimit$
            ).pipe(
                switchMap(([payments, limit]) => {
                    return of(limit !== null ? payments.slice(0, limit) : payments);
                })
            );

        this.paymentMethods$ = this.contactIdAndRefreshSubscribe$.pipe(
                switchMap(([contactId, refresh]: [number, boolean]) => {
                    return !refresh && this.paymentServiceProxy['data'][contactId] && this.paymentServiceProxy['data'][contactId].paymentMethods ?
                        of(this.paymentServiceProxy['data'][contactId].paymentMethods) :
                        this.paymentServiceProxy.getPaymentMethods(contactId).pipe(
                            tap(paymentMethods => this.paymentServiceProxy['data'][contactId].paymentMethods = paymentMethods)
                        );
                })
            );
        // this.warningMessage$ = this.paymentMethods$.pipe(
        //     concatAll(),
        //     pluck('issues'),
        //     map(issues => issues[0]),
        //     first()
        // );

        this._contactsService.invalidateSubscribe((area) => {
            if (area == 'payment-information') {
                this._refresh.next(true);
            }
        });
    }

    formatDate(date: moment.Moment) {
        return date.utc().format('MMM D, YYYY');
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
