/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import { Params } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { BehaviorSubject, combineLatest, concat, Observable } from 'rxjs';
import { filter, finalize, first, skip, switchMap, takeUntil } from 'rxjs/operators';
import startCase from 'lodash/startCase';
import DevExpress from 'devextreme/bundles/dx.all';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';
import { ActionMenuGroup } from '@app/shared/common/action-menu/action-menu-group.interface';
import { SourceContactListComponent } from '@shared/common/source-contact-list/source-contact-list.component';
import {
    CommissionServiceProxy, ProductServiceProxy,
    PaymentSettingType, CommissionTier, UpdateCommissionAffiliateInput, PaymentSystem,
    AffiliatePayoutSettingServiceProxy, TenantPaymentSettingsServiceProxy, CommissionSettings
} from '@shared/service-proxies/service-proxies';
import { LedgerHistoryDialogComponent } from '@app/crm/commission-history/ledger-history-dialog/ledger-history-dialog.component';
import { UpdateCommissionRateDialogComponent } from '@app/crm/commission-history/update-rate-dialog/update-rate-dialog.component';
import { UpdateCommissionableDialogComponent } from '@app/crm/commission-history/update-commissionable-dialog/update-commissionable-dialog.component';
import { CommissionEarningsDialogComponent } from '@app/crm/commission-history/commission-earnings-dialog/commission-earnings-dialog.component';
import { RequestWithdrawalDialogComponent } from '@app/crm/commission-history/request-withdrawal-dialog/request-withdrawal-dialog.component';
import { LedgerCompleteDialogComponent } from '@app/crm/commission-history/ledger-complete-dialog/ledger-complete-dialog.component';
import { PayPalCompleteDialogComponent } from '@app/crm/commission-history/paypal-complete-dialog/paypal-complete-dialog.component';
import { SourceContactFilterModel } from '../shared/filters/source-filter/source-filter.model';
import { FilterSourceComponent } from '../shared/filters/source-filter/source-filter.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { CommissionFields } from '@app/crm/commission-history/commission-fields.enum';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { CommissionDto } from '@app/crm/commission-history/commission-dto';
import { LedgerDto } from '@app/crm/commission-history/ledger-dto';
import { LedgerFields } from '@app/crm/commission-history/ledger-fields.enum';
import { ResellersDto } from '@app/crm/commission-history/resellers-dto';
import { ResellersFields } from '@app/crm/commission-history/resellers-fields.enum';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { CommissionStatus } from '@app/crm/commission-history/commission-status.enum';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { LedgerType } from '@app/crm/commission-history/ledger-type.enum';
import { LedgerStatus } from '@app/crm/commission-history/ledger-status.enum';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';
import { CrmService } from '@app/crm/crm.service';
import { SettingsHelper } from '@shared/common/settings/settings.helper';

