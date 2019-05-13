/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import { DxChartComponent } from 'devextreme-angular/ui/chart';
import { getMarkup, exportFromMarkup } from 'devextreme/viz/export';
import { CacheService } from 'ng2-cache-service';
import { forkJoin } from 'rxjs';
import { finalize, first, filter, switchMap } from 'rxjs/operators';
import * as moment from 'moment';
import * as _ from 'underscore';
import { Store, select } from '@ngrx/store';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AppService } from '@app/app.service';
import { StatsService } from '@app/cfo/shared/helpers/stats.service';
import { ReportPeriodComponent } from '@app/cfo/shared/report-period/report-period.component';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { AppConsts } from '@shared/AppConsts';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import {
    StatsFilter,
    BankAccountsServiceProxy,
    BankAccountDailyStatDto,
    GroupBy,
    CashFlowForecastServiceProxy,
    InstanceType
} from '@shared/service-proxies/service-proxies';
import { BankAccountsSelectComponent } from '@app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import { BankAccountFilterComponent } from '@shared/filters/bank-account-filter/bank-account-filter.component';
import { BankAccountFilterModel } from '@shared/filters/bank-account-filter/bank-account-filter.model';
import { CfoStore, CurrenciesStoreSelectors, CurrenciesStoreActions } from '@app/cfo/store';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { DateHelper } from '@shared/helpers/DateHelper';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';

