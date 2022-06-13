/** Core imports */
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
    OnInit,
    OnDestroy,
    ViewChild
} from '@angular/core';
import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';

/** Third party imports */
import { select, Store } from '@ngrx/store';
import { DxComponent } from 'devextreme-angular/core/component';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPivotGridComponent } from 'devextreme-angular/ui/pivot-grid';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { filter, map, takeUntil } from 'rxjs/operators';
import * as moment from 'moment';
import * as _ from 'underscore';
import Chart from 'chart.js';

/** Application imports */
import { CrmService } from '@app/crm/crm.service';
import { FiltersService } from '@shared/filters/filters.service';
import { AppService } from '@app/app.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { PivotGridComponent } from '@app/shared/common/slice/pivot-grid/pivot-grid.component';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import {
    Currency,
    InvoiceSettings,
    ReportServiceProxy,
    SubscriberDailyStatsReportInfo,
    PaymentServiceProxy
} from '@shared/service-proxies/service-proxies';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { CrmStore, OrganizationUnitsStoreActions, OrganizationUnitsStoreSelectors } from '@app/crm/store';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { ExportService } from '@shared/common/export/export.service';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { AppConsts } from '@shared/AppConsts';
import { DateHelper } from '@shared/helpers/DateHelper';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { ReportType } from '@app/crm/reports/report-type.enum';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { SubscriptionTrackerDto } from '@app/crm/reports/subscription-tracker-dto';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { SubscriptionTrackerFields } from '@app/crm/reports/subscription-tracker-fields.enum';
import { ODataService } from '@shared/common/odata/odata.service';
import { TransactionDto } from '@app/crm/reports/transction-dto';
import { StaticListComponent } from '../../shared/common/static-list/static-list.component';
import { Param } from '@shared/common/odata/param.model';
import { FilterSourceComponent } from '../shared/filters/source-filter/source-filter.component';
import { SourceFilterModel } from '../shared/filters/source-filter/source-filter.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { CalendarService } from '@app/shared/common/calendar-button/calendar.service';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { FullScreenService } from '@shared/common/fullscreen/fullscreen.service';
import { StarsStoreSelectors } from '@app/store';
import { StarsListComponent } from '@app/crm/shared/stars-list/stars-list.component';

