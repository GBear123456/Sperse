/** Core imports */
import { Component, OnInit, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { MatDialog } from '@angular/material';
import { map } from 'rxjs/operators';
import * as _ from 'underscore';

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
import { DxDataGridComponent } from 'devextreme-angular';

@Component({
    selector: 'subscriptions',
    templateUrl: './subscriptions.component.html',
    styleUrls: ['./subscriptions.component.less']
})
export class SubscriptionsComponent extends AppComponentBase implements OnInit {
    @ViewChild('mainGrid') dataGrid: DxDataGridComponent;
    public data: {
        contactInfo: ContactInfoDto
    };

    public dataSource: DataSource;
    showAll = false;
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
        super(injector);
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

    setDataSource(data: OrderSubscriptionDto[]) {
        _.mapObject(
            _.groupBy(data, (item: OrderSubscriptionDto) => item.serviceType),
            (values: OrderSubscriptionDto[]) => {
                _.chain(values).sortBy('id').reverse().value()[0]['isLastSubscription'] = true;
            });

        this.dataSource = new DataSource(data);
        this.filterDataSource();
    }

    refreshData(forced = false) {
        let subData = this._orderSubscriptionService['data'],
            groupId = this.data.contactInfo.id;
        if (!forced && subData && subData.groupId == groupId)
            this.setDataSource(subData.source);
        else
            this._orderSubscriptionService
                .getSubscriptionHistory(groupId)
                /** Filter draft subscriptions */
                .pipe(map(subscriptions => subscriptions.filter(subscription => subscription.statusCode !== 'D')))
                .subscribe(result => {
                    this._orderSubscriptionService['data'] = {
                        groupId: groupId,
                        source: result
                    };

                    this.setDataSource(result);
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

    toggleHistory() {
        this.showAll = !this.showAll;
        this.filterDataSource();
    }

    filterDataSource() {
        if (this.showAll)
            this.dataSource.filter(null);
        else
            this.dataSource.filter([['isLastSubscription', '=', true]]);

        if (this.dataGrid && this.dataGrid.instance)
            this.dataGrid.instance.clearSorting();
        this.dataSource.sort(['serviceType', { getter: 'id', desc: true }]);
        this.dataSource.load();
    }
}
