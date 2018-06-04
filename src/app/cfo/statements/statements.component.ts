import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AppConsts } from '@shared/AppConsts';

import { AppService } from '@app/app.service';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { BankAccountsService } from '@app/cfo/shared/helpers/bank-accounts.service';
import { CacheService } from 'ng2-cache-service';
import { DxDataGridComponent } from 'devextreme-angular';
import { SynchProgressComponent } from '@app/cfo/shared/common/synch-progress/synch-progress.component';

import {
    StatsFilter,
    BankAccountsServiceProxy,
    BankAccountDailyStatDto,
    GroupBy,
    CashFlowForecastServiceProxy,
    InstanceType
} from '@shared/service-proxies/service-proxies';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

import { BankAccountsSelectComponent } from '@app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import * as _ from 'underscore';
import * as moment from 'moment';
import { BankAccountFilterComponent } from '@shared/filters/bank-account-filter/bank-account-filter.component';
import { BankAccountFilterModel } from '@shared/filters/bank-account-filter/bank-account-filter.model';
import { ReportPeriodComponent } from '@app/cfo/shared/report-period/report-period.component';

@Component({
    templateUrl: './statements.component.html',
    styleUrls: ['./statements.component.less'],
    providers: [BankAccountsServiceProxy, CashFlowForecastServiceProxy, CacheService]
})
export class StatementsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(BankAccountsSelectComponent) bankAccountSelector: BankAccountsSelectComponent;
    @ViewChild(ReportPeriodComponent) reportPeriodSelector: ReportPeriodComponent;
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;

    public headlineConfig;
    private bankAccountCount = '';
    visibleAccountCount = 0;
    private forecastModelsObj: { items: Array<any>, selectedItemIndex: number } = { items: [], selectedItemIndex: null };
    private filters: FilterModel[] = new Array<FilterModel>();
    public sliderReportPeriod = {
        start: null,
        end: null,
        minDate: moment().utc().subtract(10, 'year').year(),
        maxDate: moment().utc().add(10, 'year').year()
    };

    private requestFilter: StatsFilter;
    public statementsData: BankAccountDailyStatDto[] = [];

    public currencyFormat = {
        type: 'currency',
        precision: 2
    };

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Statements')],
            onRefresh: this.refreshData.bind(this),
            iconSrc: 'assets/common/icons/credit-card-icon.svg'
        };
    }

    initToolbarConfig() {
        this._appService.toolbarConfig = <any>[
            {
                location: 'before',
                items: [
                    {
                        name: 'filters',
                        action: (event) => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                            }, 1000);
                            this._filtersService.fixed = !this._filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this._filtersService.fixed;
                            },
                            mouseover: (event) => {
                                this._filtersService.enable();
                            },
                            mouseout: (event) => {
                                if (!this._filtersService.fixed)
                                    this._filtersService.disable();
                            }
                        },
                        attr: {
                            'filter-selected': this._filtersService.hasFilterSelected
                        }
                    }
                ]
            },
            {
                location: 'before',
                items: [
                    {
                        name: 'select-box',
                        text: '',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Scenario'),
                            accessKey: 'statsForecastSwitcher',
                            items: this.forecastModelsObj.items,
                            selectedIndex: this.forecastModelsObj.selectedItemIndex,
                            height: 39,
                            width: 243,
                            onSelectionChanged: (e) => {
                                if (e) {
                                    this.refreshData();
                                }
                            }
                        }
                    }
                ]
            },
            {
                location: 'before',
                items: [
                    {
                        name: 'reportPeriod',
                        action: this.toggleReportPeriodFilter.bind(this),
                        options: {
                            id: 'reportPeriod',
                            icon: 'assets/common/icons/report-period.svg'
                        }
                    },
                    {
                        name: 'bankAccountSelect',
                        widget: 'dxButton',
                        action: this.toggleBankAccountTooltip.bind(this),
                        options: {
                            id: 'bankAccountSelect',
                            text: this.l('Accounts'),
                            icon: 'assets/common/icons/accounts.svg'
                        },
                        attr: {
                            'custaccesskey': 'bankAccountSelect',
                            'accountCount': this.bankAccountCount
                        }
                    }
                ]
            },
            {
                location: 'after',
                items: [
                    { name: 'showCompactRowsHeight', action: this.showCompactRowsHeight.bind(this) },
                    {
                        name: 'download',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Download'),
                            items: [
                                {
                                    action: Function(),
                                    text: this.ls(AppConsts.localization.defaultLocalizationSourceName, 'SaveAs', 'PDF'),
                                    icon: 'pdf',
                                }, {
                                    action: this.exportToXLS.bind(this),
                                    text: this.l('Export to Excel'),
                                    icon: 'xls',
                                }, {
                                    action: this.exportToGoogleSheet.bind(this),
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet'
                                },
                                { type: 'downloadOptions' }
                            ]
                        }
                    },
                    { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
                ]
            }
        ];
    }

    constructor(
        injector: Injector,
        private _appService: AppService,
        private _filtersService: FiltersService,
        private _bankAccountService: BankAccountsServiceProxy,
        private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
        private _cacheService: CacheService,
        private _bankAccountsService: BankAccountsService
    ) {
        super(injector);

        this._filtersService.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
        this._cacheService = this._cacheService.useStorage(0);

        this.requestFilter = new StatsFilter();
        this.requestFilter.currencyId = 'USD';
        this.requestFilter.startDate = moment().utc().subtract(2, 'year');
        this.requestFilter.endDate = moment().utc().add(1, 'year');
    }

    ngOnInit(): void {
        super.ngOnInit();

        let getForecastModelsObservable = this._cashFlowForecastServiceProxy.getModels(InstanceType[this.instanceType], this.instanceId);
        let getBankAccountsObservable = this._bankAccountService.getBankAccounts(InstanceType[this.instanceType], this.instanceId, 'USD');
        Observable.forkJoin(getForecastModelsObservable, getBankAccountsObservable)
            .subscribe(result => {
                this.handleForecastModelResult(result[0]);
                this.createFilters(result[1]);
                this._filtersService.setup(this.filters);
                this.initFiltering();
                this.initToolbarConfig();
            });

        this.initHeadlineConfig();
        this.initToolbarConfig();
    }

    createFilters(bankAccounts) {
        this.filters = [
            new FilterModel({
                component: FilterCalendarComponent,
                caption: 'Date',
                items: { from: new FilterItemModel(), to: new FilterItemModel() },
                options: {
                    allowFutureDates: true,
                    endDate: moment(new Date()).add(10, 'years').toDate()
                }
            }),
            new FilterModel({
                field: 'accountIds',
                component: BankAccountFilterComponent,
                caption: 'Account',
                items: {
                    element: new BankAccountFilterModel(
                        {
                            dataSource: bankAccounts,
                            nameField: 'name',
                            keyExpr: 'id'
                        })
                }
            })
        ];
    }

    handleForecastModelResult(result) {
        let items = result.map(forecastModelItem => {
            return {
                id: forecastModelItem.id,
                text: forecastModelItem.name
            };
        });

        this.forecastModelsObj = {
            items: items,
            selectedItemIndex: 0
        };
    }

    ngAfterViewInit(): void {
        this.showCompactRowsHeight();

        let rootComponent = this.getRootComponent();
        rootComponent.overflowHidden(true);
    }

    public refreshData(): void {
        abp.ui.setBusy();
        this._bankAccountService.getStats(
            InstanceType[this.instanceType],
            this.instanceId,
            'USD',
            this.forecastModelsObj.items[this.forecastModelsObj.selectedItemIndex].id,
            this.requestFilter.accountIds,
            this.requestFilter.startDate,
            this.requestFilter.endDate,
            undefined,
            GroupBy.Monthly
        )
            .finally(() => abp.ui.clearBusy())
            .subscribe(result => {
                if (result) {
                    let currentPeriodTransaction: BankAccountDailyStatDto;
                    let currentPeriodForecast: BankAccountDailyStatDto;

                    for (let i = result.length - 1; i >= 0; i--) {
                        let statsItem: BankAccountDailyStatDto = result[i];

                        Object.defineProperties(statsItem, {
                            'netChange': { value: statsItem.credit + statsItem.debit, enumerable: true },
                        });

                        if (!currentPeriodTransaction && !statsItem.isForecast) {
                            currentPeriodForecast = result[i + 1];
                            currentPeriodTransaction = statsItem;

                            if (currentPeriodForecast) {
                                let clone = Object.assign({}, currentPeriodTransaction);
                                clone.credit += currentPeriodForecast.credit;
                                clone.creditCount += currentPeriodForecast.creditCount;
                                clone.debit += currentPeriodForecast.debit;
                                clone.debitCount += currentPeriodForecast.debitCount;
                                clone['netChange'] = clone.credit + clone.debit;
                                clone.averageDailyBalance = (clone.averageDailyBalance + currentPeriodForecast.averageDailyBalance) / 2;
                                clone.endingBalance = currentPeriodForecast.endingBalance;

                                currentPeriodTransaction['itemType'] = 'MTD';
                                currentPeriodForecast['itemType'] = 'Forecast';
                                clone['sourceData'] = [ currentPeriodTransaction, currentPeriodForecast ];
                                result.splice(i, 2, clone);
                            }
                        }
                    }

                    this.statementsData = result;

                    /** reinit */
                    this.initHeadlineConfig();

                    this.setSliderReportPeriodFilterData(this.statementsData[0].date.year(), this.statementsData[this.statementsData.length - 1].date.year());
                } else {
                    result = [];
                }
            });
        this.bankAccountSelector.getBankAccounts(true);
    }

    initFiltering() {
        this._filtersService.apply(() => {
            for (let filter of this.filters) {
                if (filter.caption.toLowerCase() === 'date') {
                    if (filter.items.from.value)
                        this.sliderReportPeriod.start = filter.items.from.value.getFullYear();
                    else
                        this.sliderReportPeriod.start = this.sliderReportPeriod.minDate;

                    if (filter.items.to.value)
                        this.sliderReportPeriod.end = filter.items.to.value.getFullYear();
                    else
                        this.sliderReportPeriod.end = this.sliderReportPeriod.maxDate;
                }
                if (filter.caption.toLowerCase() === 'account') {
                    this.bankAccountSelector.setSelectedBankAccounts(filter.items.element.value);
                    this.setBankAccountCount(filter.items.element.value, this.visibleAccountCount);
                }

                let filterMethod = FilterHelpers['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod)
                    filterMethod(filter, this.requestFilter);
                else
                    this.requestFilter[filter.field] = undefined;
            }

            this.refreshData();
            this.initToolbarConfig();
        });
    }

    setBankAccountCount(bankAccountIds, visibleAccountCount) {
        this.bankAccountCount = this._bankAccountsService.getBankAccountCount(bankAccountIds, visibleAccountCount);
    }

    toggleBankAccountTooltip() {
        this.bankAccountSelector.toggleBankAccountTooltip();
    }

    toggleReportPeriodFilter() {
        this.reportPeriodSelector.toggleReportPeriodFilter();
    }

    expandColapseRow(e) {
        if (!e.data.sourceData) return;

        if (e.isExpanded) {
            e.component.collapseRow(e.key);
        } else {
            e.component.expandRow(e.key);
        }
    }

    setSliderReportPeriodFilterData(start, end) {
        let dateFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'date'; });
        if (dateFilter) {
            if (!dateFilter.items['from'].value)
                this.sliderReportPeriod.start = start;
            if (!dateFilter.items['to'].value)
                this.sliderReportPeriod.end = end;
        }
    }

    setReportPeriodFilter(period) {
        let dateFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'date'; });

        if (period.start) {
            let from = new Date(period.start + '-01-01');
            from.setTime(from.getTime() + from.getTimezoneOffset() * 60 * 1000);
            dateFilter.items['from'].setValue(from, dateFilter);
        } else {
            dateFilter.items['from'].setValue('', dateFilter);
        }

        if (period.end) {
            let end = new Date(period.end + '-12-31');
            end.setTime(end.getTime() + end.getTimezoneOffset() * 60 * 1000);
            dateFilter.items['to'].setValue(end, dateFilter);
        } else {
            dateFilter.items['to'].setValue('', dateFilter);
        }
        this._filtersService.change(dateFilter);
    }

    setBankAccountsFilter(data) {
        let accountFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'account'; });
        if (!accountFilter) {
            setTimeout(() => { this.setBankAccountsFilter(data); }, 300);
        } else {
            accountFilter = this._bankAccountsService.changeAndGetBankAccountFilter(accountFilter, data, this.bankAccountSelector.initDataSource);
            this.visibleAccountCount = data.visibleAccountCount;
            this.setBankAccountCount(data.bankAccountIds, data.visibleAccountCount);
            this._filtersService.change(accountFilter);
        }
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    ngOnDestroy() {
        this.deactivate();
        super.ngOnDestroy();
    }

    activate() {
        this._filtersService.localizationSourceName = this.localizationSourceName;
        this.initToolbarConfig();
        this._filtersService.setup(this.filters);
        this.initFiltering();
        this.bankAccountSelector.handleSelectedBankAccounts();
        this.synchProgressComponent.requestSyncAjax();
        this.getRootComponent().overflowHidden(true);
    }

    deactivate() {
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._appService.toolbarConfig = null;
        this._filtersService.unsubscribe();
        this.getRootComponent().overflowHidden();
    }
}
