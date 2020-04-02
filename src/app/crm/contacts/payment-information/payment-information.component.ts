/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Subscription, Observable, of, combineLatest } from 'rxjs';
import {
    distinctUntilChanged,
    publishReplay,
    refCount,
    tap,
    map,
    switchMap,
    finalize,
    first
} from 'rxjs/operators';
import { CreditCard } from 'angular-cc-library';
import * as moment from 'moment';

/** Application imports */
import { ContactsService } from '../contacts.service';
import {
    ContactServiceProxy,
    MonthlyPaymentInfo,
    PaymentMethodInfo,
    PaymentInfoType,
    PaymentServiceProxy,
    InvoiceSettings
} from '@shared/service-proxies/service-proxies';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

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
    lastPaymentDate: string;
    lastPaymentAmount: number;
    amountCurrency = '$';
    balanceAmount$: Observable<number>;
    payments$: Observable<MonthlyPaymentInfo[]>;
    displayedPayments$: Observable<MonthlyPaymentInfo[]>;
    paymentMethods$: Observable<PaymentMethodInfo[]>;
    paymentMethodsTypes = PaymentInfoType;
    paymentsDisplayLimit$: BehaviorSubject<number | null> = new BehaviorSubject<number>(9);
    private _refresh: BehaviorSubject<boolean> = new BehaviorSubject(false);
    refresh: Observable<boolean> = this._refresh.asObservable();
    contactInfoSubscription: Subscription;
    constructor(
        private invoicesService: InvoicesService,
        private paymentServiceProxy: PaymentServiceProxy,
        private contactService: ContactServiceProxy,
        private contactsService: ContactsService,
        private loadingService: LoadingService,
        public ls: AppLocalizationService
    ) {
        invoicesService.settings$.pipe(first()).subscribe(
            (settings: InvoiceSettings) => this.amountCurrency = settings.currency
        );
    }

    ngOnInit() {
        this.balanceAmount$ = of(0);
        this.contactInfoSubscription = this.contactsService.contactInfo$.pipe(
            map(contactInfo => contactInfo.id),
            distinctUntilChanged()
        ).subscribe(groupId => {
            /** Create data prop if not exists */
            this.paymentServiceProxy['data'] = this.paymentServiceProxy['data'] && this.paymentServiceProxy['data'][groupId]
                ? this.paymentServiceProxy['data']
                : { [groupId]: { payments: null, paymentMethods: null } };
            this._refresh.next(true);
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
                                this.paymentServiceProxy['data'][contactId].payments = paymentInfo.payments;
                                this.paymentServiceProxy['data'][contactId].lastPaymentAmount = paymentInfo.lastPaymentAmount;
                                this.paymentServiceProxy['data'][contactId].lastPaymentDate = paymentInfo.lastPaymentDate && paymentInfo.lastPaymentDate.utc().format('MMM D');
                            }),
                            map(paymentInfo => paymentInfo.payments)
                        )).pipe(finalize(() => this.loadingService.finishLoading(this.paymentsContainer.nativeElement)));
                }
            ),
            tap(() => {
                const contactId = this.contactService['data'].contactInfo.id;
                this.lastPaymentAmount = this.paymentServiceProxy['data'][contactId].lastPaymentAmount;
                this.lastPaymentDate = this.paymentServiceProxy['data'][contactId].lastPaymentDate;
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
        }, this.constructor.name);
    }

    formatDate(date: moment.Moment) {
        return date.utc().format('MMM D, YYYY');
    }

    private createPaymentsCache(contactId: number) {
        if (!this.paymentServiceProxy['data'] || !this.paymentServiceProxy['data'][contactId]) {
            this.paymentServiceProxy['data'] = {
                [contactId]: { payments: null, lastPaymentAmount: null, lastPaymentDate: null, paymentMethods: null }
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

    getCardTypeFromNumber(cardNumber: string): string {
        return CreditCard.cardFromNumber(cardNumber).type;
    }

    paymentsScrollHeight() {
        return document.body.clientHeight - this.paymentsContainer.nativeElement.querySelector('h3').getBoundingClientRect().bottom;
    }

    paymentMethodsScrollHeight() {
        return document.body.clientHeight - this.paymentMethodsContainer.nativeElement.querySelector('.title').getBoundingClientRect().bottom;
    }

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.constructor.name);
        this.contactInfoSubscription.unsubscribe();
    }
}
