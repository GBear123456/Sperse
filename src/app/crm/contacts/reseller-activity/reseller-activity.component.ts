/** Core imports */
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouteReuseStrategy, Params } from '@angular/router';

/** Third party imports */
import { Observable } from 'rxjs';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DevExpress from 'devextreme/bundles/dx.all';
import { map, first } from 'rxjs/operators';

/** Application imports */
import {
    ContactInfoDto, 
    ContactServiceProxy,
    InvoiceSettings
} from '@shared/service-proxies/service-proxies';
import { DateHelper } from '@shared/helpers/DateHelper';
import { ContactsService } from '../contacts.service';
import { AppConsts } from '@shared/AppConsts';
import { ODataService } from '@shared/common/odata/odata.service';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuComponent } from '@app/shared/common/action-menu/action-menu.component';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PermissionCheckerService } from 'abp-ng2-module';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { CommissionFields } from '@app/crm/commission-history/commission-fields.enum';
import { LedgerFields } from '@app/crm/commission-history/ledger-fields.enum';
import { ClientFields } from '@app/crm/clients/client-fields.enum';
import { AppPermissions } from '@shared/AppPermissions';
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppFeatures } from '@shared/AppFeatures';

@Component({
    selector: 'reseller-activity',
    templateUrl: './reseller-activity.component.html',
    styleUrls: ['./reseller-activity.component.less'],
    providers: [ LifecycleSubjectsService ]
})
export class ResellerActivityComponent implements OnInit, OnDestroy {
    @ViewChild(ActionMenuComponent) actionMenu: ActionMenuComponent;
    @ViewChild('commissionDataGrid') commissionDataGrid: DxDataGridComponent;
    @ViewChild('generatedCommissionDataGrid') generatedCommissionDataGrid: DxDataGridComponent;
    @ViewChild('contactDataGrid') contactDataGrid: DxDataGridComponent;
    @ViewChild('ledgerDataGrid') ledgerDataGrid: DxDataGridComponent;

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
    generatedCommissionDataSource;
    defaultGridPagerConfig = DataGridService.defaultGridPagerConfig;
    tenantHasBankCodeFeature = this.userManagementService.checkBankCodeFeature();
    isCGManageAllowed = false;
    isCommissionsAllowed = this.featureCheckerService.isEnabled(AppFeatures.CRMCommissions)
        && this.permissionService.isGranted(AppPermissions.CRMAffiliatesCommissions);

    currencyFormat$: Observable<DevExpress.ui.Format> = this.invoicesService.settings$.pipe(
        map((settings: InvoiceSettings) => {
            return {
                type: 'currency',
                precision: 2,
                currency: settings && settings.currency
            };
        })
    );

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private reuseService: RouteReuseStrategy,
        private invoicesService: InvoicesService,
        private contactProxy: ContactServiceProxy,
        private contactsService: ContactsService,
        private lifeCycleService: LifecycleSubjectsService,
        private itemDetailsService: ItemDetailsService,
        private featureCheckerService: FeatureCheckerService,
        private permissionCheckerService: PermissionCheckerService,
        private permissionService: AppPermissionService,
        private oDataService: ODataService,
        public loadingService: LoadingService,
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
                this.isCGManageAllowed = this.permissionService.checkCGPermission(contactInfo.groups);
                this.refreshDataSources();
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
                    this.loadingService.startLoading();
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
                    this.loadingService.startLoading();
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

    getCommissionDataGrid(dataGrid, filter) {
        return new DataSource({
            requireTotalCount: true,
            store: new ODataStore({
                key: this.commissionFields.Id,
                url: this.oDataService.getODataUrl(this.commissionDataSourceURI, filter),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    this.loadingService.startLoading();
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    request.params.$select = DataGridService.getSelectFields(
                        dataGrid,
                        [
                            this.commissionFields.Id,
                            this.commissionFields.ResellerContactId
                        ]
                    );
                }
            })
        });
    }

    initCommissionDataSource() {
        if (this.data.contactInfo.id)
            this.commissionDataSource = this.getCommissionDataGrid(
                this.commissionDataGrid,
                {[this.commissionFields.ResellerContactId]: this.data.contactInfo.id}
            );
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
            this.itemDetailsService.clearItemsSource();
            if (event.data.AffiliateContactId)
                this.contactsService.updateLocation(event.data.Id, undefined,
                    undefined, undefined, undefined, 'contact-information');
        }
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.ident);
        this.lifeCycleService.destroy.next();
    }
}