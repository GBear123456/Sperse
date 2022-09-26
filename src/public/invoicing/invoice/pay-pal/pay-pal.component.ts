import { Component, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import {
    PayPalServiceProxy,
    InvoicePaypalPaymentInfo
} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'pay-pal',
    template: '<div id="paypal-button"></div>',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        PayPalServiceProxy
    ]
})
export class PayPalComponent {
    tenantId: number;
    publicId: string;
    paymentInfo: InvoicePaypalPaymentInfo;
    @Output() onApprove: EventEmitter<any> = new EventEmitter();

    constructor(
        private payPalServiceProxy: PayPalServiceProxy
    ) { }

    initialize(tenantId: number, publicId: string, paymentInfo: InvoicePaypalPaymentInfo) {
        this.tenantId = tenantId;
        this.publicId = publicId;
        this.paymentInfo = paymentInfo;

        if (!this.paymentInfo.isApplicable)
            return;

        if ((<any>window)['paypal'])
            setTimeout(() => { this.preparePaypalButton(); });
        else {
            jQuery.ajaxSetup({ cache: true });
            let payPalUrl = `https://www.paypal.com/sdk/js?client-id=${this.paymentInfo.clientId}`;
            if (this.paymentInfo.isSubscription)
                payPalUrl += '&vault=true&intent=subscription';

            jQuery.getScript(payPalUrl).done(() => { this.preparePaypalButton(); });
            jQuery.ajaxSetup({ cache: false });
        }
    }

    preparePaypalButton(): void {
        const self = this;

        //https://developer.paypal.com/sdk/js/reference/#link-paypalbuttonsoptions
        let configObject = {
            style: {
                layout: 'horizontal',
                shape: 'rect',
                color: 'gold',
                label: 'pay',
                tagline: false,
                height: 38
            },
            onApprove(data, actions) {
                return actions.order.capture().then(function (details) {
                    self.onApprove.emit();
                });
            }
        };

        if (this.paymentInfo.isSubscription)
            this.prepareSubscriptionConfig(configObject);
        else
            this.preparePaymentConfig(configObject);

        (<any>window).paypal.Buttons(configObject).render('#paypal-button');
    }

    prepareSubscriptionConfig(configObject) {
        const self = this;
        configObject['createSubscription'] = (data, actions) => {
            return self.payPalServiceProxy
                .requestSubscription(self.tenantId, self.publicId)
                .toPromise()
                .then((code) => {
                    return code;
                });
        };
        configObject['onApprove'] = (data, actions) => {
            self.onApprove.emit();
        }
    }

    preparePaymentConfig(configObject) {
        const self = this;
        configObject['createOrder'] = (data, actions) => {
            return self.payPalServiceProxy
                .requestPayment(self.tenantId, self.publicId)
                .toPromise()
                .then((code) => {
                    return code;
                });
        };
        configObject['onApprove'] = (data, actions) => {
            return actions.order.capture().then(function (details) {
                self.onApprove.emit();
            });
        }
    }
}
