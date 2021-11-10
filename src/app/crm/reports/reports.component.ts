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
import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import * as moment from 'moment';

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
    SubscriberDailyStatsReportInfo
} from '@shared/service-proxies/service-proxies';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { CrmStore, OrganizationUnitsStoreActions, OrganizationUnitsStoreSelectors } from '@app/crm/store';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ExportService } from '@shared/common/export/export.service';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { AppConsts } from '@shared/AppConsts';
import { DateHelper } from '@shared/helpers/DateHelper';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { ReportType } from '@app/crm/reports/report-type.enum';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { SubscriptionTrackerDto } from '@app/crm/reports/subscription-tracker-dto';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { SubscriptionTrackerFields } from '@app/crm/reports/subscription-tracker-fields.enum';
import { ODataService } from '@shared/common/odata/odata.service';
import { TransactionDto } from '@app/crm/reports/transction-dto';
import { Param } from '@shared/common/odata/param.model';

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
        LifecycleSubjectsService
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('subscribersDataGrid', { static: false }) subscribersDataGrid: DxDataGridComponent;
    @ViewChild('statsDataGrid', { static: false }) statsDataGrid: DxDataGridComponent;
    @ViewChild('subscriptionTrackerGrid', { static: false }) subscriptionTrackerGrid: DxDataGridComponent;
    @ViewChild(PivotGridComponent, { static: false }) salesReportComponent: PivotGridComponent;
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
                if (!isNaN(count))
                    this.dataSource['total'] = this.totalCount = count;
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
            return this.reportService.getSubscriberDailyStatsReport(
                this.filtersValues.sourceOrganizationUnits,
                this.filtersValues.date.ge,
                this.filtersValues.date.le
            ).toPromise().then((response: SubscriberDailyStatsReportInfo[]) => {
                this.totalCount = response.length;
                return {
                    data: response,
                    totalCount: response.length
                };
            });
        }
    });
    salesReportDataSourceURI = 'SalesSlice';
    sliceStorageKey = [
        'CRM',
        this.salesReportDataSourceURI,
        this.appSessionService.tenantId,
        this.appSessionService.userId
    ].join('_');
    salesReportDataSource = {
        remoteOperations: true,
        load: (loadOptions) => {
            return this.crmService.loadSlicePivotGridData(
                this.oDataService.getODataUrl(
                    this.salesReportDataSourceURI
                ),
                this.filters,
                loadOptions
            );
        },
        onChanged: (event) => {
            this.isDataLoaded = true;
            this.totalCount = undefined;
        },
        onLoadingChanged: (loading) => {
            this.isDataLoaded = !loading;
        },
        onLoadError: () => {
            this.isDataLoaded = true;
        },
        fields: [
            {
                area: 'column',
                caption: 'Group',
                dataType: 'string',
                dataField: 'ProductGroup'
            },
            {
                area: 'row',
                caption: 'Year',
                dataField: 'TransactionDate',
                dataType: 'date',
                groupInterval: 'year',
                name: 'year',
                expanded: true,
                showTotals: false
            },
            {
                area: 'row',
                caption: 'Month',
                dataField: 'TransactionDate',
                dataType: 'date',
                groupInterval: 'month',
                showTotals: false
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
                name: 'count',
                isMeasure: true,
                summaryType: 'count'
            },
            {
                area: 'data',
                dataType: 'number',
                dataField: 'Amount',
                format: 'currency',
                summaryType: 'sum'
            }
        ]
    };
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
    totalCount: number;
    isDataLoaded = false;
    defaultGridPagerConfig = DataGridService.defaultGridPagerConfig;
    formatting = AppConsts.formatting;
    userTimezone = DateHelper.getUserTimezone();
    currency = 'USD';
    selectedReportType = ReportType.Subscribers;
    reportTypes = [
        {
            text: this.ls.l('Subscribers'),
            value: ReportType.Subscribers
        },
        {
            text: this.ls.l('SalesReport'),
            value: ReportType.SalesReport
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

    constructor(
        private filtersService: FiltersService,
        private reportService: ReportServiceProxy,
        private store$: Store<CrmStore.State>,
        private loadingService: LoadingService,
        private exportService: ExportService,
        private changeDetectorRef: ChangeDetectorRef,
        private phonePipe: PhoneFormatPipe,
        private datePipe: DatePipe,
        private currencyPipe: CurrencyPipe,
        private cacheService: CacheService,
        private cacheHelper: CacheHelper,
        private invoiceService: InvoicesService,
        private appSessionService: AppSessionService,
        private oDataService: ODataService,
        public ui: AppUiCustomizationService,
        public ls: AppLocalizationService,
        public appService: AppService,
        public crmService: CrmService,
        public httpInterceptor: AppHttpInterceptor,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
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
        this.totalDataSource.load();
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
            this.refresh();
        });
    }

    refresh() {
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
                hidden: this.appSessionService.userIsMember,
                field: 'sourceOrganizationUnits',
                items: {
                    element: new FilterCheckBoxesModel(
                        {
                            dataSource$: this.store$.pipe(select(OrganizationUnitsStoreSelectors.getOrganizationUnits)),
                            dispatch: () => this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(false)),
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
                new FilterModel({
                    component: FilterCalendarComponent,
                    caption: this.ls.l('Date'),
                    field: 'TransactionDate',
                    operator: { from: 'ge', to: 'le' },
                    items: { from: new FilterItemModel(), to: new FilterItemModel() },
                    options: { method: 'getFilterByDate', params: { useUserTimezone: true } }
                })
            ];
        this.filtersService.setup(this.filters);
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        disabled: this.selectedReportType == ReportType.SalesReport,
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
                                            this.dataGrid.instance.exportToExcel();
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
            }
        ];
    }

    get dataSource() {
        return {
            [ReportType.Subscribers]: this.subscribersDataSource,
            [ReportType.SubscribersStats]: this.statsDataSource,
            [ReportType.SubscriptionTracker]: this.subscriptionTrackerDataSource,
            [ReportType.SalesReport]: this.salesReportDataSource
        }[this.selectedReportType];
    }

    get dataGrid() {
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

    customizeDateCell = (data) => DateHelper.getDateWithoutTime(data.Date).format('YYYY-MM-DD');

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
            this.subscriptionTrackerColumnsVisibility[cell.column.name] = !this.subscriptionTrackerColumnsVisibility[cell.column.name];
            cell.event.stopPropagation();
        }
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