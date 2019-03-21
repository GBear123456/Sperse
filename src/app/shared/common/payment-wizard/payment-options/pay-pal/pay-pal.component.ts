import { Component, AfterViewInit, Injector, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import {
    TenantSubscriptionServiceProxy,
    ModuleSubscriptionInfoFrequency,
    RequestPaymentDto,
    RequestPaymentDtoRequestType,
    ModuleSubscriptionInfo,
    RequestPaymentResult
} from '@shared/service-proxies/service-proxies';
import { PayPalDataModel } from '@app/shared/common/payment-wizard/models/pay-pal-data.model';

@Component({
    selector: 'pay-pal',
    templateUrl: './pay-pal.component.html',
    styleUrls: ['./pay-pal.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSubscriptionServiceProxy]
})
export class PayPalComponent extends AppComponentBase implements AfterViewInit {
    @Input() editionId: number;
    @Input() maxUserCount: number;
    @Input() billingPeriod: BillingPeriod = BillingPeriod.Monthly;
    @Input() clientId: string;

    @Output() onSubmit: EventEmitter<PayPalDataModel> = new EventEmitter<PayPalDataModel>();

    descriptionText = this.l('PayPalPaymentDescriptionText');

    constructor(injector: Injector,
        private tenantSubscriptionServiceProxy: TenantSubscriptionServiceProxy
    ) {
        super(injector);
    }

    ngAfterViewInit() {
        this.startLoading();
        if ((<any>window)['paypal'])
            setTimeout(() => { this.preparePaypalButton(); });
        else {
            jQuery.ajaxSetup({ cache: true });
            jQuery.getScript(`https://www.paypal.com/sdk/js?client-id=${this.clientId}&currency=USD`)
                .done(() => { this.preparePaypalButton(); });
            jQuery.ajaxSetup({ cache: false });
        }
    }

    preparePaypalButton(): void {
        const self = this;
        let frequency = this.billingPeriod == BillingPeriod.Monthly
            ? ModuleSubscriptionInfoFrequency._30
            : ModuleSubscriptionInfoFrequency._365;
        let model = new RequestPaymentDto();
        model.subscriptionInfo = new ModuleSubscriptionInfo();
        model.subscriptionInfo.editionId = this.editionId;
        model.subscriptionInfo.maxUserCount = this.maxUserCount;
        model.subscriptionInfo.frequency = frequency;
        model.requestType = RequestPaymentDtoRequestType.PayPal;

        this.finishLoading();
        (<any>window).paypal.Buttons({
            style: {
                layout: 'horizontal',
                shape: 'pill',          // pill | rect
                color: 'blue',           // gold | blue | silver
                label: 'checkout'
            },
            createOrder(data, actions) {
                return self.tenantSubscriptionServiceProxy
                    .requestPayment(model)
                    .toPromise()
                    .then((result: RequestPaymentResult) => {
                        return result.code;
                    });
            },

            onApprove(data, actions) {
                self.onSubmit.next({
                    payerId: data.payerID,
                    paymentId: data.paymentID
                });
            }
        }).render('#paypal-button');
    }
}
