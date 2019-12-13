/** Core imports */
import { Component, OnInit, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { MatDialog } from '@angular/material';
import { map, first } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import {
    ContactServiceProxy, OrderSubscriptionServiceProxy, OrderSubscriptionDto, ContactInfoDto,
    NameValueDto,
    CommonLookupServiceProxy
} from 'shared/service-proxies/service-proxies';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { ContactsService } from '../contacts.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { AppPermissions } from '@shared/AppPermissions';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AddSubscriptionDialogComponent } from '@app/crm/contacts/subscriptions/add-subscription-dialog/add-subscription-dialog.component';

@Component({
    selector: 'subscriptions',
    templateUrl: './subscriptions.component.html',
    styleUrls: ['./subscriptions.component.less']
})
export class SubscriptionsComponent implements OnInit {
    @ViewChild('mainGrid') dataGrid: DxDataGridComponent;
    public data: {
        contactInfo: ContactInfoDto
    };

    currency: string;
    public dataSource: DataSource;
    showAll = false;
    impersonateTenantId: number;
    permissions = AppPermissions;
    constructor(
        injector: Injector,
        private invoicesService: InvoicesService,
        private contactService: ContactServiceProxy,
        private contactsService: ContactsService,
        private orderSubscriptionService: OrderSubscriptionServiceProxy,
        private commonLookupService: CommonLookupServiceProxy,
        private impersonationService: ImpersonationService,
        private dialog: MatDialog,
        public permission: PermissionCheckerService,
        public ls: AppLocalizationService
    ) {
        contactsService.invalidateSubscribe((area) => {
            if (area == 'subscriptions') {
                this.refreshData(true);
            }
        });
        invoicesService.settings$.pipe(first()).subscribe(res => this.currency = res.currency);
    }

    ngOnInit() {
        this.data = this.contactService['data'];
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
        let subData = this.orderSubscriptionService['data'],
            groupId = this.data.contactInfo.id;
        if (!forced && subData && subData.groupId == groupId)
            this.setDataSource(subData.source);
        else
            this.orderSubscriptionService
                .getSubscriptionHistory(groupId)
                /** Filter draft subscriptions */
                .pipe(map(subscriptions => subscriptions.filter(subscription => subscription.statusCode !== 'D')))
                .subscribe(result => {
                    this.orderSubscriptionService['data'] = {
                        groupId: groupId,
                        source: result
                    };

                    this.setDataSource(result);
                });
    }

    cancelSubscription(id: number) {
        abp.message.confirm('', this.ls.l('CancelBillingConfirm'), result => {
            if (result) {
                this.orderSubscriptionService
                    .cancel(id)
                    .subscribe(() => {
                        abp.notify.success(this.ls.l('Cancelled'));
                        this.refreshData(true);
                    });
            }
        });
    }

    showUserImpersonateLookUpModal(e, record: any): void {
        this.impersonateTenantId = record.tenantId;
        const impersonateDialog = this.dialog.open(CommonLookupModalComponent, {
            panelClass: [ 'slider' ],
            data: { tenantId: this.impersonateTenantId }
        });
        impersonateDialog.componentInstance.itemSelected.subscribe((item: NameValueDto) => {
            this.impersonateUser(item);
        });
        e.stopPropagation();
    }

    impersonateUser(item: NameValueDto): void {
        this.impersonationService.impersonate(
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

    openSubscriptionDialog(e?: any) {
        this.dialog.closeAll();
        let data: any = { contactId: this.data.contactInfo.id };
        if (e && e.data) {
            const subscription: OrderSubscriptionDto = e.data;
            data = {
                ...data,
                endDate: subscription.endDate,
                systemType: subscription.systemType,
                code: subscription.statusCode,
                name: subscription.serviceTypeName
            };
        }
        this.dialog.open(AddSubscriptionDialogComponent, {
            panelClass: ['slider'],
            disableClose: false,
            hasBackdrop: false,
            closeOnNavigation: true,
            data: data
        });
        e.stopPropagation ? e.stopPropagation() : e.event.stopPropagation();
    }
}
