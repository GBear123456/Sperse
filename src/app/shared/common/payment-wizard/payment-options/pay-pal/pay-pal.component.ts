import { Component, OnInit, Injector, ChangeDetectionStrategy, Input } from '@angular/core';

import { Router } from '@angular/router';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppComponentBase } from '@shared/common/app-component-base';

import {
    EditionSelectDto,
    CreatePaymentDto,
    ExecutePaymentDto,
    CreatePaymentDtoPaymentPeriodType,
    CreatePaymentDtoEditionPaymentType,
    ExecutePaymentDtoPaymentPeriodType,
    ExecutePaymentDtoEditionPaymentType,
    PaymentServiceProxy
} from '@shared/service-proxies/service-proxies';

import {
    PaymentPeriodType,
    SubscriptionPaymentGatewayType,
    EditionPaymentType
} from '@shared/AppEnums';

@Component({
    selector: 'pay-pal',
    templateUrl: './pay-pal.component.html',
    styleUrls: ['./pay-pal.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayPalComponent extends AppComponentBase implements OnInit {
    @Input() descriptionText = this.l('PayPalPaymentDescriptionText');

    @Input() selectedPaymentPeriodType: PaymentPeriodType = PaymentPeriodType.Monthly;
    @Input() editionPaymentType: EditionPaymentType;

    _edition: EditionSelectDto = new EditionSelectDto();

    @Input()
    get edition() {
        return this._edition;
    }

    set edition(val: EditionSelectDto) {
        this._edition = val;
    }

    subscriptionPaymentGateway = SubscriptionPaymentGatewayType;

    constructor(injector: Injector,
        private _paymentAppService: PaymentServiceProxy,
        private _appSessionService: AppSessionService,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnInit() {
        this.startLoading();
        jQuery.getScript('https://www.paypalobjects.com/api/checkout.js')
            .done(() => {
                this.finishLoading();
                this.preparePaypalButton();
            }
        );
    }

    getAdditionalData(key: string): string {
        return this._edition.additionalData['paypal'][key];
    }

    setAdditionalData(key: string, value: string): string {
        return this._edition.additionalData['paypal'][key] = value;
    }

    preparePaypalButton(): void {
        const self = this;
        (<any>window).paypal.Button.render({
            style: {
                //label: 'checkout',
                size:  'responsive',    // small | medium | large | responsive
                shape: 'pill',          // pill | rect
                color: 'blue'           // gold | blue | silver | black
            },
            env: 'sandbox', //!!VP shoud be some strategy
//            commit: true, //!!VP if used server side integration
            client: {
                sandbox:    'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R',
                production: '<insert production client id>'
            },
            payment(data, actions) {
/*
                const input = new CreatePaymentDto();
                input.editionId = self.edition.id;
                input.editionPaymentType = <CreatePaymentDtoEditionPaymentType>(self.editionPaymentType);
                input.subscriptionPaymentGatewayType = self.subscriptionPaymentGateway.Paypal;
                input.paymentPeriodType = <CreatePaymentDtoPaymentPeriodType>(self.selectedPaymentPeriodType);
                return self._paymentAppService
                    .createPayment(input).toPromise()
                    .then((result: any) => {
                        return result.id;
                    });
*/
                 return actions.payment.create({
                    payment: {
                        transactions: [
                            {
                                amount: { total: '0.01', currency: 'USD' }
                            }
                        ]
                    }
                });
            },

            onAuthorize(data, actions) {
                return actions.payment.execute().then(function() {
/*
                const input = new ExecutePaymentDto();
                input.gateway = self.subscriptionPaymentGateway.Paypal;
                input.paymentPeriodType = <ExecutePaymentDtoPaymentPeriodType>(self.selectedPaymentPeriodType);
                input.editionId = self.edition.id;
                input.editionPaymentType = <ExecutePaymentDtoEditionPaymentType>(self.editionPaymentType);

                self.setAdditionalData('PaymentId', data.paymentID);
                self.setAdditionalData('PayerId', data.payerID);
                input.additionalData = self._edition.additionalData.paypal;

                self._paymentAppService
                    .executePayment(input)
                    .toPromise().then((result: ExecutePaymentDto) => {
                        self._router.navigate(['app/admin/subscription-management']);
                    });
*/

                });
            }
        }, '#paypal-button');
    }
}