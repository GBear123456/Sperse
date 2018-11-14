import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactServiceProxy, OrderSubscriptionServiceProxy, OrderSubscriptionDto, ContactInfoDto,
    NameValueDto,
    FindUsersInput,
    CommonLookupServiceProxy} from 'shared/service-proxies/service-proxies';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { map } from 'rxjs/operators';

@Component({
    selector: 'subscriptions',
    templateUrl: './subscriptions.component.html',
    styleUrls: ['./subscriptions.component.less']
})
export class SubscriptionsComponent extends AppComponentBase implements OnInit {
    @ViewChild('impersonateUserLookupModal') impersonateUserLookupModal: CommonLookupModalComponent;

    public data: {
        contactInfo: ContactInfoDto
    };
    public dataSource: OrderSubscriptionDto[] = [];

    constructor(
        injector: Injector,
        private _contactService: ContactServiceProxy,
        private _orderSubscriptionService: OrderSubscriptionServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy,
        private _impersonationService: ImpersonationService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        this.data = this._contactService['data'];
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

    refreshData(forced = false) {
        let subData = this._orderSubscriptionService['data'],
            groupId = this.data.contactInfo.id;
        if (!forced && subData && subData.groupId == groupId)
            this.dataSource = subData.source;
        else
            this._orderSubscriptionService
                .getSubscriptionHistory(groupId)
                /** Filter draft subscriptions */
                .pipe(map(subscriptions => subscriptions.filter(subscription => subscription.statusCode !== 'D')))
                .subscribe(result => {
                    this._orderSubscriptionService['data'] = {
                        groupId: groupId,
                        source: this.dataSource = result
                    };
                });
    }

    cancelSubscription(id: number) {
        abp.message.confirm('', this.l('CancelBillingConfirm'), result => {
            if (result) {
                this._orderSubscriptionService
                    .cancel(id)
                    .subscribe(() => {
                        abp.notify.success(this.l('Cancelled'));
                        this.refreshData(true);
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
