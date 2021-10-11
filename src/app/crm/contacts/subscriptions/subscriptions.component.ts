/** Core imports */
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { MatDialog } from '@angular/material/dialog';
import { map, first, filter, finalize } from 'rxjs/operators';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';

/** Application imports */
import {
    InvoiceSettings,
    ContactServiceProxy,
    OrderSubscriptionServiceProxy,
    UpdateOrderSubscriptionInput,
    OrderSubscriptionDto,
    SubscriptionInput,
    ContactInfoDto,
    NameValueDto,
    CommonLookupServiceProxy,
    CancelOrderSubscriptionInput,
    UpdateOrderSubscriptionPeriodInput,
    LeadInfoDto,
    LayoutType
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
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ActionMenuComponent } from '@app/shared/common/action-menu/action-menu.component';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { AppService } from '@app/app.service';

@Component({
    selector: 'subscriptions',
    templateUrl: './subscriptions.component.html',
    styleUrls: ['./subscriptions.component.less']
})
export class SubscriptionsComponent implements OnInit, OnDestroy {
    @ViewChild(ActionMenuComponent, { static: false }) actionMenu: ActionMenuComponent;
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
    isBankCodeLayout: boolean = this.userManagementService.isLayout(LayoutType.BankCode);
    public actionRecordData: any;
    public actionMenuItems: ActionMenuItem[]  = [
        {
            text: this.ls.l('Cancel'),
            class: 'cancel',
            action: () => {
                this.cancelSubscription.bind(this);
            }
        }
    ];

    constructor(
        private invoicesService: InvoicesService,
        private contactsService: ContactsService,
        private contactService: ContactServiceProxy,
        private orderSubscriptionProxy: OrderSubscriptionServiceProxy,
        private commonLookupService: CommonLookupServiceProxy,
        private impersonationService: ImpersonationService,
        private userManagementService: UserManagementService,
        private loadingService: LoadingService,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        public appService: AppService,
        public permission: AppPermissionService,
        public ls: AppLocalizationService
    ) {
        contactsService.invalidateSubscribe((area: string) => {
            if (area === 'subscriptions') {
                this.refreshData(true);
            }
        }, this.ident);
        invoicesService.settings$.pipe(filter(Boolean), first()).subscribe(
            (res: InvoiceSettings) => this.currency = res.currency);
    }

    ngOnInit() {
        this.contactsService.contactInfoSubscribe((contactInfo: ContactInfoDto) => {
            if (contactInfo) {
                this.manageAllowed = abp.session.tenantId && this.permission.isGranted(AppPermissions.CRMOrdersManage)
                    && this.permission.checkCGPermission(contactInfo.groupId);
                this.data = this.contactService['data'];
                this.refreshData();
            }
        }, this.ident);
    }

    onCellClick($event) {
        let target = $event.event.target;
        if ($event.rowType === 'data') {
            if (target.closest('.dx-link.dx-link-edit'))
                this.toggleActionsMenu($event.data, target);
        }
    }

    toggleActionsMenu(data, target) {
        this.actionRecordData = data;
        this.actionMenu.toggle(target);
    }

    onMenuItemClick($event) {
        $event.itemData.action.call(this);
        this.actionRecordData = null;
        //this.actionMenu.hide();
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    setDataSource(data: OrderSubscriptionDto[]) {
        let currentServices = [];
        data.forEach(item => {
            if (item.status == 'Current') {
                item['isLastSubscription'] = true;
                currentServices = currentServices.concat(
                    item.services.map(service => service.serviceCode)
                );
            }
        });
        let sortedData = _.sortBy(data, (x: OrderSubscriptionDto) => x.id).reverse();
        sortedData.forEach(item => {
            let services = item.services.map(service => service.serviceCode);
            if (item.status != 'Current' &&
                _.difference(services, currentServices).length
            ) {
                item['isLastSubscription'] = true;
                currentServices = currentServices.concat(services);
            }
        });

        this.dataSource = new DataSource(data);
        this.filterDataSource();
    }

    refreshData(forced = false) {
        let subData = this.orderSubscriptionProxy['data'],
            contactId = this.data.contactInfo.id;
        if (!forced && subData && subData.contactId == contactId)
            this.setDataSource(subData.source);
        else {
            this.loadingService.startLoading();
            this.orderSubscriptionProxy
                .getSubscriptionHistory(contactId).pipe(
                    /** Filter draft subscriptions */
                    map(subscriptions => subscriptions.filter(subscription => subscription.statusCode !== 'D')),
                    finalize(() => this.loadingService.finishLoading())
                ).subscribe(result => {
                    result.forEach(record => {
                        if (record.services) {
                            record['isTrial'] = Boolean(record.trialEndDate && record.trialEndDate.diff(moment()) > 0);
                            record['serviceCodeList'] = record.services.map(service => {
                                return service.serviceCode + (service.levelCode ? '(' + service.levelCode + ')' : '');
                            }).join(', ');
                            record['serviceList'] = record.services.map(service => {
                                return service.serviceName + (service.levelName ? '(' + service.levelName + ')' : '');
                            }).join(', ');
                        }
                    });
                    this.orderSubscriptionProxy['data'] = {
                        contactId: contactId,
                        source: result
                    };
                    this.setDataSource(result);
                });
        }
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
                this.orderSubscriptionProxy
                    .cancel(new CancelOrderSubscriptionInput({
                        subscriptionId: id,
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
        this.dataSource.sort(['productName', { getter: 'id', desc: true }]);
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
                name: subscription.productName
            };
        }
        this.dialog.open(AddSubscriptionDialogComponent, {
            panelClass: ['slider'],
            hasBackdrop: false,
            closeOnNavigation: false,
            disableClose: true,
            data: data
        });
        e.stopPropagation ? e.stopPropagation() : e.event.stopPropagation();
    }

    onDateHover(event) {
        let target = event.target.children[1];
        if (target)
            target.innerText = target.title;
    }

    onDateLeave(event) {
        let target = event.target.children[1];
        if (target)
            target.innerText = target.title.split(' ').shift();
    }

    onDateChanged(event, cell) {
        let leadId = this.route.parent.snapshot.paramMap.get('leadId') ?
            this.data.leadInfo.id :
            null;

        this.loadingService.startLoading();
        this.orderSubscriptionProxy.updatePeriod(new UpdateOrderSubscriptionPeriodInput({
            subscriptionId: cell.data.id,
            startDate: cell.column.dataField == 'startDate' ?
                DateHelper.removeTimezoneOffset(new Date(event.value), true, 'from') : cell.data.startDate,
            endDate: cell.column.dataField == 'endDate' ?
                DateHelper.removeTimezoneOffset(new Date(event.value), true, 'to') : cell.data.endDate
        })).pipe(
            finalize(() => this.loadingService.finishLoading())
        ).subscribe(() => {
            this.refreshData(true);
            abp.notify.info(this.ls.l('SavedSuccessfully'));
        });
    }

    onCallendarOpened(event) {
        let container = event.component['_$container'][0],
            position = container.getBoundingClientRect(),
            popup = event.component['_popup']['_$content'][0],
            isHeightOverflow = innerHeight - position.y < popup.offsetHeight,
            isWidthOverflow = innerWidth - position.x < popup.offsetWidth;
        if (isWidthOverflow || isHeightOverflow)
            popup.style.transform = 'translate(' +
                (isWidthOverflow ? -300 : 0) + 'px, ' +
                (isHeightOverflow ? -300 : 0) + 'px)';
    }

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.ident);
    }
}