@Component({
    templateUrl: './commission-history.component.html',
    styleUrls: [
        '../shared/styles/grouped-action-menu.less',
        './commission-history.component.less'
    ],
    providers: [
        ProductServiceProxy, LifecycleSubjectsService, AffiliatePayoutSettingServiceProxy, TenantPaymentSettingsServiceProxy
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommissionHistoryComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild('commissionDataGrid') commissionDataGrid: DxDataGridComponent;
    @ViewChild('resellersDataGrid') resellersDataGrid: DxDataGridComponent;
    @ViewChild('sourceList') sourceComponent: SourceContactListComponent;
    @ViewChild('ledgerDataGrid') ledgerDataGrid: DxDataGridComponent;
    @ViewChild(ToolBarComponent) toolbar: ToolBarComponent;

    private readonly commissionDataSourceURI: string = 'Commission';
    private readonly ledgerDataSourceURI: string = 'CommissionLedgerEntry';
    private readonly resellersDataSourceURI: string = 'AffiliateSummaryReport';

    private rootComponent: any;
    private subRouteParams: any;
    private bulkUpdateAllowed = this.permission.isGranted(AppPermissions.CRMBulkUpdates);
    private affiliateManageAllowed = this.permission.isGranted(AppPermissions.CRMAffiliatesManage);

    selectedRecords: any = [];
    readonly commissionFields: KeysEnum<CommissionDto> = CommissionFields;
    readonly ledgerFields: KeysEnum<LedgerDto> = LedgerFields;
    readonly resellersFields: KeysEnum<ResellersDto> = ResellersFields;
    rowsViewHeight: number;
    formatting = AppConsts.formatting;
    headlineButtons: HeadlineButton[] = [
        {
            enabled: false,
            action: () => { },
            label: this.l('SomeAction')
        }
    ];

    actionEvent: any;
    actionMenuGroups: ActionMenuGroup[] = [
        {
            key: '',
            visible: true,
            items: []
        }
    ];
    reconciliationFilter: FilterModel = new FilterModel({
        component: null,
        caption: 'Reconciliation',
        items: {
            element: new FilterItemModel({
                dataSource: {
                    rate: this.commissionFields.CommissionRate + ' ne ' + this.commissionFields.ResellerAffiliateRate,
                    mentor: this.commissionFields.ResellerContactId + ' ne ' + this.commissionFields.BuyerAffiliateContactId
                }
            }, true)
        },
        filterMethod: (filter) => {
            if (filter.items.element)
                return filter.items.element.value;
            return '';
        }
    });
    get isReconciliationRateSelected(): Boolean {
        let element = this.reconciliationFilter.items.element;
        return element.value == element.dataSource.rate;
    }
    get isReconciliationMentorSelected(): Boolean {
        let element = this.reconciliationFilter.items.element;
        return element.value == element.dataSource.mentor;
    }
    permissions = AppPermissions;
    searchValueChanged = false;
    searchValue: string = this._activatedRoute.snapshot.queryParams.search || '';
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    private refresh$: Observable<null> = this._refresh.asObservable();
    filterChanged$: Observable<FilterModel[]> = this.filtersService.filtersChanged$.pipe(
        filter(() => this.componentIsActivated)
    );
    toolbarConfig: ToolbarGroupModel[];
    private filters: FilterModel[] = this.getFilters();
    odataRequestValues$: Observable<ODataRequestValues> = concat(
        this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom),
        this.filterChanged$.pipe(
            switchMap(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom))
        )
    ).pipe(
        filter((odataRequestValues: ODataRequestValues) => !!odataRequestValues)
    );
    private queryParams$: Observable<Params> = this._activatedRoute.queryParams.pipe(
        takeUntil(this.destroy$),
        filter(() => this.componentIsActivated)
    );

    public commissionDataSource = new DataSource({
        requireTotalCount: true,
        store: new ODataStore({
            key: this.commissionFields.Id,
            url: this.getODataUrl(this.commissionDataSourceURI),
            version: AppConsts.ODataVersion,
            deserializeDates: false,
            beforeSend: (request) => {
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                request.params.$select = DataGridService.getSelectFields(
                    this.commissionDataGrid,
                    [
                        this.commissionFields.Id,
                        this.commissionFields.OrderId,
                        this.commissionFields.CommissionAmount,
                        this.commissionFields.BuyerContactId,
                        this.commissionFields.ResellerContactId
                    ]
                );
            },
            errorHandler: (error) => {
                setTimeout(() => this.isDataLoaded = true);
            }
        })
    });

    public ledgerDataSource = new DataSource({
        requireTotalCount: true,
        store: new ODataStore({
            key: this.ledgerFields.Id,
            url: this.getODataUrl(this.ledgerDataSourceURI),
            version: AppConsts.ODataVersion,
            deserializeDates: false,
            beforeSend: (request) => {
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                request.params.$select = DataGridService.getSelectFields(
                    this.ledgerDataGrid,
                    [this.ledgerFields.Id, this.ledgerFields.ContactId]
                );
            },
            errorHandler: (error) => {
                setTimeout(() => this.isDataLoaded = true);
            }
        })
    });

    public resellersDataSource = new DataSource({
        requireTotalCount: true,
        store: new ODataStore({
            key: this.resellersFields.Id,
            url: this.getODataUrl(this.resellersDataSourceURI),
            version: AppConsts.ODataVersion,
            deserializeDates: false,
            beforeSend: (request) => {
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                request.params.$select = DataGridService.getSelectFields(
                    this.resellersDataGrid,
                    [this.resellersFields.Id]
                );
            },
            errorHandler: (error) => {
                setTimeout(() => this.isDataLoaded = true);
            }
        })
    });

    get gridDataSource() {
        return [
            this.commissionDataSource,
            this.ledgerDataSource,
            this.resellersDataSource
        ][this.selectedViewType];
    }

    public readonly COMMISSION_VIEW = 0;
    public readonly LEDGER_VIEW = 1;
    public readonly RESELLERS_VIEW = 2;
    selectedViewType = this.COMMISSION_VIEW;
    viewTypes = [{
        value: this.COMMISSION_VIEW,
        text: this.l('Commissions')
    }, {
        value: this.LEDGER_VIEW,
        text: this.l('Ledger')
    }, {
        value: this.RESELLERS_VIEW,
        text: this.l('Resellers')
    }];

    currencyFormat: DevExpress.ui.format = {
        type: 'currency',
        precision: 2,
        currency: SettingsHelper.getCurrency()
    };

    get dxDataGrid(): DxDataGridComponent {
        return [
            this.commissionDataGrid,
            this.ledgerDataGrid,
            this.resellersDataGrid
        ][this.selectedViewType];
    }

    get dataSourceURI(): string {
        return [
            this.commissionDataSourceURI,
            this.ledgerDataSourceURI,
            this.resellersDataSourceURI
        ][this.selectedViewType];
    }

    commissionFilters = [].concat([
        new FilterModel({
            component: FilterSourceComponent,
            caption: 'Reseller',
            items: {
                element: new SourceContactFilterModel({
                    contactFieldExpr: this.commissionFields.ResellerContactId,
                    ls: this.localizationService
                })
            },
            filterMethod: FiltersService.filterBySource
        }),
        new FilterModel({
            component: FilterSourceComponent,
            caption: 'Buyer',
            items: {
                element: new SourceContactFilterModel({
                    contactFieldExpr: this.commissionFields.BuyerContactId,
                    ls: this.localizationService
                })
            },
            filterMethod: FiltersService.filterBySource
        }),
        new FilterModel({
            component: FilterCalendarComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'OrderDate',
            field: this.commissionFields.OrderDate,
            items: { from: new FilterItemModel(), to: new FilterItemModel() },
            options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
        }),
        new FilterModel({
            component: FilterCalendarComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'EarnedDate',
            field: this.commissionFields.EarnedDate,
            items: { from: new FilterItemModel(), to: new FilterItemModel() },
            options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
        }),
        new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'Status',
            field: this.commissionFields.Status,
            items: {
                element: new FilterCheckBoxesModel(
                    {
                        dataSource: Object.keys(CommissionStatus).map((status: string) => ({
                            id: CommissionStatus[status],
                            name: startCase(status)
                        })),
                        nameField: 'name',
                        keyExpr: 'id'
                    })
            }
        }),
        new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'Tier',
            field: this.commissionFields.Tier,
            items: {
                element: new FilterCheckBoxesModel(
                    {
                        dataSource: Object.keys(CommissionTier).map((status: string) => ({
                            id: CommissionTier[status],
                            name: startCase(status)
                        })),
                        nameField: 'name',
                        keyExpr: 'id'
                    })
            }
        }),
        new FilterModel({
            component: FilterInputsComponent,
            options: { type: 'number' },
            operator: { from: 'ge', to: 'le' },
            caption: 'Commission',
            field: this.commissionFields.CommissionAmount,
            items: { from: new FilterItemModel(), to: new FilterItemModel() }
        })],
        this.permission.isGranted(AppPermissions.CRMOrders) || 
        this.permission.isGranted(AppPermissions.CRMProducts) ?
        [
            new FilterModel({
                component: FilterCheckBoxesComponent,
                caption: 'Product',
                field: this.commissionFields.ProductCode,
                options: { method: 'filterByFilterElement' },
                items: {
                    element: new FilterCheckBoxesModel(
                        {
                            dataSource$: this.productProxy.getProducts(undefined),
                            nameField: 'name',
                            keyExpr: 'code'
                        })
                }
            }) 
        ]: [],
        [new FilterModel({
            component: FilterInputsComponent,
            options: { type: 'number' },
            operator: { from: 'ge', to: 'le' },
            caption: 'ProductAmount',
            field: this.commissionFields.ProductAmount,
            items: { from: new FilterItemModel(), to: new FilterItemModel() }
        }),
        new FilterModel({
            component: FilterInputsComponent,
            options: { type: 'number' },
            operator: { from: 'ge', to: 'le' },
            caption: 'CommissionRate',
            field: this.commissionFields.CommissionRate,
            items: { from: new FilterItemModel(), to: new FilterItemModel() }
        })
    ]);

    ledgerFilters = [
        new FilterModel({
            component: FilterSourceComponent,
            caption: 'Reseller',
            items: {
                element: new SourceContactFilterModel({
                    contactFieldExpr: this.ledgerFields.ContactId,
                    ls: this.localizationService
                })
            },
            filterMethod: FiltersService.filterBySource
        }),
        new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'Type',
            field: this.ledgerFields.Type,
            items: {
                element: new FilterCheckBoxesModel(
                    {
                        dataSource: Object.keys(LedgerType).map((type: string) => ({
                            id: LedgerType[type],
                            name: startCase(type)
                        })),
                        nameField: 'name',
                        keyExpr: 'id'
                    })
            }
        }),
        new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'Status',
            field: this.ledgerFields.Status,
            items: {
                element: new FilterCheckBoxesModel(
                    {
                        dataSource: Object.keys(LedgerStatus).map((status: string) => ({
                            id: LedgerStatus[status],
                            name: startCase(status)
                        })),
                        nameField: 'name',
                        keyExpr: 'id'
                    })
            }
        }),
        new FilterModel({
            component: FilterCalendarComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'entryDate',
            field: this.ledgerFields.EntryDate,
            items: { from: new FilterItemModel(), to: new FilterItemModel() },
            options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
        }),
        new FilterModel({
            component: FilterInputsComponent,
            options: { type: 'number' },
            operator: { from: 'ge', to: 'le' },
            caption: 'TotalAmount',
            field: this.ledgerFields.TotalAmount,
            items: { from: new FilterItemModel(), to: new FilterItemModel() }
        })
    ];

    manageAllowed = this.isGranted(AppPermissions.CRMAffiliatesCommissionsManage);
    isPayPalPayoutEnabled: Boolean = false;
    isStripePayoutEnabled: Boolean = false;
                   
    constructor(
        injector: Injector,
        public dialog: MatDialog,
        public appService: AppService,
        private filtersService: FiltersService,
        private productProxy: ProductServiceProxy,
        private commissionProxy: CommissionServiceProxy,
        private paymentSettings: TenantPaymentSettingsServiceProxy,
        private affiliatePayoutSettingProxy: AffiliatePayoutSettingServiceProxy,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super(injector);

        this.paymentSettings.getCommissionSettings().subscribe((res: CommissionSettings) => {
            this.reconciliationFilter.items.element.dataSource.rate =
                this.commissionFields.ResellerAffiliateRate + ' ne null and ' +
                this.commissionFields.CommissionRate + ' ne ' + res.defaultAffiliateRate +
                ' and ' + this.reconciliationFilter.items.element.dataSource.rate;
        });
    }

    ngOnInit() {
        this.affiliatePayoutSettingProxy.getAvailablePayoutTypes(
            ).subscribe((payoutTypes: PaymentSettingType[]) => {
                this.isPayPalPayoutEnabled = payoutTypes.some(item => item == PaymentSettingType.PayPal);
                this.isStripePayoutEnabled = payoutTypes.some(item => item == PaymentSettingType.Stripe);
            });

        this.handleDataGridUpdate();
        this.handleFiltersPining();
        this.activate();
    }

    private handleFiltersPining() {
        this.filtersService.filterFixed$.pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            skip(1)
        ).subscribe(() => {
            this.repaintDataGrid(1000);
        });
    }

    private handleDataGridUpdate(): void {
        this.listenForUpdate().pipe(skip(1)).subscribe(() => {
            this.selectedRecords = [];
            this.dxDataGrid.instance.clearSelection();
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    private paramsSubscribe() {
        if (!this.subRouteParams || this.subRouteParams.closed)
            this.subRouteParams = this._activatedRoute.queryParams
                .pipe(takeUntil(this.deactivate$))
                .subscribe(params => {
                    const searchValueChanged = params.search && this.searchValue !== params.search;
                    if (searchValueChanged) {
                        this.searchValue = params.search || '';
                        this.initToolbarConfig();
                        setTimeout(() => this.filtersService.clearAllFilters());
                    }
                    if (params['refresh'] || searchValueChanged) {
                        this.refresh();
                    }
                });
    }

    private getContactId(data: CommissionDto | LedgerDto | ResellersDto, dataField: string): number {
        const namesToContactIdsMap = {
            [this.commissionFields.BuyerName]: this.commissionFields.BuyerContactId,
            [this.commissionFields.ResellerName]: this.commissionFields.ResellerContactId,
            [this.ledgerFields.ContactName]: this.ledgerFields.ContactId,
            [this.resellersFields.FullName]: this.resellersFields.Id
        };
        return data[namesToContactIdsMap[dataField]];
    }

    onCellClick(event) {
        if (!event.column)
            return;

        if (event.column.dataField === this.commissionFields.BuyerName
            || event.column.dataField === this.commissionFields.ResellerName
            || event.column.dataField === this.ledgerFields.ContactName
            || event.column.dataField === this.resellersFields.FullName
        ) {
            const data: CommissionDto | LedgerDto | ResellersDto = event.data;
            const contactId = this.getContactId(data, event.column.dataField);
            if (contactId) {
                this.searchClear = false;
                event.component && event.component.cancelEditData();
                setTimeout(() => {
                    this._router.navigate(
                        CrmService.getEntityDetailsLink(contactId),
                        {
                            queryParams: {
                                referrer: 'app/crm/commission-history'
                            }
                        }
                    );
                });
            }
        }
    }

    onContentReady(event) {
        this.dataGrid = this.dxDataGrid;
        this.finishLoading();
        this.setGridDataLoaded();
        if (!this.rowsViewHeight)
            this.rowsViewHeight = DataGridService.getDataGridRowsViewHeight();
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
        this.changeDetectorRef.detectChanges();
    }

    onSelectionChanged($event) {
        this.selectedRecords = $event.component.getSelectedRowsData();
        this.initToolbarConfig();
    }

    refresh() {
        this._refresh.next(null);
    }

    invalidate() {
        this.lifeCycleSubjectsService.activate$.pipe(
            first()
        ).subscribe(() => {
            this.refresh();
        });
    }

    private listenForUpdate() {
        return combineLatest(
            this.odataRequestValues$,
            this.refresh$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$)
        );
    }

    initFilterConfig(hardUpdate: boolean = false) {
        if (!hardUpdate && this.filters) {
            this.filtersService.setup(this.filters);
            this.filtersService.checkIfAnySelected();
        } else {
            this.filtersService.setup(
                this.filters = this.getFilters()
            );
            if (!this.filters.length) {
                this.filtersService.fixed = false;
            }
        }

        this.filtersService.apply(() => {
            this.initToolbarConfig();
        });
    }

    private getFilters() {
        return this.selectedViewType === this.COMMISSION_VIEW
            ? this.commissionFilters
            : (this.selectedViewType === this.LEDGER_VIEW
                ? this.ledgerFilters
                : []
            );
    }

    initToolbarConfig() {
        let cancelButton = {
            widget: 'dxButton',
            options: {
                text: this.l('Cancel' + (this.selectedViewType == this.LEDGER_VIEW ? 'Ledgers' : 'Commissions')),
                visible: this.selectedViewType != this.RESELLERS_VIEW,
                disabled: !this.manageAllowed
                    || !this.selectedRecords.length
                    || this.selectedRecords.length > 1 && !this.bulkUpdateAllowed
                    || this.selectedRecords.every(item => item.Status !== CommissionStatus.Pending),
                onClick: this.applyCancel.bind(this)
            }
        };
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        disabled: this.selectedViewType == this.RESELLERS_VIEW,
                        action: () => {
                            this.filtersService.fixed = !this.filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => this.filtersService.fixed,
                            mouseover: () => {
                                this.filtersService.enable();
                            },
                            mouseout: () => {
                                if (!this.filtersService.fixed)
                                    this.filtersService.disable();
                            }
                        },
                        attr: {
                            'filter-selected': this.filtersService.hasFilterSelected
                        }
                    }
                ]
            },
            {
                location: 'before',
                items: [
                    {
                        name: 'search',
                        widget: 'dxTextBox',
                        options: {
                            value: this.searchValue,
                            width: '279',
                            mode: 'search',
                            placeholder: this.l('Search') + ' ' + this.l('Commissions').toLowerCase(),
                            onValueChanged: (e) => {
                                this.searchValueChange(e);
                            }
                        }
                    }
                ]
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                items: this.selectedViewType == this.LEDGER_VIEW ? [
                    {
                        widget: 'dxButton',
                        options: {
                            text: this.l('RequestWithdrawal'),
                            disabled: !this.manageAllowed,
                            onClick: this.requestWithdrawal.bind(this)
                        }
                    },
                    {
                        widget: 'dxButton',
                        options: {
                            text: this.l('AddNewEarnings'),
                            disabled: !this.manageAllowed,
                            onClick: this.applyEarnings.bind(this)
                        }
                    },
                    {
                        widget: 'dxButton',
                        options: {
                            text: this.l('ApproveLedger'),
                            disabled: !this.manageAllowed
                                || !this.selectedRecords.length
                                || this.selectedRecords.length > 1 && !this.bulkUpdateAllowed
                                || this.selectedRecords.every(item => item.Status !== LedgerStatus.Pending),
                            onClick: this.approveEarnings.bind(this)
                        }
                    },
                    cancelButton,
                    {
                        name: 'menu',
                        widget: 'dxDropDownMenu',
                        disabled: !this.manageAllowed
                            || !this.selectedRecords.length
                            || this.selectedRecords.length > 1 && !this.bulkUpdateAllowed
                            || this.selectedRecords.every(item => !(item.Status == CommissionStatus.Approved && item.Type == LedgerType.Withdrawal)),
                        options: {
                            hint: this.l('UpdatePaymentStatus'),
                            items: [
                                {
                                    text: this.l('ManualPayment'),
                                    action: this.applyComplete.bind(this)
                                },
                                {
                                    text: this.l('PayWithPayPal'),                                    
                                    disabled: !this.isPayPalPayoutEnabled ||                                        
                                        !abp.features.isEnabled(AppFeatures.CRMPayments) ||
                                        !this.selectedRecords.some(item => item.PayPalEmailAddress),
                                    action: () => this.applyPaymentComplete(PaymentSystem.PayPal)
                                },
                                {
                                    text: this.l('PayWithStripe'),
                                    disabled: !this.isStripePayoutEnabled ||
                                        !abp.features.isEnabled(AppFeatures.CRMPayments),
                                    action: () => this.applyPaymentComplete(PaymentSystem.Stripe)
                                }
                            ]
                        }
                    }] : [{
                        widget: 'dxButton',
                        options: {
                            text: this.l('ReassignCommissions'),
                            icon: './assets/common/icons/assign-icon.svg',
                            visible: this.selectedViewType == this.COMMISSION_VIEW,
                            disabled: !this.affiliateManageAllowed
                                || !this.selectedRecords.length
                                || this.selectedRecords.length > 1 && !this.bulkUpdateAllowed,
                            onClick: (e) => {
                                this.sourceComponent.toggle();
                            }
                        }
                    }, cancelButton, {
                        name: 'menu',
                        widget: 'dxDropDownMenu',
                        visible: this.selectedViewType == this.COMMISSION_VIEW,
                        disabled: !this.manageAllowed
                            || !this.selectedRecords.length
                            || this.selectedRecords.length > 1 && !this.bulkUpdateAllowed,
                        options: {
                            hint: this.l('Update'),
                            items: [
                                {
                                    text: this.l('CommissionableAmount'),
                                    action: (e) => {
                                        this.dialog.open(UpdateCommissionableDialogComponent, {
                                            disableClose: true,
                                            closeOnNavigation: false,
                                            data: {
                                                entityIds: this.selectedRecords.map(item => item.Id),
                                                bulkUpdateAllowed: this.bulkUpdateAllowed
                                            }
                                        }).afterClosed().subscribe(() => this.refresh());
                                    }
                                },
                                {
                                    text: this.l('CommissionRate'),
                                    action: (e) => {
                                        this.dialog.open(UpdateCommissionRateDialogComponent, {
                                            disableClose: true,
                                            closeOnNavigation: false,
                                            data: {
                                                entityIds: this.selectedRecords.map(item => item.Id),
                                                bulkUpdateAllowed: this.bulkUpdateAllowed
                                            }
                                        }).afterClosed().subscribe(() => this.refresh());
                                    }
                                }
                            ]
                        }
                    }
                    ]
            }, {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'menu',
                        widget: 'dxDropDownMenu',
                        attr: {
                            'filter-selected': this.isReconciliationMentorSelected || this.isReconciliationRateSelected
                        },
                        visible: this.selectedViewType == this.COMMISSION_VIEW,
                        options: {
                            hint: this.l('Reconciliation'),
                            onItemClick: (e) => {
                                e.component.element().setAttribute('filter-selected',
                                    this.isReconciliationMentorSelected || this.isReconciliationRateSelected);
                            },
                            items: [
                                {
                                    icon: this.getReconciliationIcon('rate'),
                                    action: () => this.applyReconciliationFilter('rate'),
                                    text: this.l('ReconciliationCommissionRate')
                                },
                                {
                                    icon: this.getReconciliationIcon('mentor'),
                                    action: () => this.applyReconciliationFilter('mentor'),
                                    text: this.l('ReconciliationCommissionMentor')
                                }
                            ]
                        }
                    }
                ]
            }, {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        widget: 'dxButton',
                        options: {
                            text: this.l('DownloadEarningReport'),
                            onClick: this.downloadEarningReport.bind(this)
                        }
                    },
                ]
            }, {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'download',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Download'),
                            items: [
                                {
                                    action: (options) => {
                                        this.exportToXLS(options, this.dxDataGrid, this.viewTypes[this.selectedViewType].text, false);
                                    },
                                    text: this.l('Export to Excel'),
                                    icon: 'xls'
                                },
                                {
                                    action: (options) => {
                                        this.exportToCSV(options, this.dxDataGrid, this.viewTypes[this.selectedViewType].text, false);
                                    },
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet'
                                },
                                {
                                    action: (options) => {
                                        this.exportToGoogleSheet(options, this.dxDataGrid, this.viewTypes[this.selectedViewType].text, false);
                                    },
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet'
                                },
                                {
                                    type: 'downloadOptions'
                                }
                            ]
                        }
                    },
                    { name: 'print', action: Function(), visible: false }
                ]
            }
        ];
        this.changeDetectorRef.detectChanges();
    }

    getReconciliationIcon(field) {
        let element = this.reconciliationFilter.items.element;
        return element.value == element.dataSource[field] ? 'check' : 'filter';
    }

    applyReconciliationFilter(field) {
        let target = this.reconciliationFilter.items.element,
            source = target.dataSource[field];
        target.value = target.value && target.value == source ? null : source;
        this.processFilterInternal();
        this.initToolbarConfig();
    }

    downloadEarningReport() {
        document.location.href = AppConsts.remoteServiceBaseUrl + "/CommissionResellersReport/get";
    }

    requestWithdrawal() {
        this.dialog.open(RequestWithdrawalDialogComponent, {
            disableClose: true,
            closeOnNavigation: false,
            data: {
                bulkUpdateAllowed: this.bulkUpdateAllowed
            }
        }).afterClosed().subscribe(() => this.refresh());
    }

    applyComplete() {
        this.dialog.open(LedgerCompleteDialogComponent, {
            disableClose: true,
            closeOnNavigation: false,
            data: {
                entities: this.selectedRecords.filter(
                    item => item.Status == CommissionStatus.Approved && item.Type == LedgerType.Withdrawal
                ),
                bulkUpdateAllowed: this.bulkUpdateAllowed
            }
        }).afterClosed().subscribe(() => this.refresh());
    }

    applyPaymentComplete(type) {
        this.dialog.open(PayPalCompleteDialogComponent, {
            disableClose: true,
            closeOnNavigation: false,
            data: {
                entities: this.selectedRecords.filter(
                    item => item.Status == CommissionStatus.Approved && item.Type == LedgerType.Withdrawal
                ),
                bulkUpdateAllowed: this.bulkUpdateAllowed,
                paymentType: type
            }
        }).afterClosed().subscribe(() => this.refresh());
    }

    applyCancel() {
        if (this.selectedRecords.length) {
            ContactsHelper.showConfirmMessage(
                this.l('SelectedItemsAction', this.l('Cancelled')),
                (isConfirmed: boolean) => {
                    if (isConfirmed) {
                        let ids = this.selectedRecords.filter(
                            item => item.Status === CommissionStatus.Pending
                        ).map(item => item.Id);

                        this.startLoading();
                        (this.selectedViewType == this.LEDGER_VIEW ?
                            this.commissionProxy.cancelLedger(ids) :
                            this.commissionProxy.cancelCommissions(ids)
                        ).pipe(
                            finalize(() => this.finishLoading())
                        ).subscribe(() => {
                            this.notify.success(this.l('AppliedSuccessfully'));
                            this.refresh();
                        });
                    }
                }, []
            );
        }
    }

    applyEarnings() {
        this.dialog.open(CommissionEarningsDialogComponent, {
            disableClose: true,
            closeOnNavigation: false,
            data: {
                bulkUpdateAllowed: this.bulkUpdateAllowed
            }
        }).afterClosed().subscribe(() => this.refresh());
    }

    approveEarnings() {
        if (this.selectedRecords.length) {
            ContactsHelper.showConfirmMessage(
                this.l('SelectedItemsAction', this.l('Approved')),
                (isConfirmed: boolean) => {
                    if (isConfirmed) {
                        this.startLoading();
                        this.commissionProxy.approveLedger(
                            this.selectedRecords.filter(
                                item => item.Status === LedgerStatus.Pending
                            ).map(item => item.Id)
                        ).pipe(
                            finalize(() => this.finishLoading())
                        ).subscribe(() => {
                            this.notify.success(this.l('AppliedSuccessfully'));
                            this.refresh();
                        });
                    }
                }, []
            );
        }
    }

    toggleColumnChooser() {
        DataGridService.showColumnChooser(this.dxDataGrid);
    }

    repaintDataGrid(delay = 0) {
        if (this.dxDataGrid) {
            setTimeout(() => this.dxDataGrid.instance.repaint(), delay);
        }
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dxDataGrid, true);
    }

    setDataGridInstance() {
        let instance = this.dxDataGrid && this.dxDataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.gridDataSource);
            this.processFilterInternal();
            this.startLoading();
        } else if (this.searchValueChanged) {
            this.searchValueChanged = false;
            this.processFilterInternal();
        } else
            this.setGridDataLoaded();
    }

    searchValueChange(e: object) {
        if (this.searchValue != e['value']) {
            this.searchValueChanged = true;
            this.searchValue = e['value'];
            this._router.navigate([], { queryParams: { search: this.searchValue } });
            this._refresh.next(null);
            this.changeDetectorRef.detectChanges();
        }
    }

    processFilterInternal() {
        if (this.dxDataGrid && this.dxDataGrid.instance) {
            this.selectedRecords = [];
            this.dxDataGrid.instance.clearSelection();

            this.processODataFilter(
                this.dxDataGrid.instance,
                this.dataSourceURI,
                this.filters.concat(this.reconciliationFilter),
                this.filtersService.getCheckCustom
            );
        }
    }

    ngOnDestroy() {
        this.lifeCycleSubjectsService.destroy.next();
        this.deactivate();
    }

    repaintToolbar() {
        if (this.toolbar) {
            this.toolbar.toolbarComponent.instance.repaint();
        }
    }

    activate() {
        super.activate();
        this.lifeCycleSubjectsService.activate.next();
        this.paramsSubscribe();
        this.initFilterConfig();
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.showHostElement(() => {
            this.repaintToolbar();
        });
    }

    deactivate() {
        super.deactivate();
        this.subRouteParams.unsubscribe();
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        this.hideHostElement();
    }

    toggleActionsMenu(event) {
        ActionMenuService.toggleActionMenu(event, this.actionEvent).subscribe(actionEvent => {
            const client: any = event.data;
            ActionMenuService.prepareActionMenuGroups(this.actionMenuGroups, client);
            this.actionEvent = actionEvent;
            this.changeDetectorRef.detectChanges();
        });
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionEvent = null;
    }

    onViewTypeChanged(event) {
        if (this.selectedViewType != event.value) {
            this.selectedRecords = [];
            this.dxDataGrid.instance.clearSelection();
            this.selectedViewType = event.value;
            this.initFilterConfig(true);
            this.setDataGridInstance();
            this.initToolbarConfig();
        }
    }

    onSourceApply(event) {
        let checkBoxes = [];
        let hasTer1CommissionSeleted = this.selectedRecords.some(v => v.Tier == CommissionTier.Tier1);
        if (hasTer1CommissionSeleted) {
            checkBoxes.push({ text: this.l('AssignAffiliateContact'), visible: true, checked: true });
            checkBoxes.push({ text: this.l('ReassignRelatedTier2Commissions'), visible: true, checked: true });
        }

        ContactsHelper.showConfirmMessage(
            this.l('ConfirmReassignCommissions'),
            (isConfirmed: boolean, [assignToBuyerContact, reassignTier2Commissions]: boolean[]) => {
                if (isConfirmed) {
                    this.startLoading();
                    this.commissionProxy.updateCommissionAffiliate(new UpdateCommissionAffiliateInput({
                        commissionIds: this.selectedRecords.map(item => item.Id),
                        affiliateContactId: event[0].id,
                        assignToBuyerContact: assignToBuyerContact,
                        reassignTier2Commissions: reassignTier2Commissions
                    })).pipe(
                        finalize(() => this.finishLoading())
                    ).subscribe(() => {
                        this.refresh();
                        this.notify.success(this.l('AppliedSuccessfully'));
                    });
                }
            },
            checkBoxes
        );
    }

    showLedgerHistory(data) {
        this.dialog.open(LedgerHistoryDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                ledgerEntryId: data.Id
            }
        }).afterClosed().subscribe(() => {
        });
    }
}