import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';

@Component({
    selector: 'pay-pal',
    templateUrl: 'paypal.component.html',
    styleUrls: ['./paypal.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: []
})
export class PayPalComponent {
    @Input() set disabled(value: boolean) {
        this.isDisabled = value;
        if (this.actions) {
            if (value)
                this.actions.disable();
            else
                this.actions.enable();
        }
    }
    @Input() height;
    @Output() onApprove: EventEmitter<any> = new EventEmitter();

    initialized: boolean = false;

    isDisabled: boolean;
    isSubscription: boolean;
    requestPayment: () => Promise<string>;
    requestSubscription: () => Promise<string>;

    actions: any;

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
                height: self.height
            },
            onInit(data, actions) {
                self.actions = actions;
                if (self.isDisabled) {
                    actions.disable();
                }
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

        this.initialized = true;
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
