import { Component, AfterViewInit, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import {
    TenantSubscriptionServiceProxy,
    PaymentPeriodType,
    RequestPaymentInput,
    RequestPaypalSubscriptionOutput
} from '@shared/service-proxies/service-proxies';
import { PayPalDataModel } from '@app/shared/common/payment-wizard/models/pay-pal-data.model';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'pay-pal',
    templateUrl: './pay-pal.component.html',
    styleUrls: ['./pay-pal.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSubscriptionServiceProxy]
})
export class PayPalComponent implements AfterViewInit {
    @Input() productId: number;
    @Input() paymentPeriodType: PaymentPeriodType;
    @Input() quantity: number;
    @Input() clientId: string;
    @Output() onSubmit: EventEmitter<PayPalDataModel> = new EventEmitter<PayPalDataModel>();
    descriptionText = this.ls.l('PayPalPaymentDescriptionText');

    constructor(
        private tenantSubscriptionServiceProxy: TenantSubscriptionServiceProxy,
        private loadingService: LoadingService,
        private ls: AppLocalizationService
    ) { }

    ngAfterViewInit() {
        this.loadingService.startLoading();
        if ((<any>window)['paypal'])
            setTimeout(() => { this.preparePaypalButton(); });
        else {
            jQuery.ajaxSetup({ cache: true });
            jQuery.getScript(`https://www.paypal.com/sdk/js?client-id=${this.clientId}&vault=true&intent=subscription`)
                .done(() => { this.preparePaypalButton(); });
            jQuery.ajaxSetup({ cache: false });
        }
    }

    preparePaypalButton(): void {
        const self = this;

        this.loadingService.finishLoading();

        let model = new RequestPaymentInput({
            productId: this.productId,
            paymentPeriodType: this.paymentPeriodType,
            quantity: this.quantity
        });
        let receiptUrl = '';
        //https://developer.paypal.com/sdk/js/reference/#link-paypalbuttonsoptions
        (<any>window).paypal.Buttons({
            style: {
                layout: 'horizontal',
                shape: 'pill',
                color: 'gold',
                label: 'pay'
            },
            createSubscription(data, actions) {
                return self.tenantSubscriptionServiceProxy
                    .requestPaypalSubscription(model)
                    .toPromise()
                    .then((result: RequestPaypalSubscriptionOutput) => {
                        receiptUrl = result.receiptUrl;
                        return result.code;
                    });
            },
            onApprove(data, actions) {
                window.location.href = receiptUrl;
            }
        }).render('#paypal-button');
    }
}
