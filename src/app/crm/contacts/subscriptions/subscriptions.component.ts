/** Core imports */
import { Component, OnInit, Injector } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { map } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactServiceProxy, OrderSubscriptionServiceProxy, OrderSubscriptionDto, ContactInfoDto,
    NameValueDto,
    FindUsersInput,
    CommonLookupServiceProxy
} from 'shared/service-proxies/service-proxies';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { ContactsService } from '../contacts.service';

@Component({
    selector: 'subscriptions',
    templateUrl: './subscriptions.component.html',
    styleUrls: ['./subscriptions.component.less']
})
export class SubscriptionsComponent extends AppComponentBase implements OnInit {
    public data: {
        contactInfo: ContactInfoDto
    };
    public dataSource: OrderSubscriptionDto[] = [];
    impersonateTenantId: number;

    constructor(
        injector: Injector,
        private _contactService: ContactServiceProxy,
        private _contactsService: ContactsService,
        private _orderSubscriptionService: OrderSubscriptionServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy,
        private _impersonationService: ImpersonationService,
        private _dialog: MatDialog
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        _contactsService.invalidateSubscribe((area) => {
            if (area == 'subscriptions') {
                this.refreshData(true);
            }
        });
    }

    ngOnInit() {
        this.data = this._contactService['data'];
        this.refreshData();
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

    showUserImpersonateLookUpModal(e, record: any): void {
        this.impersonateTenantId = record.tenantId;
        const impersonateDialog = this._dialog.open(CommonLookupModalComponent, {
            panelClass: [ 'slider', 'common-lookup' ],
            data: { tenantId: this.impersonateTenantId }
        });
        impersonateDialog.componentInstance.itemSelected.subscribe((item: NameValueDto) => {
            this.impersonateUser(item);
        });
        e.stopPropagation();
    }

    impersonateUser(item: NameValueDto): void {
        this._impersonationService.impersonate(
            parseInt(item.value),
            this.impersonateTenantId
        );
    }
}
