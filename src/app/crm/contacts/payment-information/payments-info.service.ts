/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';

/** Application imports */
import {
    ContactServiceProxy,
    GetPaymentsDto,
    PaymentMethodInfo,
    PaymentServiceProxy
} from 'shared/service-proxies/service-proxies';
import { PaymentsInfoService } from '@app/shared/common/payments-info/payments-info.service';

@Injectable()
export class ContactPaymentsInfoService extends PaymentsInfoService {
    _refresh: BehaviorSubject<boolean> = new BehaviorSubject(false);
    refresh: Observable<boolean> = this._refresh.asObservable().pipe(
        filter(() => {
            if (!this.contactService['data'].contactInfo.id) {
                this.paymentServiceProxy['data'] = null;
                return false;
            }
            return true;
        })
    );

    constructor(
        private paymentServiceProxy: PaymentServiceProxy,
        private contactService: ContactServiceProxy,
    ) {
        super();
    }

    getPaymentsObserverable(): Observable<GetPaymentsDto> {
        let obs = this.refresh.pipe(
            switchMap(
                (refresh: boolean) => {
                    const contactId = this.contactService['data'].contactInfo.id;
                    return (!refresh && this.paymentServiceProxy['data'] && this.paymentServiceProxy['data'][contactId]
                        && this.paymentServiceProxy['data'][contactId].paymentDto
                        ? of(this.paymentServiceProxy['data'][contactId].paymentDto)
                        : this.paymentServiceProxy.getPayments(contactId).pipe(
                            tap(paymentInfo => {
                                this.createPaymentsCache(this.contactService['data'].contactInfo.id);
                                this.paymentServiceProxy['data'][contactId].paymentDto = paymentInfo
                            })
                        ));
                }
            ),
            publishReplay(),
            refCount()
        );

        return obs;
    }

    getPaymentMethodsObserverable(): Observable<PaymentMethodInfo[]> {
        return this.refresh.pipe(
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
    }

    private createPaymentsCache(contactId: number) {
        if (!this.paymentServiceProxy['data'] || !this.paymentServiceProxy['data'][contactId]) {
            this.paymentServiceProxy['data'] = {
                [contactId]: { paymentDto: null, paymentMethods: null }
            };
        }
    }
}