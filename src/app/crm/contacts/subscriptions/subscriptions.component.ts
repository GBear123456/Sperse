/** Core imports */
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { MatDialog } from '@angular/material/dialog';
import { map, first } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import {
    ContactServiceProxy,
    OrderSubscriptionServiceProxy,
    OrderSubscriptionDto,
    ContactInfoDto,
    NameValueDto,
    CommonLookupServiceProxy,
    CancelOrderSubscriptionInput,
    LeadInfoDto
} from '@shared/service-proxies/service-proxies';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { ContactsService } from '../contacts.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { AppPermissions } from '@shared/AppPermissions';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AddSubscriptionDialogComponent } from '@app/crm/contacts/subscriptions/add-subscription-dialog/add-subscription-dialog.component';
import { CancelSubscriptionDialogComponent } from '@app/crm/contacts/subscriptions/cancel-subscription-dialog/cancel-subscription-dialog.component';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissionService } from '@shared/common/auth/permission.service';

@Component({
    selector: 'subscriptions',
    templateUrl: './subscriptions.component.html',
    styleUrls: ['./subscriptions.component.less']
})
export class SubscriptionsComponent implements OnInit, OnDestroy {
    @ViewChild('mainGrid', { static: false }) dataGrid: DxDataGridComponent;
    public data: {
        contactInfo: ContactInfoDto,
        leadInfo: LeadInfoDto
    };
    pagerConfig = DataGridService.defaultGridPagerConfig;

    currency: string;
    public dataSource: DataSource;
    showAll = false;
    impersonateTenantId: number;
    permissions = AppPermissions;
    manageAllowed = false;
    formatting = AppConsts.formatting;
    userTimezone = DateHelper.getUserTimezone();
    private readonly ident = 'Subscriptions';

    constructor(
        private invoicesService: InvoicesService,
        private contactService: ContactServiceProxy,
        private contactsService: ContactsService,
        private orderSubscriptionService: OrderSubscriptionServiceProxy,
        private commonLookupService: CommonLookupServiceProxy,
        private impersonationService: ImpersonationService,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        public permission: AppPermissionService,
        public ls: AppLocalizationService
    ) {
        contactsService.invalidateSubscribe((area: string) => {
            if (area === 'subscriptions') {
                this.refreshData(true);
            }
        }, this.ident);
        invoicesService.settings$.pipe(first()).subscribe(res => this.currency = res.currency);
    }

    ngOnInit() {
        this.contactsService.contactInfoSubscribe(contactInfo => {
            this.manageAllowed = this.permission.isGranted(AppPermissions.CRMOrdersManage)
                && this.permission.checkCGPermission(contactInfo.groupId);
            this.data = this.contactService['data'];
            this.refreshData();
        }, this.ident);
    }

    setDataSource(data: OrderSubscriptionDto[]) {
        _.mapObject(
            _.groupBy(data, (item: OrderSubscriptionDto) => item.serviceTypeId),
            (values: OrderSubscriptionDto[]) => {
                let chain = _.chain(values).sortBy('id').reverse().value();
                if (!chain.some(item => {
                    if (item.status == 'Current')
                        return item['isLastSubscription'] = true;
                })) chain[0]['isLastSubscription'] = true;
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

    cancelSubscription(id: number, $event) {
        this.dialog.closeAll();
        $event.stopPropagation();
        this.dialog.open(CancelSubscriptionDialogComponent, {
            width: '400px',
            data: {
                title: this.ls.l('CancelBillingConfirm')
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.orderSubscriptionService
                    .cancel(new CancelOrderSubscriptionInput({
                        orderSubscriptionId: id,
                        cancelationReason: result.cancellationReason
                    }))
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

        let leadId = this.route.parent.snapshot.paramMap.get('leadId') ?
            this.data.leadInfo.id :
            null;

        let data: any = { contactId: this.data.contactInfo.id, leadId: leadId };
        if (e && e.data) {
            const subscription: OrderSubscriptionDto = e.data;
            data = {
                ...data,
                endDate: subscription.endDate,
                systemType: subscription.systemType,
                code: subscription.serviceTypeId,
                name: subscription.serviceType,
                level: subscription.serviceId
            };
        }
        this.dialog.open(AddSubscriptionDialogComponent, {
            panelClass: ['slider'],
            hasBackdrop: false,
            closeOnNavigation: true,
            data: data
        });
        e.stopPropagation ? e.stopPropagation() : e.event.stopPropagation();
    }

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.ident);
    }
}
