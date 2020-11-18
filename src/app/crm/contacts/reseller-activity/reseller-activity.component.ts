/** Core imports */
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouteReuseStrategy, Params } from '@angular/router';

/** Third party imports */
import { BehaviorSubject } from 'rxjs';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { finalize, first } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { ContactGroup } from '@shared/AppEnums';
import {
    LeadServiceProxy, LeadInfoDto,
    ContactInfoDto, ContactServiceProxy
} from '@shared/service-proxies/service-proxies';
import { DateHelper } from '@shared/helpers/DateHelper';
import { ContactsService } from '../contacts.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';
import { ODataService } from '@shared/common/odata/odata.service';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { CustomReuseStrategy } from '@shared/common/custom-reuse-strategy/custom-reuse-strategy.service.ts';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuComponent } from '@app/shared/common/action-menu/action-menu.component';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { CommissionFields } from '@app/crm/commission-history/commission-fields.enum';
import { LedgerFields } from '@app/crm/commission-history/ledger-fields.enum';
import { ClientFields } from '@app/crm/clients/client-fields.enum';

@Component({
    selector: 'reseller-activity',
    templateUrl: './reseller-activity.component.html',
    styleUrls: ['./reseller-activity.component.less'],
    providers: [ LifecycleSubjectsService ]
})
export class ResellerActivityComponent implements OnInit, OnDestroy {
    @ViewChild(ActionMenuComponent, { static: false }) actionMenu: ActionMenuComponent;
    @ViewChild('commissionDataGrid', {static: false}) commissionDataGrid: DxDataGridComponent;
    @ViewChild('contactDataGrid', {static: false}) contactDataGrid: DxDataGridComponent;
    @ViewChild('ledgerDataGrid', {static: false}) ledgerDataGrid: DxDataGridComponent;

    data = {
        contactInfo: new ContactInfoDto()
    };

    userTimezone = DateHelper.getUserTimezone();
    private formatting = AppConsts.formatting;
    private readonly ledgerDataSourceURI = 'CommissionLedgerEntry';
    private readonly commissionDataSourceURI = 'Commission';
    private readonly contactDataSourceURI = 'Contact';
    private readonly ident = 'ResellerActivity';
    private readonly COMMISSION_TAB_INDEX = 1;
    private _selectedTabIndex = 0;

    actionMenuItems: ActionMenuItem[];
    readonly clientFields = ClientFields;
    readonly commissionFields = CommissionFields;
    readonly ledgerFields = LedgerFields;


    get selectedTabIndex(): number {
        return this._selectedTabIndex;
    }

    set selectedTabIndex(val: number) {
        this._selectedTabIndex = val;
        if (val) {
            if (val == this.COMMISSION_TAB_INDEX)
                this.initCommissionDataSource();
            else
                this.initLedgerDataSource();
        } else
            this.initContactDataSource();
    }

    ledgerDataSource;
    contactDataSource;
    commissionDataSource;
    actionRecordData: any;
    defaultGridPagerConfig = DataGridService.defaultGridPagerConfig;
    tenantHasBankCodeFeature = this.userManagementService.checkBankCodeFeature();
    isCGManageAllowed = false;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private reuseService: RouteReuseStrategy,
        private invoicesService: InvoicesService,
        private contactProxy: ContactServiceProxy,
        private contactsService: ContactsService,
        private lifeCycleService: LifecycleSubjectsService,
        private loadingService: LoadingService,
        private itemDetailsService: ItemDetailsService,
        private permissionCheckerService: PermissionCheckerService,
        private permissionService: AppPermissionService,
        private oDataService: ODataService,
        public userManagementService: UserManagementService,
        public httpInterceptor: AppHttpInterceptor,
        public ls: AppLocalizationService
    ) {
        this.contactsService.invalidateSubscribe(area => {
            if (area == 'ledger')
                this.ledgerDataGrid.instance.refresh();
        });
    }

    ngOnInit() {
        this.contactsService.contactInfoSubscribe((contactInfo: ContactInfoDto) => {
            if (contactInfo) {
                this.data.contactInfo = contactInfo;
                this.isCGManageAllowed = this.permissionService.checkCGPermission(contactInfo.groupId);
                this.refreshDataSources();
                this.initActionMenuItems();
                this.initQueryParams();
            }
        }, this.ident);
    }

    refreshDataSources() {
        if (this.contactDataSource)
            this.initContactDataSource();
        if (this.ledgerDataSource)
            this.initLedgerDataSource();
        if (this.commissionDataSource)
            this.initCommissionDataSource();
    }

    initQueryParams() {
        this.route.queryParams.pipe(first()).subscribe(params => {
            if (params['tab']) {
                this.selectedTabIndex = parseInt(params['tab']);
                this.removeTabQueryParam();
            } else
                this.initContactDataSource();
        });
    }

    initActionMenuItems() {
        this.actionMenuItems = [
        ];
    }

    initContactDataSource() {
        this.contactDataSource = new DataSource({
            store: new ODataStore({
                key: this.clientFields.Id,
                url: this.oDataService.getODataUrl(
                    this.contactDataSourceURI,
                    {[this.clientFields.AffiliateContactId]: this.data.contactInfo.id}
                ),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.params.$select = DataGridService.getSelectFields(
                        this.contactDataGrid,
                        [
                            this.clientFields.Id,
                            this.clientFields.AffiliateContactId
                        ]
                    );
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                }
            })
        });
    }

    initLedgerDataSource() {
        this.ledgerDataSource = new DataSource({
            requireTotalCount: true,
            store: new ODataStore({
                key: this.ledgerFields.Id,
                url: this.oDataService.getODataUrl(this.ledgerDataSourceURI,
                    {[this.ledgerFields.ContactId]: this.data.contactInfo.id}
                ),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    request.params.$select = DataGridService.getSelectFields(
                        this.ledgerDataGrid,
                        [ this.ledgerFields.Id, this.ledgerFields.ContactId ]
                    );
                }
            })
        });
    }

    initCommissionDataSource() {
        if (this.data.contactInfo.id)
            this.commissionDataSource = new DataSource({
                requireTotalCount: true,
                store: new ODataStore({
                    key: this.commissionFields.Id,
                    url: this.oDataService.getODataUrl(this.commissionDataSourceURI,
                        {[this.commissionFields.ResellerContactId]: this.data.contactInfo.id}
                    ),
                    version: AppConsts.ODataVersion,
                    deserializeDates: false,
                    beforeSend: (request) => {
                        request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                        request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                        request.params.$select = DataGridService.getSelectFields(
                            this.commissionDataGrid,
                            [
                                this.commissionFields.Id,
                                this.commissionFields.ResellerContactId
                            ]
                        );
                    }
                })
            });
    }

    removeTabQueryParam() {
        this.router.navigate([], {
            queryParams: {tab: null},
            queryParamsHandling: 'merge'
        });
    }

    onCellClick(event) {
        let target = event.event.target;
        if (event.rowType === 'data') {
            if (target.closest('.dx-link.dx-link-edit'))
                this.toggleActionsMenu(event.data, target);
            else {
                this.itemDetailsService.clearItemsSource();
                if (event.data.AffiliateContactId)
                    this.contactsService.updateLocation(event.data.Id, undefined,
                        undefined, undefined, undefined, 'contact-information');
            }
        }
    }

    toggleActionsMenu(data, target) {
        this.actionRecordData = data;
        this.actionMenu.toggle(target);
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionRecordData = null;
        this.actionMenu.hide();
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.ident);
        this.lifeCycleService.destroy.next();
    }
}