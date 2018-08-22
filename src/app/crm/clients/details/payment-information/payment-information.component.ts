import { Component, OnInit, Injector } from '@angular/core';

import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CustomersServiceProxy, OrderSubscriptionServiceProxy, OrderSubscriptionDto, CustomerInfoDto } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'payment-information',
    templateUrl: './payment-information.component.html',
    styleUrls: ['./payment-information.component.less'],
    providers: [OrderSubscriptionServiceProxy]
})
export class PaymentInformationComponent extends AppComponentBase implements OnInit {
    public data: {
        customerInfo: CustomerInfoDto
    };
    public dataSource: OrderSubscriptionDto[] = [];

    constructor(
        injector: Injector,
        private _customerService: CustomersServiceProxy,
        private _orderSubscriptionService: OrderSubscriptionServiceProxy,
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        this.data = this._customerService['data'];
        this.refreshData();
    }

    refreshData() {
        this._orderSubscriptionService
            .getSubscriptionHistory(this.data.customerInfo.id)
            .subscribe(result => {
                this.dataSource = result;
            });
    }

    cancelSubscription(id: number) {
        abp.message.confirm('', this.l('CancelBillingConfirm'), result => {
            if (result) {
                this._orderSubscriptionService
                    .cancel(id)
                    .subscribe(() => {
                        abp.notify.success(this.l('Cancelled'));
                        this.refreshData();
                    });
            }
        });
    }
}
