/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { Subscription } from 'rxjs';
import {
    map,
    filter
} from 'rxjs/operators';

/** Application imports */
import { ContactsService } from '../contacts.service';
import {
    PaymentServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PaymentsInfoService } from '@app/shared/common/payments-info/payments-info.service';
import { ContactPaymentsInfoService } from './payments-info.service';

@Component({
    selector: 'payment-information',
    templateUrl: './payment-information.component.html',
    styleUrls: ['./payment-information.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentInformationComponent implements OnInit, OnDestroy {
    contactInfoSubscription: Subscription;
    private readonly ident = 'PaymentInformation';

    contactPaymentsInfoService: ContactPaymentsInfoService;

    constructor(
        paymentsInfoService: PaymentsInfoService,
        private paymentServiceProxy: PaymentServiceProxy,
        private contactsService: ContactsService,
        public ls: AppLocalizationService
    ) {
        this.contactPaymentsInfoService = <any>paymentsInfoService;
    }

    ngOnInit() {
        this.contactInfoSubscription = this.contactsService.contactInfo$.pipe(
            filter(contactInfo => !!contactInfo),
            map(contactInfo => contactInfo.id)
        ).subscribe(contactId => {
            /** Create data prop if not exists */
            this.paymentServiceProxy['data'] = this.paymentServiceProxy['data'] && this.paymentServiceProxy['data'][contactId]
                ? this.paymentServiceProxy['data']
                : { [contactId]: { paymentDto: null, paymentMethods: null } };
            this.contactPaymentsInfoService._refresh.next(false);
        });

        this.contactsService.invalidateSubscribe((area: string) => {
            if (area === 'payment-information') {
                this.contactPaymentsInfoService._refresh.next(true);
            }
        }, this.ident);
    }

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.ident);
        this.contactInfoSubscription.unsubscribe();
    }
}
