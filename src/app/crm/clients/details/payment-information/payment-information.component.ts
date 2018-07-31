import { Component, OnInit, Injector } from '@angular/core';

import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CustomersServiceProxy, BillingSubscriptionServiceProxy, BillingSubscriptionDto, CustomerInfoDto } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'payment-information',
    templateUrl: './payment-information.component.html',
    styleUrls: ['./payment-information.component.less'],
    providers: [BillingSubscriptionServiceProxy]
})
export class PaymentInformationComponent extends AppComponentBase implements OnInit {
    public data: {
        customerInfo: CustomerInfoDto
    };
    public dataSource: BillingSubscriptionDto[] = [];
    private formatting = AppConsts.formatting;

    constructor(
        injector: Injector,
        private _customerService: CustomersServiceProxy,
        private _billingService: BillingSubscriptionServiceProxy,
    ) {
        super(injector);
    }

    ngOnInit() {
        this.data = this._customerService['data'];

        if (this.data.customerInfo.primaryContactInfo && this.data.customerInfo.primaryContactInfo.userId) {
            this._billingService
            .getSubscriptionsHistory(this.data.customerInfo.primaryContactInfo.userId)
            .subscribe(result => {
                this.dataSource = result;
            });
        }
    }
}
