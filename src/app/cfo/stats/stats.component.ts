import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import { AppConsts } from '@shared/AppConsts';

import { AppService } from '@app/app.service';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { CacheService } from 'ng2-cache-service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { DxChartComponent } from 'devextreme-angular';
import { getMarkup, exportFromMarkup } from 'devextreme/viz/export';
import { StatsService } from '@app/cfo/shared/helpers/stats.service';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';

import {
    StatsFilter,
    CashflowServiceProxy,
    BankAccountsServiceProxy,
    BankAccountDailyStatDto,
    GroupBy,
    CashFlowForecastServiceProxy,
    InstanceType
} from '@shared/service-proxies/service-proxies';

@Component({
    'selector': 'app-stats',
    'providers': [ CashflowServiceProxy, BankAccountsServiceProxy, CashFlowForecastServiceProxy, CacheService, StatsService],
    'templateUrl': './stats.component.html',
    'styleUrls': ['./stats.component.less']
})
export class StatsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('linearChart') private linearChart: DxChartComponent;
    @ViewChild('barChart') private barChart: DxChartComponent;
    statsData: Array<BankAccountDailyStatDto>;
    historicalSourceData: Array<BankAccountDailyStatDto> = [];
    forecastSourceData: Array<BankAccountDailyStatDto> = [];
    selectedForecastModel;
    headlineConfig: any;
    axisDateFormat = 'month';
    currency = 'USD';
    labelPositiveBackgroundColor = '#626b73';
    labelNegativeBackgroundColor = '#f05b2a';
    historicalEndingBalanceColor = '#00aeef';
    forecastEndingBalanceColor = '#f9ba4e';
    historicalInflowsColor = '#00aeef';
    historicalOutflowsColor = '#f05b2a';
    forecastInflowsColor = '#a9e3f9';
    forecastOutflowsColor = '#fec6b3';
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
            'name': 'inflows',
            'label': this.ls('Platform', 'Stats_Inflows')
        },
        {
            'name': 'outflows',
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
            'name': 'forecastInflows',
            'label': this.l('Stats_Forecast_Inflows')
        },
        {
            'name': 'forecastOutflows',
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
    leftSideBarItems = [
        { caption: 'leftSideBarMonthlyTrendCharts' },
        { caption: 'leftSideBarDailyTrendCharts' },
        { caption: 'leftKeyMetricsKPI' }
    ];
    private rootComponent: any;
    private filters: FilterModel[] = new Array<FilterModel>();
    private requestFilter: StatsFilter;
    constructor(
        injector: Injector,
        private _appService: AppService,
        private _filtersService: FiltersService,
        private _cashflowService: CashflowServiceProxy,
        private _bankAccountService: BankAccountsServiceProxy,
        private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
        private _cacheService: CacheService,
        private _statsService: StatsService,
        private _ngxZendeskWebwidgetService: ngxZendeskWebwidgetService
    ) {
        super(injector);

        this._cacheService = this._cacheService.useStorage(0);
        this._filtersService.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    initToolbarConfig(forecastModelsObj: { items: Array<any>, selectedItemIndex: number } = { items: [], selectedItemIndex: null }) {
        this._appService.toolbarConfig = <any>[
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
            // {
            //     location: 'before',
            //     items: [
            //         { name: 'back' }
            //     ]
            // },
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
                            items: forecastModelsObj.items,
                            selectedIndex: forecastModelsObj.selectedItemIndex,
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
                location: 'after',
                items: [
                    { name: 'flag' },
                    {
                        name: 'pen',
                        options: {
                            hint: this.l('Label')
                        }
                    },
                    { name: 'more' }
                ]
            },
            {
                location: 'after',
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
                    { name: 'print', action: this.print.bind(this) }
                ]
            },
            {
                location: 'after',
                items: [
                    {name: 'fullscreen', action: this.toggleFullscreen.bind(this, document.documentElement)}
                ]
            }
        ];
    }

    ngOnInit() {
        super.ngOnInit();
        this.requestFilter = new StatsFilter();
        this.requestFilter.currencyId = 'USD';

        /** Create parallel operations */
        let getCashFlowInitialDataObservable = this._cashflowService.getCashFlowInitialData(InstanceType[this.instanceType], this.instanceId);
        let getForecastModelsObservable = this._cashFlowForecastServiceProxy.getModels(InstanceType[this.instanceType], this.instanceId);
        Observable.forkJoin(getCashFlowInitialDataObservable, getForecastModelsObservable)
            .subscribe(result => {
                /** Initial data handling */
                this.handleCashFlowInitialResult(result[0]);

                /** Forecast models handling */
                this.handleForecastModelResult(result[1]);

                /** load stats */
                this.loadStatsData();
            });

        this.initHeadlineConfig();
        this.initFiltering();
        this.calculateChartsSize();
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Daily Cash Balances')],
            iconSrc: 'assets/common/icons/pulse-icon.svg',
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
                let filterMethod = FilterHelpers['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod)
                    filterMethod(filter, this.requestFilter);
                else
                    this.requestFilter[filter.field] = undefined;
            }

            this.loadStatsData();
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

    handleCashFlowInitialResult(result) {
        this._filtersService.setup(
            this.filters = [
                new FilterModel({
                    component: FilterCalendarComponent,
                    caption: 'Date',
                    items: { from: new FilterItemModel(), to: new FilterItemModel() },
                    options: {method: 'getFilterByDate'}
                }),
                new FilterModel({
                    field: 'accountIds',
                    component: FilterCheckBoxesComponent,
                    caption: 'Account',
                    items: {
                        element: new FilterCheckBoxesModel(
                            {
                                dataSource: FilterHelpers.ConvertBanksToTreeSource(result.banks),
                                nameField: 'name',
                                parentExpr: 'parentId',
                                keyExpr: 'id'
                            })
                    }
                })
            ]
        );
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
        let forecastModelsObj = {
            items: items,
            selectedItemIndex: selectedForecastModelIndex
        };
        this.initToolbarConfig(forecastModelsObj);
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
        let { startDate, endDate, accountIds = [], bankIds = [] } = this.requestFilter;
        this._bankAccountService.getStats(
            InstanceType[this.instanceType],
            this.instanceId,
            'USD',
            this.selectedForecastModel.id,
            bankIds,
            accountIds,
            startDate,
            endDate,
            undefined,
            GroupBy.Monthly
        ).subscribe(result => {
            if (result) {
                let minEndingBalanceValue = Math.min.apply(Math, result.map(item => item.endingBalance)),
                minRange = minEndingBalanceValue - (0.2 * Math.abs(minEndingBalanceValue));
                this.statsData = result.map(statsItem => {
                    statsItem.date.add(statsItem.date.toDate().getTimezoneOffset(), 'minutes');
                    Object.defineProperties(statsItem, {
                        'netChange': { value: statsItem.inflows + statsItem.outflows, enumerable: true },
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
            } else {
                console.log('No daily stats');
            }
            this.loadingFinished = true;
            abp.ui.clearBusy();
        },
        error => console.log('Error: ' + error));
    }

    getUpdatedDataSource() {
        this.loadStatsData();
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        CFOComponentBase.zendeskWebwidgetShow(this._ngxZendeskWebwidgetService);
    }

    ngOnDestroy() {
        this._appService.toolbarConfig = null;
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        CFOComponentBase.zendeskWebwidgetHide(this._ngxZendeskWebwidgetService);
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
        return `${elem.valueText.substring(0, 3).toUpperCase()}<br/><div class="yearArgument">${elem.value.getFullYear().toString().substr(-2)}</div>`;
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
            if (chartSeries && points.length && event.element.find(`.${period}Label`).length === 0) {
                let x = points[0].vx || points[0].x || 0,
                    left = x / window.outerWidth * 100,
                    y = 25,
                    firstPoint = points[0],
                    lastPoint = points[points.length - 1],
                    seriesWidth = lastPoint.vx - firstPoint.vx;
                event.element.append(this.createDivTextBlock({
                    'text': period === 'historical' ? this.l('Periods_Historical') : this.l('Periods_Forecast'),
                    'class': `${period}Label`,
                    'styles': {
                        'left': left + '%',
                        'top': y + 'px',
                        'position': 'absolute',
                        'pointer-events': 'none'
                    }
                }));
                let elementTextWidth = $(`.${period}Label`).width(),
                    newLeft = elementTextWidth > seriesWidth ?
                        x - (elementTextWidth - seriesWidth) / 2 :
                        x + (seriesWidth / 2) - (elementTextWidth / 2);
                    newLeft = newLeft / window.outerWidth * 100;
                $(`.${period}Label`).css('left', newLeft > 0 ? newLeft + '%' : 0);
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

    customizeBarTooltip = (pointInfo) => {
        return {
            html: this._statsService.getTooltipInfoHtml(this.statsData, this.barChartTooltipFields, pointInfo)
        };
    }

}
