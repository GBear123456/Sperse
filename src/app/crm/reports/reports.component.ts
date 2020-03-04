/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
    OnInit,
    ViewChild
} from '@angular/core';
import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';

/** Third party imports */
import { select, Store } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/** Application imports */
import { FiltersService } from '@shared/filters/filters.service';
import { AppService } from '@app/app.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    OrderSubscriptionServiceProxy,
    SubscriptionsDetailedReportInfo
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

@Component({
    selector: 'reports-component',
    templateUrl: 'reports.component.html',
    styleUrls: [
        '../shared/styles/client-status.less',
        './reports.component.less'
    ],
    providers: [ CurrencyPipe, DatePipe, PhoneFormatPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
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
                                    this.dataGrid.instance.option('export.fileName', '');
                                    this.exportService.exportToXLS(options, this.dataGrid);
                                },
                                text: this.ls.l('Export to Excel'),
                                icon: 'xls',
                            },
                            {
                                action: (options) => {
                                    this.dataGrid.instance.option('export.fileName', this.ls.l(''));
                                    this.exportService.exportToCSV(options, this.dataGrid);
                                },
                                text: this.ls.l('Export to CSV'),
                                icon: 'sheet'
                            },
                            {
                                action: (options) => {
                                    this.dataGrid.instance.option('export.fileName', '');
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
    dataSource = new DataSource({
        paginate: false,
        load: (options) => {
            if (!options.requireTotalCount) {
                this.isDataLoaded = false;
                this.changeDetectorRef.detectChanges();
            }
            return this.orderSubscription.getDetailedReport(
                this.filtersValues.sourceOrganizationUnits,
                this.filtersValues.date.startDate,
                this.filtersValues.date.endDate
            ).toPromise().then((response: SubscriptionsDetailedReportInfo[]) => {
                this.totalCount = response.length;
                return {
                    data: response,
                    totalCount: this.totalCount
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

    constructor(
        private filtersService: FiltersService,
        private orderSubscription: OrderSubscriptionServiceProxy,
        private store$: Store<CrmStore.State>,
        private loadingService: LoadingService,
        private exportService: ExportService,
        private changeDetectorRef: ChangeDetectorRef,
        private phonePipe: PhoneFormatPipe,
        private datePipe: DatePipe,
        private currencyPipe: CurrencyPipe,
        public ls: AppLocalizationService,
        public appService: AppService,
        public httpInterceptor: AppHttpInterceptor,
        @Inject(DOCUMENT) private document
    ) {}

    ngOnInit(): void {
        this.activate();
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

    customizePhoneCell = (data) => {
        return this.phonePipe.transform(data.phone);
    }

    customizeStatusCell = (data) => {
        return this.ls.l('Status' + data.status);
    }

    customizeCreatedCell = (data) => {
        return this.datePipe.transform(data.created, this.formatting.dateTime, this.userTimezone);
    }

    customizeBankPassFeeCell = (data: SubscriptionsDetailedReportInfo) => this.customizeAmountCell(data, 'bankPassFee');

    customizeBankVaultFeeCell = (data: SubscriptionsDetailedReportInfo) => this.customizeAmountCell(data, 'bankVaultFee');

    customizeWtbFeeCell = (data: SubscriptionsDetailedReportInfo) => this.customizeAmountCell(data, 'wtbFee');

    customizeTotalCell = (data: SubscriptionsDetailedReportInfo) => this.customizeAmountCell(data, 'total');

    customizeAmountCell(data: SubscriptionsDetailedReportInfo, field: string) {
        return this.currencyPipe.transform(data[field], this.currency);
    }

    reload() {
        this.dataGrid.instance.refresh();
    }

    deactivate() {
        this.filtersService.unsubscribe();
        this.deactivate$.next(null);
    }
}