@Component({
    'selector': 'app-stats',
    'providers': [ BankAccountsServiceProxy, CashFlowForecastServiceProxy, StatsService ],
    'templateUrl': './stats.component.html',
    'styleUrls': ['./stats.component.less']
})
export class StatsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(BankAccountsSelectComponent) bankAccountSelector: BankAccountsSelectComponent;
    @ViewChild(ReportPeriodComponent) reportPeriodSelector: ReportPeriodComponent;
    @ViewChild('linearChart') private linearChart: DxChartComponent;
    @ViewChild('barChart') private barChart: DxChartComponent;
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;
    statsData: Array<BankAccountDailyStatDto>;
    historicalSourceData: Array<BankAccountDailyStatDto> = [];
    forecastSourceData: Array<BankAccountDailyStatDto> = [];
    selectedForecastModel;
    headlineConfig: any;
    axisDateFormat = 'month';
    labelPositiveBackgroundColor = '#626b73';
    labelNegativeBackgroundColor = '#f05b2a';
    historicalEndingBalanceColor = '#00aeef';
    forecastEndingBalanceColor = '#f9ba4e';
    historicalCreditColor = '#00aeef';
    historicalDebitColor = '#f05b2a';
    forecastCreditColor = '#a9e3f9';
    forecastDebitColor = '#fec6b3';
    historicalShadowStartedColor = 'rgba(0, 174, 239, .5)';
    forecastShadowStartedColor = 'rgba(249, 186, 78, .5)';
    historicalNetChangeColor = '#fab800';
    forecastNetChangeColor = '#a82aba';
    maxLabelCount = 0;
    labelWidth = 45;
    showSourceData = false;
    exporting = false;
    loadingFinished = false;
    chartsHeight = 400;
    chartsWidth;
    isForecast = false;
    bankAccountsCount: string;
    barChartTooltipFields = [
        {
            'name': 'startingBalance',
            'label': this.l('Stats_startingBalance')
        },
        {
            'name': 'startingBalanceAdjustments',
            'label': this.l('Stats_Starting_Balance_Adjustments')
        },
        {
            'name': 'adjustments',
            'label': this.l('Adjustments')
        },
        {
            'name': 'credit',
            'label': this.ls('Platform', 'Stats_Inflows')
        },
        {
            'name': 'debit',
            'label': this.ls('Platform', 'Stats_Outflows')
        },
        {
            'name': 'netChange',
            'label': this.ls('Platform', 'Net_Change')
        },
        {
            'name': 'endingBalance',
            'label': this.l('Stats_endingBalance')
        },
        {
            'name': 'forecastStartingBalance',
            'label': this.l('Stats_startingBalance')
        },
        {
            'name': 'forecastStartingBalanceAdjustments',
            'label': this.l('Stats_Starting_Balance_Adjustments')
        },
        {
            'name': 'forecastAdjustments',
            'label': this.l('Forecast_Adjustments')
        },
        {
            'name': 'forecastCredit',
            'label': this.l('Stats_Forecast_Inflows')
        },
        {
            'name': 'forecastDebit',
            'label': this.l('Stats_Forecast_Outflows')
        },
        {
            'name': 'forecastNetChange',
            'label': this.l('Stats_Forecast_Net_Change')
        },
        {
            'name': 'forecastEndingBalance',
            'label': this.l('Stats_endingBalance')
        }
    ];
    sliderReportPeriod = {
        start: null,
        end: null,
        minDate: moment().utc().subtract(10, 'year').year(),
        maxDate: moment().utc().add(10, 'year').year()
    };
    leftSideBarItems = [
        { caption: 'leftSideBarMonthlyTrendCharts' },
        { caption: 'leftSideBarDailyTrendCharts' },
        { caption: 'leftKeyMetricsKPI' }
    ];
    private rootComponent: any;
    private filters: FilterModel[] = new Array<FilterModel>();
    private requestFilter: StatsFilter;
    private forecastModelsObj: { items: Array<any>, selectedItemIndex: number } = { items: [], selectedItemIndex: null };
    private syncAccounts: any;
    private updateAfterActivation: boolean;

    constructor(
        injector: Injector,
        private _appService: AppService,
        private _filtersService: FiltersService,
        private _bankAccountService: BankAccountsServiceProxy,
        private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
        private _cacheService: CacheService,
        private _statsService: StatsService,
        private store$: Store<CfoStore.State>,
        public bankAccountsService: BankAccountsService,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);
        this._appService.narrowingPageContentWhenFixedFilter = false;
        this._filtersService.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit() {
        super.ngOnInit();
        this.initLocalization();
        this.requestFilter = new StatsFilter();
        this.requestFilter.currencyId = this.cfoPreferencesService.selectedCurrencyId;
        this.requestFilter.startDate = moment().utc().subtract(2, 'year');
        this.requestFilter.endDate = moment().utc().add(1, 'year');

        /** If component is not activated and selected currency has changed - wait activation and reload data */
        this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencyId),
            filter(() => !this.componentIsActivated)
        ).subscribe(() => {
            this.updateAfterActivation = true;
        });

        const bankAccountAndBusinessEntities$ = this.bankAccountsService.load();
        this.bankAccountsService.accountsAmount$.subscribe(amount => {
            this.bankAccountsCount = amount;
            this.initToolbarConfig();
        });

        /** Create parallel operations */
        const forecastsModels$ = this._cashFlowForecastServiceProxy.getModels(InstanceType[this.instanceType], this.instanceId);
        forkJoin(bankAccountAndBusinessEntities$, forecastsModels$)
            .subscribe(([[syncAccounts, businessEntities], forecastsModels]) => {
                this.syncAccounts = syncAccounts;

                /** Initial data handling */
                this.handleCashFlowInitialResult();

                /** Forecast models handling */
                this.handleForecastModelResult(forecastsModels);

                this.initFiltering();

                /** After selected accounts change */
                this.bankAccountsService.selectedBankAccountsIds$.pipe(first()).subscribe(() => {
                    this.setBankAccountsFilter(true);
                });
                this.bankAccountsService.selectedBankAccountsIds$.subscribe(() => {
                    /** filter all widgets by new data if change is on this component */
                    if (this.componentIsActivated) {
                        this.setBankAccountsFilter();
                        /** if change is on another component - mark this for future update */
                    } else {
                        this.updateAfterActivation = true;
                    }
                });

            });

        this.initHeadlineConfig();
        this.calculateChartsSize();
    }

    initToolbarConfig() {
        if (this.componentIsActivated) {
            this.cfoPreferencesService.getCurrenciesAndSelectedIndex()
                .subscribe(([currencies, selectedCurrencyIndex]) => {
                    /** Get currencies list and selected currency index */
                    this._appService.updateToolbar([
                        {
                            location: 'before',
                            items: [
                                {
                                    name: 'filters',
                                    action: (event) => {
                                        setTimeout(() => {
                                            this.linearChart.instance.render();
                                            this.barChart.instance.render();
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
                                    accessKey: 'statsForecastSwitcher',
                                    options: {
                                        hint: this.l('Scenario'),
                                        accessKey: 'statsForecastSwitcher',
                                        items: this.forecastModelsObj.items,
                                        selectedIndex: this.forecastModelsObj.selectedItemIndex,
                                        height: 39,
                                        width: 243,
                                        onSelectionChanged: (e) => {
                                            if (e) {
                                                this.changeSelectedForecastModel(e);
                                                this.loadStatsData();
                                            }
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            location: 'before',
                            locateInMenu: 'auto',
                            items: [
                                {
                                    name: 'reportPeriod',
                                    action: this.toggleReportPeriodFilter.bind(this),
                                    options: {
                                        id: 'reportPeriod',
                                        icon: './assets/common/icons/report-period.svg'
                                    }
                                },
                                {
                                    name: 'bankAccountSelect',
                                    widget: 'dxButton',
                                    action: this.toggleBankAccountTooltip.bind(this),
                                    options: {
                                        id: 'bankAccountSelect',
                                        text: this.l('Accounts'),
                                        icon: './assets/common/icons/accounts.svg'
                                    },
                                    attr: {
                                        'custaccesskey': 'bankAccountSelect',
                                        'accountCount': this.bankAccountsCount
                                    }
                                }
                            ]
                        },
                        {
                            location: 'before',
                            locateInMenu: 'auto',
                            items: [
                                {
                                    name: 'select-box',
                                    text: '',
                                    widget: 'dxDropDownMenu',
                                    accessKey: 'currencySwitcher',
                                    options: {
                                        hint: this.l('Currency'),
                                        accessKey: 'currencySwitcher',
                                        items: currencies,
                                        selectedIndex: selectedCurrencyIndex,
                                        height: 39,
                                        width: 80,
                                        onSelectionChanged: (e) => {
                                            if (e) {
                                                this.store$.dispatch(new CurrenciesStoreActions.ChangeCurrencyAction(e.itemData.text));
                                                this.loadStatsData();
                                            }
                                        }
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
                                        hint: this.l('Download'),
                                        items: [
                                            {
                                                action: this.download.bind(this, 'pdf'),
                                                text: this.ls(AppConsts.localization.defaultLocalizationSourceName, 'SaveAs', 'PDF'),
                                                icon: 'pdf',
                                            },
                                            {
                                                action: this.download.bind(this, 'png'),
                                                text: this.ls(AppConsts.localization.defaultLocalizationSourceName, 'SaveAs', 'PNG'),
                                                icon: 'png',
                                            },
                                            {
                                                action: this.download.bind(this, 'jpeg'),
                                                text: this.ls(AppConsts.localization.defaultLocalizationSourceName, 'SaveAs', 'JPEG'),
                                                icon: 'jpeg',
                                            },
                                            {
                                                action: this.download.bind(this, 'svg'),
                                                text: this.ls(AppConsts.localization.defaultLocalizationSourceName, 'SaveAs', 'SVG'),
                                                icon: 'svg',
                                            },
                                            {
                                                action: this.download.bind(this, 'gif'),
                                                text: this.ls(AppConsts.localization.defaultLocalizationSourceName, 'SaveAs', 'GIF'),
                                                icon: 'gif',
                                            }
                                        ]
                                    }
                                },
                                {name: 'print', action: this.print.bind(this)}
                            ]
                        },
                        {
                            location: 'after',
                            locateInMenu: 'auto',
                            items: [
                                {name: 'fullscreen', action: this.toggleFullscreen.bind(this, document.documentElement)}
                            ]
                        }
                    ]);
                });
        }
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Daily Cash Balances')],
            iconSrc: './assets/common/icons/pulse-icon.svg',
            onRefresh: this.getUpdatedDataSource.bind(this),
            buttons: [
                {
                    enabled: this.statsData && this.statsData.length ? true : false,
                    action: this.showSourceDataWidget.bind(this),
                    lable: this.l('Show source data')
                }
            ]
        };
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
                    /** apply filter on top */
                    this.bankAccountsService.applyFilter();
                    /** apply filter in sidebar */
                    filter.items.element.setValue(this.bankAccountsService.state.selectedBankAccountIds, filter);
                }

                let filterMethod = FilterHelpers['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod)
                    filterMethod(filter, this.requestFilter);
                else
                    this.requestFilter[filter.field] = undefined;
            }
            this.loadStatsData();
            this.initToolbarConfig();
        });
    }

    /** Recalculates the height of the charts to squeeze them both into the window to avoid scrolling */
    calculateChartsSize() {
        let chartsHeight = window.innerHeight - 390;
        this.chartsHeight =  chartsHeight > this.chartsHeight ? chartsHeight : this.chartsHeight;
        this.chartsWidth = window.innerWidth - 371;
    }

    /** Calculates the height of the charts scrollable height after resizing */
    calculateChartsScrolableHeight() {
        return window.innerHeight - 260;
    }

    handleCashFlowInitialResult() {
        this.setupFilters();
    }

    setupFilters() {
        if (this.filters.length) {
            this._filtersService.setup(this.filters);
        } else {
            this._filtersService.setup(
                this.filters = [
                    new FilterModel({
                        component: FilterCalendarComponent,
                        caption: 'Date',
                        items: {from: new FilterItemModel(), to: new FilterItemModel()},
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
                                    dataSource: this.syncAccounts,
                                    nameField: 'name',
                                    keyExpr: 'syncId',
                                    onRemoved: (ids) => this.bankAccountsService.changeSelectedBankAccountsIds(ids)
                                })
                        }
                    })
                ]
            );
        }
    }

    handleForecastModelResult(result) {
        let items = result.map(forecastModelItem => {
            return {
                id: forecastModelItem.id,
                text: forecastModelItem.name
            };
        });
        /** If we have the forecast model in cache - get it there, else - get the first model */
        let cachedForecastModel = this.getForecastModel();
        /** If we have cached forecast model and cached forecast exists in items list - then use it **/
        this.selectedForecastModel = cachedForecastModel && items.findIndex(item => item.id === cachedForecastModel.id) !== -1 ?
            cachedForecastModel :
            items[0];
        let selectedForecastModelIndex = items.findIndex(item => item.id === this.selectedForecastModel.id);
        this.forecastModelsObj = {
            items: items,
            selectedItemIndex: selectedForecastModelIndex
        };
        this.initToolbarConfig();
    }

    /**
     * Get forecast model from the cache
     */
    getForecastModel() {
        return this._cacheService.exists(`stats_forecastModel_${abp.session.userId}`) ?
               this._cacheService.get(`stats_forecastModel_${abp.session.userId}`) :
               null;
    }

    /**
     * Change the forecast model to reuse later
     * @param modelObj - new forecast model
     */
    changeSelectedForecastModel(modelObj) {
        this.selectedForecastModel = modelObj.itemData;
        this._cacheService.set(`stats_forecastModel_${abp.session.userId}`, this.selectedForecastModel);
    }

    /** load stats data from api */
    loadStatsData() {
        abp.ui.setBusy();
        let { startDate, endDate, accountIds = []} = this.requestFilter;
        this.cfoPreferencesService.getCurrencyId().pipe(
            switchMap((currencyId: string) => this._bankAccountService.getStats(
                InstanceType[this.instanceType],
                this.instanceId,
                currencyId,
                this.selectedForecastModel.id,
                accountIds,
                startDate,
                endDate,
                GroupBy.Monthly
            )),
            finalize(() => abp.ui.clearBusy())
         ).subscribe(result => {
            if (result && result.length) {
                let minEndingBalanceValue = Math.min.apply(Math, result.map(item => item.endingBalance)),
                minRange = minEndingBalanceValue - (0.2 * Math.abs(minEndingBalanceValue));
                this.statsData = result.map(statsItem => {
                    statsItem.date.add(statsItem.date.toDate().getTimezoneOffset(), 'minutes');
                    Object.defineProperties(statsItem, {
                        'netChange': { value: statsItem.credit + statsItem.debit, enumerable: true },
                        'minRange': { value: minRange, enumerable: true }
                    });
                    if (statsItem.isForecast) {
                        this.isForecast = true;
                        for (let prop in statsItem) {
                            if (statsItem.hasOwnProperty(prop) && prop !== 'date' && prop !== 'isForecast') {
                                statsItem['forecast' + this.capitalize(prop)] = statsItem[prop];
                                delete statsItem[prop];
                            }
                        }
                    }
                    return statsItem;
                });
                /** reinit */
                this.initHeadlineConfig();
                this.maxLabelCount = this.calcMaxLabelCount(this.labelWidth);

                this.setSliderReportPeriodFilterData(this.statsData[0].date.year(), this.statsData[this.statsData.length - 1].date.year());
            } else {
                this.statsData = null;
            }

            this.loadingFinished = true;
        },
        error => console.log('Error: ' + error));
    }

    getUpdatedDataSource() {
        this.loadStatsData();
        this.bankAccountsService.load().pipe(
            finalize(() => abp.ui.clearBusy() )
        )
        .subscribe();
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this._appService.updateToolbar(null);
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();

        super.ngOnDestroy();
    }

    /** Calculates the max amount of the labels for displaying to not clutter the screen */
    calcMaxLabelCount(labelWidth) {
        let screenWidth = window.innerWidth;
        return Math.floor(screenWidth / labelWidth);
    }

    showSourceDataWidget() {
        this.forecastSourceData = [];
        this.historicalSourceData = [];
        this.statsData.forEach(statsDataItem => {
            statsDataItem.isForecast ? this.forecastSourceData.push(statsDataItem) : this.historicalSourceData.push(statsDataItem);
        });
        this.showSourceData = true;
    }

    hideSourceDataWidget() {
        this.showSourceData = false;
    }

    customizeBottomAxis(elem) {
        return `${elem.value.toUTCString().split(' ')[2].toUpperCase()}<br/><div class="yearArgument">${elem.value.getUTCFullYear().toString().substr(-2)}</div>`;
    }

    toggleReportPeriodFilter() {
        this.reportPeriodSelector.toggleReportPeriodFilter();
    }

    setReportPeriodFilter(period) {
        let dateFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'date'; });

        if (period.start) {
            let from = new Date(period.start + '-01-01');
            DateHelper.addTimezoneOffset(from);
            dateFilter.items['from'].setValue(from, dateFilter);
        } else {
            dateFilter.items['from'].setValue('', dateFilter);
        }

        if (period.end) {
            let end = new Date(period.end + '-12-31');
            DateHelper.addTimezoneOffset(end);
            dateFilter.items['to'].setValue(end, dateFilter);
        } else {
            dateFilter.items['to'].setValue('', dateFilter);
        }
        this._filtersService.change(dateFilter);
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

    setBankAccountsFilter(emitFilterChange = false) {
        this.bankAccountsService.setBankAccountsFilter(this.filters, this.syncAccounts, emitFilterChange);
    }

    toggleBankAccountTooltip() {
        this.bankAccountSelector.toggleBankAccountTooltip();
    }

    /** Different styles for labels for positive and negative values */
    customizeLabel = (arg: any) => {
        if (arg.series.type !== 'rangearea' && arg.value < 0) {
            return {
                backgroundColor: this.labelNegativeBackgroundColor,
                visible: this.maxLabelCount >= this.statsData.length,
                customizeText: (e: any) => {
                    return this._statsService.replaceMinusWithBrackets(e.valueText);
                }
            };
        }
    }

    /** Replace minus for the brackets */
    customizeAxisValues = (arg: any) => {
        return arg.value < 0 ? this._statsService.replaceMinusWithBrackets(arg.valueText) : arg.valueText;
    }

    customizePoint = (arg: any) => {
        if (arg.series.type !== 'rangearea' && arg.value < 0) {
            return {
                color: this.labelNegativeBackgroundColor,
                size: 0.01,
                border: {
                    width: 8,
                    color: 'rgba(240, 91, 42, .2)',
                    visible: true
                }
            };
        }
    }

    onDone(event) {
        /** Added the Historical and forecast text block to the charts */
        this.addTextBlocks(event);
    }

    /**
     * Creates div text block
     * @param {{[p: string]: any}} options
     */
    createDivTextBlock(options: { [key: string ]: any } = { 'text': '', 'class': '', 'styles': {} }) {
        let stylesStr = Object.keys(options.styles).reduce((styleString, key) => (
            styleString + key + ':' + options.styles[key] + ';'
        ), '');
        return `<div class="${options.class}" style="${stylesStr}">${options.text}</div>`;
    }

    /**
     * Added the text blocks to the charts
     * @param event
     */
    addTextBlocks(event) {
        ['historical', 'forecast'].forEach(period => {
            /** Add the historical and forecast big texts above the charts */
            let chartSeries = event.component.getSeriesByName(period),
                points = event.component.getSeriesByName(period).getVisiblePoints();
            if (chartSeries && points.length && !event.element.querySelector(`.${period}Label`)) {
                let x = points[0].vx || points[0].x || 0,
                    left = x / window.outerWidth * 100,
                    y = 25,
                    firstPoint = points[0],
                    lastPoint = points[points.length - 1],
                    seriesWidth = lastPoint.vx - firstPoint.vx;
                event.element.insertAdjacentHTML('beforeEnd', this.createDivTextBlock({
                    'text': period === 'historical' ? this.l('Periods_Historical') : this.l('Periods_Forecast'),
                    'class': `${period}Label`,
                    'styles': {
                        'left': left + '%',
                        'top': y + 'px',
                        'position': 'absolute',
                        'pointer-events': 'none'
                    }
                }));
                let textBlockElement = <HTMLElement>document.querySelector(`.${period}Label`),
                    elementTextWidth = textBlockElement.clientWidth,
                    newLeft = elementTextWidth > seriesWidth ?
                        x - (elementTextWidth - seriesWidth) / 2 :
                        x + (seriesWidth / 2) - (elementTextWidth / 2);
                    newLeft = newLeft / window.outerWidth * 100;
                textBlockElement.style.left = newLeft > 0 ? newLeft + '%' : '0';
            }
        });
    }

    /** Open the print window to print the charts */
    print() {
        let vizWindow = window.open(),
            chartsMarkup = this.getChartsMarkup();
        vizWindow.document.open();
        vizWindow.document.write(chartsMarkup);
        vizWindow.document.close();
        vizWindow.print();
        vizWindow.close();
    }

    /**
     * Download the charts into file
     * @param {'png' | 'pdf' | 'jpeg' | 'svg' | 'gif'} format
     */
    download(format: 'png' | 'pdf' | 'jpeg' | 'svg' | 'gif') {
        /** hack to avoid 3 exports */
        if (this.exporting) return; this.exporting = true;
        let lineChartSize = this.linearChart.instance.getSize(),
            barChartSize = this.barChart.instance.getSize(),
            markup = this.getChartsMarkup();
        exportFromMarkup(markup, {
            fileName: 'stats',
            format: format.toUpperCase(),
            height: lineChartSize.height + barChartSize.height,
            width: lineChartSize.width,
            backgroundColor: '#fff'
        });
        /** hack to avoid 3 exporting */
        setTimeout(() => { this.exporting = false; }, 200);
    }

    /**
     * Get the markup using devextreme getMarkup method and replacing linear gradient url with the simple color
     * @return {string}
     */
    getChartsMarkup() {
        return getMarkup([this.linearChart.instance, this.barChart.instance])
                    .replace(new RegExp('url\\(#historical-linear-gradient\\)', 'g'), this.historicalShadowStartedColor)
                    .replace(new RegExp('url\\(#forecast-linear-gradient\\)', 'g'), this.forecastShadowStartedColor);
    }

    customizeBarTooltip = pointInfo => {
        return {
            html: (pointInfo.seriesName !== 'historicalGradient' && pointInfo.seriesName !== 'forecastGradient') ?
                  this._statsService.getTooltipInfoHtml(this.statsData, this.barChartTooltipFields, pointInfo) : ''
        };
    }

    private initLocalization() {
        this.localizationService.localizationSourceName = this.localizationSourceName;
        this._filtersService.localizationSourceName = this.localizationSourceName;
    }

    activate() {
        this.initLocalization();
        this.initToolbarConfig();
        this.setupFilters();
        this.initFiltering();

        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        this.bankAccountsService.load();

        /** If selected accounts changed in another component - update widgets */
        if (this.updateAfterActivation) {
            this.setBankAccountsFilter(true);
            this.updateAfterActivation = false;
        }

        this.synchProgressComponent.activate();
        this.rootComponent.overflowHidden(true);
    }

    deactivate() {
        this.localizationService.localizationSourceName = undefined;
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._appService.updateToolbar(null);
        this._filtersService.unsubscribe();
        this.synchProgressComponent.deactivate();
        this.rootComponent.overflowHidden();
    }

}
