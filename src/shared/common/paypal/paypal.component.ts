import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { RootComponent } from '@root/root.component';

import { ButtonType } from './button-type.enum';
import { ButtonConfigInterface } from './button-config.interface';
import { Currency } from '../../service-proxies/service-proxies';

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
        for (let config of this.getConfigsArray()) {
            if (config.actions) {
                if (value)
                    config.actions.disable();
                else
                    config.actions.enable();
            }
        }
    }
    @Input() height;
    @Input() showButtonType: ButtonType = null;
    @Output() onApprove: EventEmitter<any> = new EventEmitter();

    buttonType = ButtonType;

    isDisabled: boolean;
    type: ButtonType;
    requestPayment: () => Promise<string>;
    requestSubscription: () => Promise<string>;

    paymentButtonId = 'paypal-button-payment';
    subscriptionButtonId = 'paypal-button-subscription';

    config: { [id in ButtonType]?: ButtonConfigInterface } = {
        [ButtonType.Payment]: {
            isEnabled: false,
            namespace: 'paypal_payment',
            buttonId: this.paymentButtonId,
            initialized: false,
        },
        [ButtonType.Subscription]: {
            isEnabled: false,
            namespace: 'paypal_subscription',
            buttonId: this.subscriptionButtonId,
            initialized: false
        }
    };

    constructor(
        private root: RootComponent
    ) { }

    get initialized(): boolean {
        let enbaledConfigs = this.getConfigsArray();
        if (enbaledConfigs.length == 0)
            return false;

        return enbaledConfigs.reduce((prev, curr) => prev && curr.initialized, true);
    }

    initialize(clientId: string, type: ButtonType, requestPayment: () => Promise<string>, requestSubscription: () => Promise<string>, currency: Currency) {
        if (!clientId)
            return;

        this.type = type;
        this.requestPayment = requestPayment;
        this.requestSubscription = requestSubscription;

        if (type == ButtonType.Subscription || type == ButtonType.Both) {
            this.initializeScript(clientId, ButtonType.Subscription, currency);
        }

        if (type == ButtonType.Payment || type == ButtonType.Both) {
            this.initializeScript(clientId, ButtonType.Payment, currency);
        }
    }

    private initializeScript(clientId: string, type: ButtonType, currency: Currency) {
        let typeConfig = this.config[type];
        typeConfig.isEnabled = true;

        if ((<any>window)[typeConfig.namespace])
            setTimeout(() => {
                this.preparePaypalButton(type, typeConfig.namespace, typeConfig.buttonId);
            });
        else {
            let payPalUrl = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
            if (type == ButtonType.Subscription)
                payPalUrl += '&vault=true&intent=subscription';

            let data = {
                namespace: typeConfig.namespace
            };
            this.root.addScriptLink(payPalUrl, 'text/javascript', () => {
                this.preparePaypalButton(type, typeConfig.namespace, typeConfig.buttonId);
            }, data);
        }
    }

    preparePaypalButton(type: ButtonType, namespace: string, buttonId: string): void {
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
                self.config[type].actions = actions;
                if (self.isDisabled) {
                    actions.disable();
                }
            }
        };

        if (type == ButtonType.Subscription)
            this.prepareSubscriptionConfig(configObject);
        else
            this.preparePaymentConfig(configObject);

        (<any>window)[namespace].Buttons(configObject).render(`#${buttonId}`);

        this.config[type].initialized = true;
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

    checkHide(type: ButtonType) {
        if (this.showButtonType == null || this.showButtonType == ButtonType.Both)
            return false;

        return type != this.showButtonType;
    }

    private getConfigsArray(): ButtonConfigInterface[] {
        let array: ButtonConfigInterface[] = [];
        let paymentConfig = this.config[ButtonType.Payment];
        let subscriptionConfig = this.config[ButtonType.Subscription];

        if (paymentConfig.isEnabled)
            array.push(paymentConfig);
        if (subscriptionConfig.isEnabled)
            array.push(subscriptionConfig);
        return array;
    }
}
