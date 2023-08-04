import { Component, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'pay-pal',
    template: '<div id="paypal-button"></div>',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: []
})
export class PayPalComponent {
    @Output() onApprove: EventEmitter<any> = new EventEmitter();

    isSubscription: boolean;
    requestPayment: () => Promise<string>;
    requestSubscription: () => Promise<string>;

    constructor(
    ) { }

    initialize(clientId: string, isSubscription: boolean, requestPayment: () => Promise<string>, requestSubscription: () => Promise<string>) {
        this.isSubscription = isSubscription;
        this.requestPayment = requestPayment;
        this.requestSubscription = requestSubscription;

        if ((<any>window)['paypal'])
            setTimeout(() => { this.preparePaypalButton(); });
        else {
            jQuery.ajaxSetup({ cache: true });
            let payPalUrl = `https://www.paypal.com/sdk/js?client-id=${clientId}`;
            if (isSubscription)
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

        if (this.isSubscription)
            this.prepareSubscriptionConfig(configObject);
        else
            this.preparePaymentConfig(configObject);

        (<any>window).paypal.Buttons(configObject).render('#paypal-button');
    }

    prepareSubscriptionConfig(configObject) {
        const self = this;
        configObject['createSubscription'] = (data, actions) => {
            return this.requestSubscription();
        };
        configObject['onApprove'] = (data, actions) => {
            self.onApprove.emit();
        }
    }

    preparePaymentConfig(configObject) {
        const self = this;
        configObject['createOrder'] = (data, actions) => {
            return this.requestPayment();
        };
        configObject['onApprove'] = (data, actions) => {
            return actions.order.capture().then(function (details) {
                self.onApprove.emit();
            });
        }
    }
}
