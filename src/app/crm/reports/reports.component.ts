/** Core imports */
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';

/** Third party imports */
import { select, Store } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';

/** Application imports */
import { FiltersService } from '@shared/filters/filters.service';
import { AppService } from '@app/app.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    Currency,
    InvoiceSettings,
    ReportServiceProxy,
    SubscriberDailyStatsReportInfo,
    SubscribersReportInfo
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

@Component({
    selector: 'reports-component',
    templateUrl: 'reports.component.html',
    styleUrls: [
        '../shared/styles/client-status.less',
        './reports.component.less'
    ],
    providers: [ CurrencyPipe, DatePipe, PhoneFormatPipe, ReportServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit, AfterViewInit {
    @ViewChild('subscribersDataGrid') subscribersDataGrid: DxDataGridComponent;
    @ViewChild('statsDataGrid') statsDataGrid: DxDataGridComponent;
    toolbarConfig = [
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
                                    this.exportService.exportToXLS(options, this.dataGrid);
                                },
                                text: this.ls.l('Export to Excel'),
                                icon: 'xls',
                            },
                            {
                                action: (options) => {
                                    this.dataGrid.instance.option('export.fileName', this.reportTypes[this.selectedReportType].text);
                                    this.exportService.exportToCSV(options, this.dataGrid);
                                },
                                text: this.ls.l('Export to CSV'),
                                icon: 'sheet'
                            },
                            {
                                action: (options) => {
                                    this.dataGrid.instance.option('export.fileName', this.reportTypes[this.selectedReportType].text);
                                    this.exportService.exportToGoogleSheet(options, this.dataGrid);
                                },
                                text: this.ls.l('Export to Google Sheets'),
                                icon: 'sheet'
                            },
                            {
                                type: 'downloadOptions'
                            }
                        ]
                    }
                },
                {
                    name: 'columnChooser',
                    action: () => DataGridService.showColumnChooser(this.dataGrid)
                }
            ]
        }
    ];
    filtersValues = {
        sourceOrganizationUnits: undefined,
        date: {
            startDate: undefined,
            endDate: undefined
        }
    };
    subscribersDataSource = new DataSource({
        load: (options) => {
            if (!options.requireTotalCount) {
                this.isDataLoaded = false;
                this.changeDetectorRef.detectChanges();
            }
            return this.reportService.getSubscribersReport(
                this.filtersValues.sourceOrganizationUnits,
                this.filtersValues.date.startDate,
                this.filtersValues.date.endDate
            ).toPromise().then((response: SubscribersReportInfo[]) => {
                this.totalCount = response.length;
                return {
                    data: response,
                    totalCount: this.totalCount
                };
            });
        }
    });
    statsDataSource = new DataSource({
        load: (options) => {
            if (!options.requireTotalCount) {
                this.isDataLoaded = false;
                this.changeDetectorRef.detectChanges();
            }
            return this.reportService.getSubscriberDailyStatsReport(
                this.filtersValues.sourceOrganizationUnits,
                this.filtersValues.date.startDate,
                this.filtersValues.date.endDate
            ).toPromise().then((response: SubscriberDailyStatsReportInfo[]) => {
                this.totalCount = response.length;
                return {
                    data: response,
                    totalCount: response.length
                };
            });
        }
    });
    filters = [
        new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'OrganizationUnitId',
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
            caption: 'date',
            operator: { from: 'startDate', to: 'endDate' },
            field: 'date',
            items: { from: new FilterItemModel(), to: new FilterItemModel() },
            options: { method: 'getFilterByDate', params: { useUserTimezone: true } }
        })
    ];
    deactivate$: Subject<null> = new Subject<null>();
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
            text: this.ls.l('SubscriberDailyStats'),
            value: ReportType.SubscribersStats
        }
    ];
    reportTypesEnum = ReportType;
    private readonly REPORT_TYPE_CACHE_KEY = 'REPORT_TYPE';

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
        public ui: AppUiCustomizationService,
        public ls: AppLocalizationService,
        public appService: AppService,
        public httpInterceptor: AppHttpInterceptor,
        @Inject(DOCUMENT) private document
    ) {}

    ngOnInit(): void {
        this.activate();
        this.invoiceService.settings$.pipe(
            takeUntil(this.deactivate$),
            map((settings: InvoiceSettings) => settings.currency)
        ).subscribe((currency: Currency) => {
            this.currency = currency.toString();
        });
    }

    activate() {
        this.document.body.classList.add('overflow-hidden');
        this.filtersService.setup(this.filters);
        this.filtersService.checkIfAnySelected();
        this.filtersService.filtersValues$.pipe(
            takeUntil(this.deactivate$)
        ).subscribe((filtersValues) => {
            this.filtersValues = filtersValues;
            this.dataGrid.instance.refresh();
        });
    }

    ngAfterViewInit() {
        this.initDataSource();
    }

    get dataSource() {
        return this.selectedReportType === ReportType.Subscribers
            ? this.subscribersDataSource
            : this.statsDataSource;
    }

    get dataGrid() {
        return this.selectedReportType === ReportType.Subscribers
                ? this.subscribersDataGrid
                : this.statsDataGrid;
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

    onContentReady() {
        this.isDataLoaded = true;
        this.changeDetectorRef.detectChanges();
    }

    customizePhoneCell = (data) => this.phonePipe.transform(data.phone);

    customizeStatusCell = (data) => this.ls.l('Status' + data.status);

    customizeCreatedCell = (data) => this.datePipe.transform(data.created, this.formatting.dateTime, this.userTimezone);

    customizeDateCell = (data) => DateHelper.getDateWithoutTime(data.date).format('YYYY-MM-DD');

    customizeBankPassFeeCell = (data: SubscribersReportInfo) => this.customizeAmountCell(data, 'bankPassFee');

    customizeBankVaultFeeCell = (data: SubscribersReportInfo) => this.customizeAmountCell(data, 'bankVaultFee');

    customizeWtbFeeCell = (data: SubscribersReportInfo) => this.customizeAmountCell(data, 'wtbFee');

    customizeTotalCell = (data: SubscribersReportInfo) => this.customizeAmountCell(data, 'total');

    customizeBankConnectAmountCell = (data: SubscribersReportInfo) => this.customizeAmountCell(data, 'bankConnectAmount');

    customizeBankBeyondAmountCell = (data: SubscribersReportInfo) => this.customizeAmountCell(data, 'bankBeyondAmount');

    customizeStarterKitAmountCell = (data: SubscribersReportInfo) => this.customizeAmountCell(data, 'starterKitAmount');

    customizeTotalAmountCell = (data: SubscribersReportInfo) => this.customizeAmountCell(data, 'totalAmount');

    customizeAmountCell(data: any, field: string) {
        return this.currencyPipe.transform(data[field], this.currency);
    }

    customizeAmountSummary = (itemInfo) => this.currencyPipe.transform(itemInfo.value, this.currency);

    initDataSource() {
        if (this.selectedReportType === ReportType.Subscribers) {
            this.setDataGridInstance(this.dataGrid);
        } else if (this.selectedReportType === ReportType.SubscribersStats) {
            this.setDataGridInstance(this.dataGrid);
        }
    }

    private setDataGridInstance(dataGrid: DxDataGridComponent) {
        let instance = dataGrid && dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.dataSource);
        }
    }

    onReportTypeChanged(event) {
        if (event.previousValue != event.value) {
            this.totalCount = null;
            this.isDataLoaded = false;
            this.changeDetectorRef.detectChanges();
            this.cacheService.set(
                this.cacheHelper.getCacheKey(this.REPORT_TYPE_CACHE_KEY, this.constructor.name),
                event.value
            );
             setTimeout(() => {
                 this.initDataSource();
                 this.reload();
            });
        }
    }

    reload() {
        this.dataGrid.instance.refresh();
    }

    deactivate() {
        this.filtersService.unsubscribe();
        this.deactivate$.next(null);
    }
}