@Component({
    selector: 'reports-component',
    templateUrl: 'reports.component.html',
    styleUrls: [
        '../shared/styles/client-status.less',
        './reports.component.less'
    ],
    providers: [
        CurrencyPipe,
        DatePipe,
        PhoneFormatPipe,
        ReportServiceProxy,
        LifecycleSubjectsService,
        CalendarService
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('subscribersDataGrid', { static: false }) subscribersDataGrid: DxDataGridComponent;
    @ViewChild('statsDataGrid', { static: false }) statsDataGrid: DxDataGridComponent;
    @ViewChild('subscriptionTrackerGrid', { static: false }) subscriptionTrackerGrid: DxDataGridComponent;
    @ViewChild(PivotGridComponent, { static: false }) salesReportComponent: PivotGridComponent;
    @ViewChild('sourceOrganizationUnits', { static: false }) sourceOrganizationUnits: StaticListComponent;
    @ViewChild('transactionTypes', { static: false }) transactionTypes: StaticListComponent;
    @ViewChild('paymentProviders', { static: false }) paymentProviders: StaticListComponent;
    @ViewChild(StarsListComponent, { static: false }) starsListComponent: StarsListComponent;
    toolbarConfig: ToolbarGroupModel[];
    filters = [];
    filtersValues = {
        sourceOrganizationUnits: [],
        date: {
            ge: undefined,
            le: undefined
        }
    };
    private readonly subscribersReportURI = 'SubscribersReport';
    subscribersDataSource = new DataSource({
        requireTotalCount: false,
        store: new ODataStore({
            url: this.oDataService.getODataUrl(this.subscribersReportURI),
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                request.params.$select = DataGridService.getSelectFields(this.subscribersDataGrid);
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
            },
            deserializeDates: false
        })
    });
    totalDataSource = new DataSource({
        paginate: false,
        store: new ODataStore({
            url: this.oDataService.getODataUrl(this.subscribersReportURI + '/$count'),
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                this.totalCount = this.totalErrorMsg = undefined;
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
            },
            onLoaded: (count: any) => {
                this.dataSource['total'] = this.totalCount = isNaN(count) ? 0 : count;
                this.changeDetectorRef.detectChanges();
            },
            errorHandler: (e: any) => {
                this.totalErrorMsg = this.ls.l('AnHttpErrorOccured');
                this.changeDetectorRef.detectChanges();
            }
        })
    });
    statsDataSource = new DataSource({
        load: (options) => {
            if (!options.requireTotalCount) {
                this.isDataLoaded = false;
                this.changeDetectorRef.detectChanges();
            }
            let dateFilterIsSet = !!this.filtersValues.date;
            return this.reportService.getSubscriberDailyStatsReport(
                this.filtersValues.sourceOrganizationUnits,
                dateFilterIsSet ? this.filtersValues.date.ge : undefined,
                dateFilterIsSet ? this.filtersValues.date.le : undefined
            ).toPromise().then((response: SubscriberDailyStatsReportInfo[]) => {
                this.totalCount = response.length;
                return {
                    data: response,
                    totalCount: response.length
                };
            });
        }
    });
    showAmount = true;
    showRatio = false;
    salesReportDataSourceURI = 'SalesSlice';
    sliceStorageKey = [
        'CRM',
        this.salesReportDataSourceURI,
        this.appSessionService.tenantId,
        this.appSessionService.userId
    ].join('_');
    salesReportGrandTotal = 0;
    salesReportDataSource = {
        remoteOperations: true,
        load: (loadOptions) => {
            this.totalCount = undefined;
            this.salesReportGrandTotal = 0;
            return this.crmService.loadSlicePivotGridData(
                this.oDataService.getODataUrl(
                    this.salesReportDataSourceURI
                ),
                this.filters,
                loadOptions,
                this.getSalesDatesFilter()
            );
        },
        onChanged: (event) => {
            this.totalCount = 0;
            this.isDataLoaded = true;
        },
        onLoadingChanged: (loading) => {
            this.isDataLoaded = !loading;
        },
        onLoadError: () => {
            this.totalCount = 0;
            this.isDataLoaded = true;
        },
        onFieldsPrepared: (fields: any[]) => {
            let transactionType = fields.find(x => x.dataField == 'TransactionType');
            if (transactionType)
                transactionType.filterValues = undefined;
            let paymentProvider = fields.find(x => x.dataField == 'PaymentProvider');
            if (paymentProvider)
                paymentProvider.filterValues = undefined;
        },
        fields: [
            {
                area: 'column',
                caption: 'Group',
                dataType: 'string',
                dataField: 'ProductGroup',
                sortingMethod: (a, b) => !b.value || a.value < b.value ? -1 : 1,
                customizeText: (cellInfo) => cellInfo.valueText || 'Other'
            },
            {
                area: 'row',
                caption: 'Year',
                dataField: 'TransactionDate',
                dataType: 'date',
                groupInterval: 'year',
                name: 'year',
                expanded: true,
            },
            {
                area: 'row',
                caption: 'Month',
                dataField: 'TransactionDate',
                dataType: 'date',
                groupInterval: 'month',
            },
            {
                area: 'row',
                caption: 'Day',
                dataField: 'TransactionDate',
                dataType: 'date',
                groupInterval: 'day',
                showTotals: false
            },
            {
                area: 'data',
                dataType: 'number',
                isMeasure: true,
                summaryType: 'count',
                visible: !this.showRatio && !this.showAmount
            },
            {
                area: 'data',
                caption: '',
                dataType: 'number',
                dataField: 'Amount',
                format: 'currency',
                summaryType: 'sum',
                visible: !this.showRatio && this.showAmount
            },
            {
                area: 'data',
                name: 'Ratio',
                dataType: 'number',
                dataField: 'Amount',
                caption: '',
                summaryType: this.showAmount ? 'sum' : 'count',
                summaryDisplayMode: 'percentOfColumnTotal',
                visible: this.showRatio
            },
            {
                area: 'filter',
                dataType: 'string',
                dataField: 'TransactionType'
            },
            {
                area: 'filter',
                dataType: 'string',
                dataField: 'PaymentProvider'
            }
        ]
    };
    transactionTypes$ = this.paymentService.getTransactionTypes().pipe(
        map(types => {
            return types.sort((prev, next) => {
                return prev == 'Sale' ? -1 : prev.localeCompare(next);
            }).map(v => ({ id: v, name: v }))
        })
    );
    selectedTransactionTypes: string[] = [];
    paymentProviders$ = this.paymentService.getPaymentProviders().pipe(
        map(providers => {
            let providerObjects = providers.map(v => ({ id: v, name: v }));
            providerObjects.push({ id: null, name: this.ls.l('Other') });
            return providerObjects;
        }));
    selectedPaymentProviders: string[] = [];

    readonly subscriptionTrackerFields: KeysEnum<SubscriptionTrackerDto> = SubscriptionTrackerFields;
    transactionMonthsObj = {};
    transactionMonths: string[];
    subscriptionTrackerDataSource = {
        requireTotalCount: true,
        store: {
            type: 'odata',
            key: this.subscriptionTrackerFields.ContactId,
            url: this.oDataService.getODataUrl('SubscriptionTracker'),
            version: AppConsts.ODataVersion,
            deserializeDates: false,
            beforeSend: (request) => {
                if (!request['isExport']) {
                    this.isDataLoaded = false;
                    this.changeDetectorRef.detectChanges();
                }
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
            },
            onLoaded: (contacts: SubscriptionTrackerDto[]) => {
                if (contacts instanceof Array) {
                    const monthFormat = 'MMM YY';
                    contacts.forEach((contact: SubscriptionTrackerDto) => {
                        contact['TransactionRevenues'] = {};
                        contact['TransactionRefunds'] = {};
                        contact['TransactionNetCollected'] = {};
                        contact.Transactions.forEach((transaction: TransactionDto) => {
                            const month: moment.Moment = moment(transaction.Date);
                            const monthString: string = month.format(monthFormat);
                            this.transactionMonthsObj[monthString] = month;
                            if (transaction.Amount > 0) {
                                contact['TransactionRevenues'][monthString] = (contact['TransactionRevenues'][monthString] || 0) + transaction.Amount;
                            } else if (transaction.Amount < 0) {
                                contact['TransactionRefunds'][monthString] = (contact['TransactionRefunds'][monthString] || 0) + transaction.Amount;
                            }
                            contact['TransactionNetCollected'][monthString] = (contact['TransactionNetCollected'][monthString] || 0) + transaction.Amount;
                        });
                    });
                    this.transactionMonths = Object.values(this.transactionMonthsObj)
                        .sort((dateA: moment.Moment, dateB: moment.Moment) => dateA.isAfter(dateB) ? 1 : -1)
                        .map((date: moment.Moment) => date.format(monthFormat));
                }
            }
        }
    };
    totalErrorMsg: string;
    organizationUnits$ = this.store$.pipe(select(OrganizationUnitsStoreSelectors.getOrganizationUnits));
    staticListOrganizationUnits$ = this.organizationUnits$.pipe(
        filter(x => !!x),
        map(orgUnits => orgUnits.map(v => ({ id: v.id, name: v.displayName, parentId: v.parentId, expanded: true })))
    );
    salesOrgUnitFilter = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'SourceOrganizationUnitId',
        hidden: this.appSessionService.hideUserSourceFilters,
        field: 'sourceOrganizationUnitId',
        items: {
            element: new FilterCheckBoxesModel(
                {
                    dataSource$: this.organizationUnits$,
                    nameField: 'displayName',
                    keyExpr: 'id'
                })
        }
    });
    salesDateFilter = new FilterModel({
        component: FilterCalendarComponent,
        caption: this.ls.l('Date'),
        field: 'SalesTransactionDate',
        operator: { from: 'ge', to: 'le' },
        items: { from: new FilterItemModel(), to: new FilterItemModel() },
        options: { method: 'getFilterByDate', params: { useUserTimezone: false }, allowFutureDates: true },
        filterMethod: () => 'cancelled'
    })
    salesAmountFilter = new FilterModel({
        component: FilterInputsComponent,
        options: { type: 'number' },
        operator: { from: 'ge', to: 'le' },
        caption: 'Amount',
        field: 'Amount',
        items: { from: new FilterItemModel(), to: new FilterItemModel() },
        filterMethod: () => 'cancelled'
    });
    starsFilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'Star',
        field: 'StarId',
        items: {
            element: new FilterCheckBoxesModel(
                {
                    dataSource$: this.store$.pipe(select(StarsStoreSelectors.getStars)),
                    nameField: 'name',
                    keyExpr: 'id',
                    templateFunc: (itemData) => {
                        return `<div class="star-item">
                                    <span class="star star-${itemData.colorType.toLowerCase()}"></span>
                                    <span>${this.ls.l(itemData.name)}</span>
                                </div>`;
                    }
                })
        }
    })
    totalCount: number;
    isDataLoaded = false;
    defaultGridPagerConfig = {
        ...DataGridService.defaultGridPagerConfig,
        showPageSizeSelector: false
    };
    formatting = AppConsts.formatting;
    userTimezone = DateHelper.getUserTimezone();
    currency = 'USD';
    selectedReportType = ReportType.SalesReport;
    reportTypes = [
        {
            text: this.ls.l('SalesReport'),
            value: ReportType.SalesReport
        },
        {
            text: this.ls.l('Subscribers'),
            value: ReportType.Subscribers
        },
        {
            text: this.ls.l('SubscriberDailyStats'),
            value: ReportType.SubscribersStats
        },
        {
            text: this.ls.l('SubscriptionTrackerReport'),
            value: ReportType.SubscriptionTracker
        }
    ];
    reportTypesEnum = ReportType;
    subscriptionTrackerColumnsVisibility = {
        buyerInfo: false,
        revenue: false,
        refunds: false,
        netCollected: false
    };
    sparkLineCharts: any = {};
    sliceRepaintTimeout: any;

    constructor(
        private filtersService: FiltersService,
        private reportService: ReportServiceProxy,
        private paymentService: PaymentServiceProxy,
        private store$: Store<CrmStore.State>,
        private exportService: ExportService,
        private changeDetectorRef: ChangeDetectorRef,
        private phonePipe: PhoneFormatPipe,
        private datePipe: DatePipe,
        private currencyPipe: CurrencyPipe,
        private invoiceService: InvoicesService,
        private appSessionService: AppSessionService,
        private oDataService: ODataService,
        public ui: AppUiCustomizationService,
        public ls: AppLocalizationService,
        public appService: AppService,
        public crmService: CrmService,
        public httpInterceptor: AppHttpInterceptor,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        private calendarService: CalendarService,
        private fullScreenService: FullScreenService,
        @Inject(DOCUMENT) private document
    ) { }

    ngOnInit(): void {
        this.activate();
        this.invoiceService.settings$.pipe(
            filter(Boolean),
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            map((settings: InvoiceSettings) => settings.currency)
        ).subscribe((currency: Currency) => {
            this.currency = currency.toString();
        });
        this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(false));
    }

    activate() {
        this.initFilterConfig();
        this.initToolbarConfig();
        this.document.body.classList.add('overflow-hidden');
        this.filtersService.checkIfAnySelected();
        this.filtersService.filtersValues$.pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$)
        ).subscribe((filtersValues) => {
            this.filtersValues = filtersValues;
            this.updateSalesAmountFilter();
            this.updateSalesDateCalendar(filtersValues);
            this.refresh();
            this.initToolbarConfig();
            this.changeDetectorRef.detectChanges();
        });
        this.calendarService.dateRange$.pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$)
        ).subscribe(value => this.updateSalesDatesFilter(value));
    }

    refresh() {
        if (!this.dataGrid)
            return;

        if (this.selectedReportType == ReportType.SalesReport)
            this.dataGrid.instance.getDataSource().reload().then(
                () => this.dataGrid.instance.repaint()
            );
        else if (this.selectedReportType == ReportType.Subscribers) {
            this.isDataLoaded = false;
            this.changeDetectorRef.detectChanges();
            let url = this.oDataService.getODataUrl(
                this.subscribersReportURI + '/$count',
                this.oDataService.processFilters(this.filters, null),
                null, this.getSourceOrgUnitsFilter()
            );
            if (url && this.oDataService.requestLengthIsValid(url)) {
                this.totalDataSource['_store']['_url'] = url;
                this.totalDataSource.load();
            }

            this.oDataService.processODataFilter(this.dataGrid.instance, this.subscribersReportURI, this.filters, null, [], null, null, this.getSourceOrgUnitsFilter());
        } else
            (this.dataGrid as DxDataGridComponent).instance.refresh();
    }

    getSourceOrgUnitsFilter(): Param[] {
        if (this.filtersValues.sourceOrganizationUnits && this.filtersValues.sourceOrganizationUnits.length) {
            return this.filtersValues.sourceOrganizationUnits.map((v, i) => { return { name: `sourceOrgUnitIds[${i}]`, value: v }; });
        }
        return null;
    }

    ngAfterViewInit() {
        this.initDataSource();
    }

    initFilterConfig() {
        this.filters = this.selectedReportType != ReportType.SalesReport ? [
            new FilterModel({
                component: FilterCheckBoxesComponent,
                caption: 'SourceOrganizationUnitId',
                hidden: this.appSessionService.hideUserSourceFilters,
                field: 'sourceOrganizationUnits',
                items: {
                    element: new FilterCheckBoxesModel(
                        {
                            dataSource$: this.organizationUnits$,
                            nameField: 'displayName',
                            keyExpr: 'id'
                        })
                }
            }),
            new FilterModel({
                component: FilterCalendarComponent,
                caption: this.ls.l('Date'),
                operator: { from: 'ge', to: 'le' },
                field: 'date',
                items: { from: new FilterItemModel(), to: new FilterItemModel() },
                options: { method: 'getFilterByDate', params: { useUserTimezone: true } }
            })] : [
            this.salesOrgUnitFilter,
            this.salesDateFilter,
            new FilterModel({
                component: FilterSourceComponent,
                caption: 'Source',
                hidden: this.appSessionService.hideUserSourceFilters,
                items: {
                    element: new SourceFilterModel({
                        ls: this.ls
                    })
                }
            }),
            this.salesAmountFilter,
            this.starsFilterModel
        ];
        this.filtersService.setup(this.filters);
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: () => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                            }, 1000);
                            this.filtersService.fixed = !this.filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this.filtersService.fixed;
                            },
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
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'owner',
                        action: this.toggleSourceOrganizationUnits.bind(this),
                        visible: this.selectedReportType == ReportType.SalesReport,
                        options: {
                            text: this.ls.l('Organization'),
                            icon: './assets/common/icons/folder.svg',
                            accessKey: 'SourceOrganizationUnits'
                        },
                        attr: {
                            'filter-selected': this.salesOrgUnitFilter && this.salesOrgUnitFilter.isSelected
                        }
                    },
                    {
                        name: 'transactionTypes',
                        action: this.toggleTransactionTypes.bind(this),
                        visible: this.selectedReportType == ReportType.SalesReport,
                        options: {
                            text: this.ls.l('Type'),
                            icon: './assets/common/icons/folder.svg',
                            accessKey: 'TransactionTypes'
                        },
                        attr: {
                            'filter-selected': !!this.selectedTransactionTypes.length
                        }
                    },
                    {
                        name: 'paymentProviders',
                        action: this.togglePaymentProviders.bind(this),
                        visible: this.selectedReportType == ReportType.SalesReport,
                        options: {
                            text: this.ls.l('Providers'),
                            icon: './assets/common/icons/folder.svg',
                            accessKey: 'PaymentProviders'
                        },
                        attr: {
                            'filter-selected': !!this.selectedPaymentProviders.length
                        }
                    }
                ]
            },
            {
                location: 'before',
                areItemsDependent: true,
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'Amount',
                        widget: 'dxButton',
                        visible: this.selectedReportType == ReportType.SalesReport,
                        options: {
                            text: this.ls.l('Amount'),
                            checkPressed: () => {
                                return this.showAmount;
                            }
                        },
                        action: () => {
                            this.showAmount = true;
                            this.updatePivotGridView();
                        }
                    },
                    {
                        name: 'Count',
                        widget: 'dxButton',
                        visible: this.selectedReportType == ReportType.SalesReport,
                        options: {
                            text: this.ls.l('Count'),
                            checkPressed: () => {
                                return !this.showAmount;
                            }
                        },
                        action: () => {
                            this.showAmount = false;
                            this.updatePivotGridView();
                        }
                    }
                ]
            },
            {
                location: 'before',
                areItemsDependent: true,
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'Value',
                        widget: 'dxButton',
                        visible: this.selectedReportType == ReportType.SalesReport,
                        options: {
                            text: this.ls.l('Value'),
                            checkPressed: () => {
                                return !this.showRatio;
                            }
                        },
                        action: () => {
                            this.showRatio = false;
                            this.updatePivotGridView();
                        }
                    },
                    {
                        name: 'Ratio',
                        widget: 'dxButton',
                        visible: this.selectedReportType == ReportType.SalesReport,
                        options: {
                            text: this.ls.l('Ratio'),
                            checkPressed: () => {
                                return this.showRatio;
                            }
                        },
                        action: () => {
                            this.showRatio = true;
                            this.updatePivotGridView();
                        }
                    }
                ]
            },
            {
                location: 'before',
                areItemsDependent: true,
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'star',
                        visible: this.selectedReportType == ReportType.SalesReport,
                        action: this.toggleStars.bind(this),
                        attr: {
                            'filter-selected': this.starsFilterModel && this.starsFilterModel.isSelected
                        }
                    }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'download',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.ls.l('Download'),
                            items: [
                                {
                                    action: (options) => {
                                        this.dataGrid.instance.option('export.fileName', this.reportTypes[this.selectedReportType].text);
                                        if (this.dataGrid instanceof DxDataGridComponent) {
                                            this.exportService.exportToXLS(options, this.dataGrid as DxDataGridComponent);
                                        } else {
                                            (<any>this.dataGrid).instance.exportToExcel();
                                        }
                                    },
                                    text: this.ls.l('Export to Excel'),
                                    icon: 'xls',
                                },
                                {
                                    action: (options) => {
                                        this.dataGrid.instance.option('export.fileName', this.reportTypes[this.selectedReportType].text);
                                        this.exportService.exportToCSV(options, this.dataGrid as DxDataGridComponent);
                                    },
                                    visible: false,
                                    text: this.ls.l('Export to CSV'),
                                    icon: 'sheet'
                                },
                                {
                                    action: (options) => {
                                        this.dataGrid.instance.option('export.fileName', this.reportTypes[this.selectedReportType].text);
                                        this.exportService.exportToGoogleSheet(options, this.dataGrid as DxDataGridComponent);
                                    },
                                    text: this.ls.l('Export to Google Sheets'),
                                    icon: 'sheet',
                                    visible: this.dataGrid instanceof DxDataGridComponent
                                },
                                {
                                    type: 'downloadOptions',
                                    visible: this.dataGrid instanceof DxDataGridComponent
                                }
                            ]
                        }
                    }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'fullscreen',
                        action: () => this.fullScreenService.toggleFullscreen(this.document.documentElement)
                    }
                ]
            }
        ];
    }

    updatePivotGridView() {
        let instance = this.salesReportComponent.dataGrid.instance,
            dataSource = instance.getDataSource();
        dataSource.field('Ratio', {
            visible: this.showRatio,
            summaryType: this.showAmount ? 'sum' : 'count'
        });
        dataSource.field('Amount', { visible: !this.showRatio && this.showAmount });
        dataSource.field('Count', { visible: !this.showRatio && !this.showAmount });
        this.initToolbarConfig();
        this.refresh();
    }

    get dataSource() {
        return {
            [ReportType.Subscribers]: this.subscribersDataSource,
            [ReportType.SubscribersStats]: this.statsDataSource,
            [ReportType.SubscriptionTracker]: this.subscriptionTrackerDataSource,
            [ReportType.SalesReport]: this.salesReportDataSource
        }[this.selectedReportType];
    }

    get dataGrid(): any {
        return {
            [ReportType.Subscribers]: this.subscribersDataGrid,
            [ReportType.SubscribersStats]: this.statsDataGrid,
            [ReportType.SubscriptionTracker]: this.subscriptionTrackerGrid,
            [ReportType.SalesReport]: this.salesReportComponent && this.salesReportComponent.dataGrid
        }[this.selectedReportType];
    }

    get isDataGrid() {
        return this.dataGrid instanceof DxDataGridComponent;
    }

    toggleColumnChooser() {
        if (this.dataGrid instanceof DxDataGridComponent) {
            DataGridService.showColumnChooser(this.dataGrid);
        } else if (this.dataGrid instanceof DxPivotGridComponent) {
            this.salesReportComponent.toggleFieldPanel();
        }
    }

    toggleContactView() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
        this.dataGrid.instance.updateDimensions();
    }

    toggleToolbar() {
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
        this.filtersService.fixed = false;
        this.filtersService.disable();
    }

    onContentReady(saveCount = false) {
        this.isDataLoaded = true;
        if (this.selectedReportType != ReportType.SalesReport) {
            let gridInstance = this.dataGrid && this.dataGrid.instance;
            if (gridInstance && saveCount) {
                let dataSource: any = gridInstance.getDataSource && gridInstance.getDataSource();
                if (dataSource && dataSource.totalCount() > 0) {
                    this.totalCount = dataSource.totalCount();
                }
            }
        }
        this.changeDetectorRef.detectChanges();
    }

    customizePhoneCell = (data) => this.phonePipe.transform(data.Phone);

    customizeStatusCell = (data) => this.ls.l('Status' + data.Status);

    customizeCreatedDateCell = (data) => this.datePipe.transform(data.Date, this.formatting.dateTime, this.userTimezone);

    customizeDateCell = (data) => DateHelper.getDateWithoutTime(data.date).format('YYYY-MM-DD');

    customizeBankPassFeeCell = (data) => this.customizeAmountCell(data.BankPassFee);

    customizeBankVaultFeeCell = (data) => this.customizeAmountCell(data.BankVaultFee);

    customizeWtbFeeCell = (data) => this.customizeAmountCell(data.WtbFee);

    customizeTotalFeeCell = (data) => {
        let total = (data.WtbFee || 0) + (data.BankVaultFee || 0) + (data.BankPassFee || 0);
        return total > 0 ? this.customizeAmountCell(total) : undefined;
    };

    customizeBankConnectAmountCell = (data: SubscriberDailyStatsReportInfo) => this.customizeAmountCell(data.bankConnectAmount);

    customizeBankBeyondAmountCell = (data: SubscriberDailyStatsReportInfo) => this.customizeAmountCell(data.bankBeyondAmount);

    customizeStarterKitAmountCell = (data: SubscriberDailyStatsReportInfo) => this.customizeAmountCell(data.starterKitAmount);

    customizeTotalAmountCell = (data: SubscriberDailyStatsReportInfo) => this.customizeAmountCell(data.totalAmount);

    customizeGroupAmountCell = (cellInfo) => this.customizeAmountCell(cellInfo.value);

    customizeAmountCell(value: any) {
        return this.currencyPipe.transform(value, this.currency);
    }

    getTotalText = () => this.ls.l('GrandTotal');

    customizeAmountSummary = (itemInfo) => this.currencyPipe.transform(itemInfo.value, this.currency);

    initDataSource() {
        this.setDataGridInstance(this.dataGrid);

        if (this.selectedReportType == ReportType.SalesReport) {
            this.salesReportComponent.dataGrid.instance.option('fieldPanel', {
                allowFieldDragging: false,
                showColumnFields: false,
                showDataFields: false,
                showFilterFields: false,
                showRowFields: false
            });
        }
    }

    private setDataGridInstance(dataGrid: DxComponent) {
        let instance = dataGrid && dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.dataSource);
        }
    }

    onReportTypeChanged(event) {
        if (event.previousValue != event.value) {
            this.totalCount = null;
            this.isDataLoaded = false;
            this.initFilterConfig();
            this.initToolbarConfig();
            this.changeDetectorRef.detectChanges();
            setTimeout(() => {
                this.initDataSource();
                this.refresh();
            });
        }
    }

    getFullName = (data: SubscriptionTrackerDto) => {
        return data.FullName;
    }

    getTotalRevenue = (data: SubscriptionTrackerDto) => this.currencyPipe.transform(data.TotalRevenue);

    getTotalRefunds = (data: SubscriptionTrackerDto) => this.currencyPipe.transform(data.TotalRefunds);

    getNetCollected = (data: SubscriptionTrackerDto) => this.currencyPipe.transform(data.TotalRevenue + data.TotalRefunds);

    getMonthValue = (cell) => {
        return this.currencyPipe.transform(cell.value || 0);
    }

    trackerGridCellClick(cell) {
        /** Expand/collapse parent columns */
        if (cell.event.target.classList.contains('toggle-button')) {
            this.subscriptionTrackerColumnsVisibility[cell.column.name] =
                !this.subscriptionTrackerColumnsVisibility[cell.column.name];
            cell.event.stopPropagation();
        }
    }

    toggleSourceOrganizationUnits() {
        this.sourceOrganizationUnits.toggle();
        this.changeDetectorRef.detectChanges();
    }

    toggleTransactionTypes() {
        this.transactionTypes.toggle();
        this.changeDetectorRef.detectChanges();
    }

    togglePaymentProviders() {
        this.paymentProviders.toggle();
        this.changeDetectorRef.detectChanges();
    }

    toggleStars() {
        this.starsListComponent.toggle();
    }

    onSaleReportFilterApply(fieldName: string, newValues: any[]) {
        let currentlySelectedItems = fieldName == 'PaymentProvider' ? this.selectedPaymentProviders :
            fieldName == 'TransactionType' ? this.selectedTransactionTypes : null;

        let ids = newValues.map(v => v.id);
        if (currentlySelectedItems.length == ids.length && _.intersection(currentlySelectedItems, ids).length == currentlySelectedItems.length)
            return;

        currentlySelectedItems.splice(0, currentlySelectedItems.length);
        ids.forEach(v => currentlySelectedItems.push(v));
        this.salesReportComponent.dataGrid.instance.getDataSource().field(fieldName, { filterValues: currentlySelectedItems });
        if (this.selectedReportType == ReportType.SalesReport) {
            this.refresh();
        }
        this.initToolbarConfig();
    }

    updateSalesAmountFilter() {
        if (this.selectedReportType != ReportType.SalesReport || !this.salesReportComponent)
            return;

        let filter = [];
        if (this.salesAmountFilter.items.from.value || this.salesAmountFilter.items.from.value === 0)
            filter.push(["Amount", ">", this.salesAmountFilter.items.from.value]);
        if (this.salesAmountFilter.items.to.value || this.salesAmountFilter.items.to.value === 0)
            filter.push(["Amount", "<", this.salesAmountFilter.items.to.value]);
        let dataSource: any = this.salesReportComponent.dataGrid.instance.getDataSource();
        if (dataSource.store())
            this.salesReportComponent.dataGrid.instance.getDataSource().filter(filter);
    }

    onSalesReportContentReady(event) {
        let element = event.component.element().getElementsByClassName('dx-pivotgrid-toolbar')[0],
            header = event.component.element().getElementsByClassName('dx-pivotgrid-horizontal-headers')[0];
        element.addEventListener('click', () => {
            element.classList.toggle('collapsed');
            header.classList.toggle('collapsed');
        });
    }

    onSalesReportCellPrepared(event) {
        let data = event.component.getDataSource().getData();
        if (!data.rows.length || (event.columnIndex && !data.columns[event.columnIndex - 1]))
            return;

        let dataIndex = this.showAmount ? 1 : 0,
            columnIndex = event.columnIndex ?
                data.columns[event.columnIndex - 1].index :
                data.grandTotalColumnIndex;

        if (event.area == 'column' && event.rowIndex) {
            this.appendSparkLineChart(event, data.rows.map(row => {
                return data.values[row.index][columnIndex][dataIndex] || 0;
            }));
        }

        if (event.area == 'data' && event.rowIndex && event.cell.rowType == 'T') {
            let row = { children: data.rows };
            event.cell.rowPath.forEach(path => {
                row = row.children.find(entity => entity.value == path);
            });

            this.appendSparkLineChart(event, row.children.map(row => {
                return data.values[row.index][columnIndex][dataIndex] || 0;
            }), event.cell.rowPath);
        }
    }

    appendSparkLineChart(event, data, path?) {
        if (data.length) {
            let chartKey = 'chartTotal' + event.columnIndex + (path ? path.join('_') : '');
            setTimeout(() => {
                if (!path && !this.salesReportGrandTotal)
                    this.salesReportGrandTotal = Math.max.apply(Math.max, data);
                this.initSparkLineChart(chartKey, data, event.columnIndex, !path);
                event.cellElement.appendChild(this.sparkLineCharts[chartKey].element);
            }, 100);

            clearTimeout(this.sliceRepaintTimeout);
            this.sliceRepaintTimeout = setTimeout(
                () => event.component.updateDimensions(), 1000
            );
        }
    }

    initSparkLineChart(chartKey, data, index, isGrandTotal) {
        if (this.sparkLineCharts[chartKey]) {
            let chart = this.sparkLineCharts[chartKey].handler;
            chart.data.labels = chart.data.datasets[0].data = data;
            chart.update();
        } else {
            let divWrapper: any = document.createElement('div'),
                canvasElement: any = document.createElement('canvas'),
                colors = ['#402bb2', '#ac5fcf', '#ba2d31', '#267343', '#135387', '#00aeef', '#fa9224', '#d91b5f', '#3bb26c', '#b29d2b', '#b24f2b', '#83b22b', '#b22b9d', '#c1bcd9', '#1855c7'];
            canvasElement.id = chartKey;
            divWrapper.style.maxWidth = '80px';
            divWrapper.style.height = '40px';
            divWrapper.style.margin = 'auto';
            divWrapper.appendChild(canvasElement);
            if (index > colors.length - 1)
                index = index % colors.length;
            this.sparkLineCharts[chartKey] = {
                element: divWrapper,
                handler: new Chart(canvasElement, {
                    type: 'bar',
                    data: {
                        labels: data,
                        datasets: [{
                            borderColor: '#def9f3',
                            backgroundColor: colors[index],
                            data: data,
                            borderWidth: 0
                        }]
                    },
                    options: {
                        title: {
                            display: false,
                        },
                        tooltips: {
                            enabled: false
                        },
                        legend: {
                            display: false
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            xAxes: [{
                                display: false,
                                stacked: true
                            }],
                            yAxes: [{
                                display: false,
                                stacked: true,
                                ticks: {
                                    beginAtZero: true,
                                    suggestedMin: 0,
                                    suggestedMax: isGrandTotal && data.length == 1
                                        ? this.salesReportGrandTotal : Math.max.apply(Math.max, data)
                                }
                            }]
                        },
                        layout: {
                            padding: {
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0
                            }
                        }
                    }
                })
            };
        }
    }

    updateSalesDatesFilter(value: CalendarValuesModel) {
        let toolbarFrom = value.from && value.from.value ? moment(value.from.value) : moment();
        let toolbarTo = value.to && value.to.value ? moment(value.to.value) : moment();
        let filterFrom = this.salesDateFilter.items.from && this.salesDateFilter.items.from.value ? moment(this.salesDateFilter.items.from.value) : moment();
        let filterTo = this.salesDateFilter.items.to && this.salesDateFilter.items.to.value ? moment(this.salesDateFilter.items.to.value) : moment();
        if (!toolbarFrom.isSame(filterFrom, 'day') || !toolbarTo.isSame(filterTo, 'day')) {
            this.salesDateFilter.items.from.value = value.from.value;
            this.salesDateFilter.items.to.value = value.to.value;
            this.salesDateFilter.items.period = <any>value.period;
            this.filtersService.change([this.salesDateFilter]);
            this.salesDateFilter.updateCaptions();
            this.changeDetectorRef.detectChanges();
        }
    }

    updateSalesDateCalendar(filtersValues) {
        if (filtersValues && filtersValues.SalesTransactionDate) {
            let model = new CalendarValuesModel();
            model.period = <any>this.salesDateFilter.items.period;
            let from = this.salesDateFilter.items.from ? this.salesDateFilter.items.from.value : null;
            let to = this.salesDateFilter.items.to ? this.salesDateFilter.items.to.value : null;
            model.from = { value: from };
            model.to = { value: to };
            model.period = from && to ? <any>this.salesDateFilter.items.period : null;
            this.calendarService.dateRange.next(model);
        }
    }

    getSalesDatesFilter() {
        let filter = {};
        if (this.salesDateFilter.items.from.value) {
            let date = new Date(this.salesDateFilter.items.from.value.getTime());
            date.setHours(0, 0, 0, 0);
            filter['utcStartDate'] = date.toJSON();
        }
        if (this.salesDateFilter.items.to.value) {
            let date = new Date(this.salesDateFilter.items.to.value.getTime());
            date.setHours(23, 59, 59, 999);
            filter['utcEndDate'] = date.toJSON();
        }
        return filter;
    }

    resetGridState() {
        if (this.isDataGrid)
            (this.dataGrid as DxDataGridComponent).instance.state(null);
    }

    deactivate() {
        this.filtersService.unsubscribe();
    }

    ngOnDestroy() {
        this.lifeCycleSubjectsService.destroy.next();
        this.deactivate();
    }
}