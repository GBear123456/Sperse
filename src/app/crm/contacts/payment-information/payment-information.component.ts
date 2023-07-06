/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Subscription, Observable, of, combineLatest } from 'rxjs';
import {
    publishReplay,
    refCount,
    tap,
    map,
    switchMap,
    finalize,
    first,
    filter
} from 'rxjs/operators';
import { CreditCard } from 'angular-cc-library';
import * as moment from 'moment';

/** Application imports */
import { ContactsService } from '../contacts.service';
import {
    ContactServiceProxy,
    ShortPaymentInfo,
    BankCardShortInfo,
    PaymentMethodInfo,
    PaymentInfoType,
    PaymentServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { SettingsHelper } from '@shared/common/settings/settings.helper';

@Component({
    selector: 'payment-information',
    templateUrl: './payment-information.component.html',
    styleUrls: ['./payment-information.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentInformationComponent implements OnInit, OnDestroy {
    @ViewChild('paymentsContainer', { static: true }) paymentsContainer: ElementRef;
    @ViewChild('paymentMethodsContainer', { static: true }) paymentMethodsContainer: ElementRef;
    warningMessage$: Observable<string>;
    totalPaymentAmount: number;
    hasRecurringBilling: boolean;
    amountCurrency = SettingsHelper.getCurrency();
    payments$: Observable<ShortPaymentInfo[]>;
    displayedPayments$: Observable<ShortPaymentInfo[]>;
    paymentMethods$: Observable<PaymentMethodInfo[]>;
    paymentMethodsTypes = PaymentInfoType;
    paymentsDisplayLimit$: BehaviorSubject<number | null> = new BehaviorSubject<number>(9);
    selectedPayment: ShortPaymentInfo = null;
    private _refresh: BehaviorSubject<boolean> = new BehaviorSubject(false);
    refresh: Observable<boolean> = this._refresh.asObservable().pipe(
        filter(() => {
            if (!this.contactService['data'].contactInfo.id) {
                this.paymentServiceProxy['data'] = null;
                return false;
            }
            return true;
        })
    );
    contactInfoSubscription: Subscription;
    private readonly ident = 'PaymentInformation';
    constructor(
        private paymentServiceProxy: PaymentServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private contactService: ContactServiceProxy,
        private contactsService: ContactsService,
        private loadingService: LoadingService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.contactInfoSubscription = this.contactsService.contactInfo$.pipe(
            map(contactInfo => contactInfo.id)
        ).subscribe(groupId => {
            /** Create data prop if not exists */
            this.paymentServiceProxy['data'] = this.paymentServiceProxy['data'] && this.paymentServiceProxy['data'][groupId]
                ? this.paymentServiceProxy['data']
                : { [groupId]: { payments: null, paymentMethods: null } };
            this._refresh.next(false);
        });
        this.payments$ = this.refresh.pipe(
            tap(() => this.loadingService.startLoading(this.paymentsContainer.nativeElement)),
            switchMap(
                (refresh: boolean) => {
                    const contactId = this.contactService['data'].contactInfo.id;
                    return (!refresh && this.paymentServiceProxy['data'] && this.paymentServiceProxy['data'][contactId]
                            && this.paymentServiceProxy['data'][contactId].payments
                        ? of(this.paymentServiceProxy['data'][contactId].payments)
                        : this.paymentServiceProxy.getPayments(contactId).pipe(
                            tap(paymentInfo => {
                                this.createPaymentsCache(this.contactService['data'].contactInfo.id);
                                this.paymentServiceProxy['data'][contactId].totalPaymentAmount = paymentInfo.totalPaymentAmount;
                                this.paymentServiceProxy['data'][contactId].hasRecurringBilling = paymentInfo.hasRecurringBilling;
                                this.paymentServiceProxy['data'][contactId].payments = paymentInfo.payments;
                            }),
                            map(paymentInfo => paymentInfo.payments)
                        )).pipe(finalize(() => this.loadingService.finishLoading(this.paymentsContainer.nativeElement)));
                }
            ),
            tap(() => {
                const contactId = this.contactService['data'].contactInfo.id;
                this.totalPaymentAmount = this.paymentServiceProxy['data'][contactId].totalPaymentAmount;
                this.hasRecurringBilling = this.paymentServiceProxy['data'][contactId].hasRecurringBilling;
                this.changeDetectorRef.detectChanges();
            }),
            publishReplay(),
            refCount()
        );

        this.displayedPayments$ = combineLatest(
            this.payments$,
            this.paymentsDisplayLimit$
        ).pipe(
            switchMap(([payments, limit]) => {
                return of(limit !== null && payments ? payments.slice(0, limit) : payments);
            })
        );

        this.paymentMethods$ = this.refresh.pipe(
            switchMap((refresh: boolean) => {
                const contactId = this.contactService['data'].contactInfo.id;
                return !refresh && this.paymentServiceProxy['data'] && this.paymentServiceProxy['data'][contactId]
                       && this.paymentServiceProxy['data'][contactId].paymentMethods
                    ? of(this.paymentServiceProxy['data'][contactId].paymentMethods)
                    : this.paymentServiceProxy.getPaymentMethods(contactId).pipe(
                        tap(paymentMethods => {
                            this.createPaymentsCache(this.contactService['data'].contactInfo.id);
                            this.paymentServiceProxy['data'][contactId].paymentMethods = paymentMethods;
                        })
                    );
            })
        );

        this.contactsService.invalidateSubscribe((area: string) => {
            if (area === 'payment-information') {
                this._refresh.next(true);
            }
        }, this.ident);
    }

    formatDate(date: moment.Moment) {
        return date.utc().format('MMM D, YYYY');
    }

    private createPaymentsCache(contactId: number) {
        if (!this.paymentServiceProxy['data'] || !this.paymentServiceProxy['data'][contactId]) {
            this.paymentServiceProxy['data'] = {
                [contactId]: { payments: null, totalPaymentAmount: 0, hasRecurringBilling: false, paymentMethods: null }
            };
        }
    }

    updateCard() {}

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
        return document.body.clientHeight - this.paymentsContainer.nativeElement.querySelector('h3').getBoundingClientRect().bottom;
    }

    paymentMethodsScrollHeight() {
        return document.body.clientHeight - this.paymentMethodsContainer.nativeElement.querySelector('.title').getBoundingClientRect().bottom;
    }

    highlightPaymentInfo(paymentInfo: ShortPaymentInfo) {
        this.selectedPayment = this.selectedPayment == paymentInfo ? null : paymentInfo;
        this.changeDetectorRef.detectChanges();
    }

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.ident);
        this.contactInfoSubscription.unsubscribe();
    }
}
