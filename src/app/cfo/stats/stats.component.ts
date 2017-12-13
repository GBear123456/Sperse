import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { CacheService } from 'ng2-cache-service';

import { SourceDataComponent } from './source-data/source-data.component';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

import {
    StatsFilter,
    CashflowServiceProxy,
    BankAccountsServiceProxy,
    BankAccountDailyStatDto,
    GroupBy,
    CashFlowForecastServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
    'selector': 'app-stats',
    'providers': [ CashflowServiceProxy, BankAccountsServiceProxy, CashFlowForecastServiceProxy, CacheService],
    'templateUrl': './stats.component.html',
    'styleUrls': ['./stats.component.less']
})
export class StatsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('SourceDataComponent') sourceDataComponent: SourceDataComponent;
    statsData: Array<BankAccountDailyStatDto>;
    historicalSourceData: Array<BankAccountDailyStatDto> = [];
    forecastSourceData: Array<BankAccountDailyStatDto> = [];
    selectedForecastModel;
    toolbarConfig = [];
    headlineConfig: any;
    axisDateFormat = 'month';
    currency = 'USD';
    labelPositiveBackgroundColor = '#626b73';
    labelNegativeBackgroundColor = '#f05b2a';
    historicalEndingBalanceColor = '#00aeef';
    forecastEndingBalanceColor = '#f9ba4e';
    historicalIncomeColor = '#00aeef';
    historicalExpensesColor = '#f05b2a';
    forecastIncomeColor = '#a9e3f9';
    forecastExpensesColor = '#fec6b3';
    maxLabelCount = 0;
    labelWidth = 45;
    showSourceData = false;
    private rootComponent: any;
    private filters: FilterModel[] = new Array<FilterModel>();
    private requestFilter: StatsFilter;
    constructor(
        injector: Injector,
        private _filtersService: FiltersService,
        private _cashflowService: CashflowServiceProxy,
        private _bankAccountService: BankAccountsServiceProxy,
        private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
        private _cacheService: CacheService
    ) {
        super(injector);
        this._cacheService = this._cacheService.useStorage(0);
        this._filtersService.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    initToolbarConfig(forecastModelsObj: { items: Array<any>, selectedForecastModel: number } = { items: [], selectedForecastModel: null }) {
        this.toolbarConfig = <any>[
            {
                location: 'before',
                items: [
                    {
                        name: 'filters',
                        action: this._filtersService.toggle.bind(this._filtersService)
                    }
                ]
            },
            {
                location: 'before',
                items: [
                    { name: 'back' }
                ]
            },
            {
                location: 'before',
                items: [
                    {
                        name: 'slider',
                        widget: 'dxGallery',
                        options: {
                            hint: this.l('Scenario'),
                            accessKey: 'statsForecastSwitcher',
                            items: forecastModelsObj.items,
                            selectedIndex: forecastModelsObj.selectedForecastModel,
                            showNavButtons: true,
                            showIndicator: false,
                            scrollByContent: true,
                            height: 39,
                            width: 200,
                            itemTemplate: itemData => {
                                return itemData.text;
                            },
                            onSelectionChanged: (e) => {
                                this.changeSelectedForecastModel(e);
                                this.loadStatsData();
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
                    { name: 'download' },
                    { name: 'print' }
                ]
            },
            {
                location: 'after',
                items: [
                    {name: 'pen'}
                ]
            }
        ];
    }

    ngOnInit() {
        this.requestFilter = new StatsFilter();
        this.requestFilter.currencyId = 'USD';

        /** Create parallel operations */
        let getCashFlowInitialDataObservable = this._cashflowService.getCashFlowInitialData();
        let getForecastModelsObservable = this._cashFlowForecastServiceProxy.getModels();
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
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            name: this.l('Daily Cash Balances'),
            icon: '',
            buttons: [
                {
                    enabled: true,
                    action: Function(),
                    lable: this.l('Add New')
                }
            ]
        };
    }

    initFiltering() {
        for (let filter of this.filters) {
            let filterMethod = FilterHelpers['filterBy' + this.capitalize(filter.caption)];
            if (filterMethod)
                filterMethod(filter, this.requestFilter);
            else
                this.requestFilter[filter.field] = undefined;
        }
        this._filtersService.apply(() => {
            this.loadStatsData();
        });
    }

    handleCashFlowInitialResult(result) {
        this._filtersService.setup(
            this.filters = [
                new FilterModel({
                    component: FilterCalendarComponent,
                    caption: 'Date',
                    items: { from: new FilterItemModel(), to: new FilterItemModel() }
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
        let selectedForecastModelIndex = items.findIndex(
            item => item.id === this.selectedForecastModel.id
        );
        let forecastModelsObj = {
            items: items,
            selectedForecastModel: selectedForecastModelIndex
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
        this.selectedForecastModel = modelObj.addedItems[0];
        this._cacheService.set(`stats_forecastModel_${abp.session.userId}`, this.selectedForecastModel);
    }

    /** load stats data from api */
    loadStatsData() {
        let {startDate = undefined, endDate = undefined, accountIds = []} = this.requestFilter;
        this._bankAccountService.getStats(
            'USD', this.selectedForecastModel.id, accountIds, startDate, endDate, GroupBy.Monthly
        ).subscribe(result => {
                    if (result) {
                        let minEndingBalanceValue = Math.min.apply(Math, result.map(item => item.endingBalance)),
                        minRange = minEndingBalanceValue - (0.2 * Math.abs(minEndingBalanceValue));
                        this.statsData = result.map(statsItem => {
                            /** get the date and convert it to the day, month, quarter or year */
                            let newStatsItem: any = {
                                forecastIncome: null,
                                forecastExpenses: null,
                                forecastEndingBalance: null,
                                minEndingBalance: minRange
                            };
                            if (statsItem.isForecast) {
                                newStatsItem.forecastIncome = statsItem.income;
                                newStatsItem.forecastExpenses = statsItem.expenses;
                                newStatsItem.forecastEndingBalance = statsItem.endingBalance;
                                statsItem.income = null;
                                statsItem.expenses = null;
                                statsItem.endingBalance = null;
                            }
                            return Object.assign(statsItem, newStatsItem);
                        });
                        this.maxLabelCount = this.calcMaxLabelCount(this.labelWidth);
                    } else {
                        console.log('No daily stats');
                    }
                },
                error => console.log('Error: ' + error)
            );
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._filtersService.unsubscribe();
        this._filtersService.enabled = false;
        this.rootComponent.overflowHidden();
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
        return elem.valueText.substring(0, 3).toUpperCase();
    }

    /** Different styles for labels for positive and negative values */
    customizeLabel = (arg: any) => {
        if (arg.series.type !== 'rangearea' && arg.value < 0) {
            return {
                backgroundColor: this.labelNegativeBackgroundColor,
                customizeText: (e: any) => {
                    return this.replaceMinusWithBrackets(e.valueText);
                }
            };
        }
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

    /**
     * Replace string negative value like '$-1000' for the string '$(1000)' (with brackets)
     * @param {string} value
     * @return {string}
     */
    replaceMinusWithBrackets(value: string) {
        return value.replace(/\B(?=(\d{3})+\b)/g, ',').replace(/-(.*)/, '($1)');
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
                        'position': 'absolute'
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
}
