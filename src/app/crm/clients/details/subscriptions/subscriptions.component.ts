import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactGroupServiceProxy, OrderSubscriptionServiceProxy, OrderSubscriptionDto, ContactGroupInfoDto,
    NameValueDto,
    FindUsersInput,
    CommonLookupServiceProxy} from 'shared/service-proxies/service-proxies';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';
import { ImpersonationService } from '@app/admin/users/impersonation.service';

@Component({
    selector: 'subscriptions',
    templateUrl: './subscriptions.component.html',
    styleUrls: ['./subscriptions.component.less'],
    providers: [ OrderSubscriptionServiceProxy ]
})
export class SubscriptionsComponent extends AppComponentBase implements OnInit {
    @ViewChild('impersonateUserLookupModal') impersonateUserLookupModal: CommonLookupModalComponent;

    public data: {
        customerInfo: ContactGroupInfoDto
    };
    public dataSource: OrderSubscriptionDto[] = [];

    constructor(
        injector: Injector,
        private _customerService: ContactGroupServiceProxy,
        private _orderSubscriptionService: OrderSubscriptionServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy,
        private _impersonationService: ImpersonationService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        this.data = this._customerService['data'];
        this.refreshData();

        this.impersonateUserLookupModal.configure({
            title: this.l('SelectAUser'),
            dataSource: (skipCount: number, maxResultCount: number, filter: string, tenantId?: number) => {
                let input = new FindUsersInput();
                input.filter = filter;
                input.maxResultCount = maxResultCount;
                input.skipCount = skipCount;
                input.tenantId = tenantId;
                return this._commonLookupService.findUsers(input);
            }
        });
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

    showUserImpersonateLookUpModal(record: any): void {
        this.impersonateUserLookupModal.tenantId = record.tenantId;
        this.impersonateUserLookupModal.show();
    }

    impersonateUser(item: NameValueDto): void {
        this._impersonationService
            .impersonate(
                parseInt(item.value),
                this.impersonateUserLookupModal.tenantId
            );
    }
}
