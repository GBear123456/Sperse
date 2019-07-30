/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { DxChartComponent } from 'devextreme-angular/ui/chart';
import { getMarkup, exportFromMarkup } from 'devextreme/viz/export';
import { CacheService } from 'ng2-cache-service';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { catchError, finalize, first, filter, switchMap, tap, takeUntil, mapTo, withLatestFrom } from 'rxjs/operators';
import * as moment from 'moment';
import { Store, select } from '@ngrx/store';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AppService } from '@app/app.service';
import { StatsService } from '@app/cfo/shared/helpers/stats.service';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { AppConsts } from '@shared/AppConsts';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import {
    StatsFilter,
    BankAccountsServiceProxy,
    BankAccountDailyStatDto,
    GroupByPeriod,
    CashFlowForecastServiceProxy,
    InstanceType,
    ForecastModelDto
} from '@shared/service-proxies/service-proxies';
import { BankAccountsSelectDialogComponent } from '@app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog.component';
import { BankAccountFilterComponent } from '@shared/filters/bank-account-filter/bank-account-filter.component';
import { BankAccountFilterModel } from '@shared/filters/bank-account-filter/bank-account-filter.model';
import { CfoStore, CurrenciesStoreSelectors, ForecastModelsStoreActions, ForecastModelsStoreSelectors } from '@app/cfo/store';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';

@Component({
    'selector': 'app-stats',
    'providers': [ BankAccountsServiceProxy, CashFlowForecastServiceProxy, StatsService, CurrencyPipe, LifecycleSubjectsService ],
    'templateUrl': './stats.component.html',
    'styleUrls': ['./stats.component.less']
})
export class StatsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('linearChart') private linearChart: DxChartComponent;
    @ViewChild('barChart') private barChart: DxChartComponent;
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;
    statsData: Array<BankAccountDailyStatDto>;
    historicalSourceData: Array<BankAccountDailyStatDto> = [];
    forecastSourceData: Array<BankAccountDailyStatDto> = [];
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
    leftSideBarItems = [
        { caption: 'leftSideBarMonthlyTrendCharts' },
        { caption: 'leftSideBarDailyTrendCharts' },
        { caption: 'leftKeyMetricsKPI' }
    ];
    private rootComponent: any;
    private filters: FilterModel[] = new Array<FilterModel>();
    defaultRequestFilter = new StatsFilter({
        currencyId: this.cfoPreferencesService.selectedCurrencyId,
        startDate: moment().utc().subtract(2, 'year'),
        endDate: moment().utc().add(1, 'year')
    } as any);
    private requestFilter: Subject<StatsFilter> = new Subject<StatsFilter>();
    requestFilter$: Observable<StatsFilter> = this.requestFilter.asObservable();
    private syncAccounts: any;
    private updateAfterActivation: boolean;
    private forecastModels$ = this.store$.pipe(select(ForecastModelsStoreSelectors.getForecastModels), filter(Boolean));
    private selectedForecastModelIndex$ = this.store$.pipe(select(ForecastModelsStoreSelectors.getSelectedForecastModelIndex, filter(i => i !== null)));
    private selectedForecastModelId$ = this.store$.pipe(
        select(ForecastModelsStoreSelectors.getSelectedForecastModelId),
        filter(Boolean),
    );
    private currencyId$ = this.store$.pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId), filter(Boolean));
    private selectedBankAccountIds$ = this.bankAccountsService.selectedBankAccountsIds$;
    private refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this.refresh.asObservable();
    private dateFilter = new FilterModel({
        component: FilterCalendarComponent,
        caption: 'Date',
        items: {from: new FilterItemModel(), to: new FilterItemModel()},
        options: {
            allowFutureDates: true,
            endDate: moment(new Date()).add(10, 'years').toDate()
        }
    });

    constructor(
        injector: Injector,
        private _appService: AppService,
        private _filtersService: FiltersService,
        private _bankAccountService: BankAccountsServiceProxy,
        private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
        private _cacheService: CacheService,
        private _statsService: StatsService,
        private _dialog: MatDialog,
        private _lifecycleService: LifecycleSubjectsService,
        private store$: Store<CfoStore.State>,
        public bankAccountsService: BankAccountsService,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);
        this._appService.narrowingPageContentWhenFixedFilter = false;
    }

    ngOnInit() {
        this.store$.dispatch(new ForecastModelsStoreActions.LoadRequestAction());
        this.bankAccountsService.accountsAmountWithApply$.subscribe(amount => {
            this.bankAccountsCount = amount;
            this.initToolbarConfig();
        });

        this.cfoPreferencesService.dateRange$.pipe(
            takeUntil(this.destroy$),
            switchMap((dateRange) => this.componentIsActivated ? of(dateRange) : this._lifecycleService.activate$.pipe(first(), mapTo(dateRange)))
        ).subscribe((dateRange: CalendarValuesModel) => {
            this.dateFilter.items = {
                from: new FilterItemModel(dateRange.from.value),
                to: new FilterItemModel(dateRange.to.value)
            };
            this._filtersService.change(this.dateFilter);
        });

        combineLatest(
            this.currencyId$,
            this.selectedForecastModelId$,
            this.requestFilter$,
            this.refresh$
        ).pipe(
            takeUntil(this.destroy$),
            switchMap((data) => this.componentIsActivated ? of(data) : this._lifecycleService.activate$.pipe(first(), mapTo(data))),
            tap(() => abp.ui.setBusy()),
            switchMap(([currencyId, forecastModelId, requestFilter]: [string, number, StatsFilter]) => {
                return this._bankAccountService.getStats(
                    InstanceType[this.instanceType],
                    this.instanceId,
                    currencyId,
                    forecastModelId,
                    requestFilter.accountIds,
                    requestFilter.startDate,
                    requestFilter.endDate || requestFilter.startDate,
                    GroupByPeriod.Monthly
                ).pipe(
                    catchError(() => of([])),
                    finalize(() => abp.ui.clearBusy())
                );
            })
        ).subscribe((result: BankAccountDailyStatDto[]) => {
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
            } else {
                this.statsData = null;
            }

            this.loadingFinished = true;
        });

        this.bankAccountsService.load()
            .subscribe(([syncAccounts]) => {
                this.syncAccounts = syncAccounts;

                /** Initial data handling */
                this.handleCashFlowInitialResult();

                this.initToolbarConfig();

                this.initFiltering();

                /** After selected accounts change */
                this.selectedBankAccountIds$.pipe(
                    takeUntil(this.destroy$),
                    switchMap(() => this.componentIsActivated ? of(null) : this._lifecycleService.activate$.pipe(first()))
                ).subscribe(() => {
                    this.setBankAccountsFilter(true);
                });

            });

        this.initHeadlineConfig();
        this.calculateChartsSize();
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    initToolbarConfig() {
        if (this.componentIsActivated) {
            this.selectedForecastModelIndex$.pipe(
                withLatestFrom(this.forecastModels$),
                first()
            ).subscribe(([selectedForecastModelIndex, forecastModels]: [number, ForecastModelDto[]]) => {
                /** Get currencies list and selected currency index */
                this._appService.updateToolbar([
                    {
                        location: 'before',
                        items: [
                            {
                                name: 'filters',
                                visible: !this._cfoService.hasStaticInstance,
                                action: () => {
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
                                    mouseover: () => {
                                        this._filtersService.enable();
                                    },
                                    mouseout: () => {
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
                                    items: forecastModels,
                                    selectedIndex: selectedForecastModelIndex,
                                    height: 39,
                                    width: 243,
                                    onSelectionChanged: (e) => {
                                        if (e) {
                                            this.store$.dispatch(new ForecastModelsStoreActions.ChangeForecastModelAction(e.itemData.id));
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
                                name: 'bankAccountSelect',
                                widget: 'dxButton',
                                action: this.openBankAccountsSelectDialog.bind(this),
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
                            {
                                name: 'fullscreen',
                                visible: !this._cfoService.hasStaticInstance,
                                action: this.toggleFullscreen.bind(this, document.documentElement)
                            }
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
            // onRefresh: this._cfoService.hasStaticInstance ? undefined : this.getUpdatedDataSource.bind(this),
            toggleToolbar: this.toggleToolbar.bind(this),
            buttons: [
                {
                    enabled: !!(this.statsData && this.statsData.length),
                    action: this.showSourceDataWidget.bind(this),
                    lable: this.l('Show source data')
                }
            ]
        };
    }

    toggleToolbar() {
        this._appService.toolbarToggle();
        setTimeout(() => this.dataGrid.instance.repaint());
        this._filtersService.fixed = false;
        this._filtersService.disable();
        this.initToolbarConfig();
    }

    initFiltering() {
        this._filtersService.apply(() => {
            let requestFilter = this.defaultRequestFilter;
            for (let filter of this.filters) {
                if (filter.caption.toLowerCase() === 'account') {
                    /** apply filter on top */
                    this.bankAccountsService.applyFilter();
                    /** apply filter in sidebar */
                    filter.items.element.setValue(this.bankAccountsService.state.selectedBankAccountIds, filter);
                }

                let filterMethod = FilterHelpers['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod)
                    filterMethod(filter, requestFilter);
                else
                    requestFilter[filter.field] = undefined;
            }
            this.requestFilter.next(requestFilter);
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
                    this.dateFilter,
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

    getUpdatedDataSource() {
        this.refresh.next(null);
        this.bankAccountsService.load(true, false);
    }

    ngOnDestroy() {
        this._appService.updateToolbar(null);
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

    setBankAccountsFilter(emitFilterChange = false) {
        this.bankAccountsService.setBankAccountsFilter(this.filters, this.syncAccounts, emitFilterChange);
    }

    openBankAccountsSelectDialog() {
        this._dialog.open(BankAccountsSelectDialogComponent, {
            panelClass: 'slider',
        }).componentInstance.onApply.subscribe(() => {
            this.setBankAccountsFilter(true);
        });
    }

    /** Different styles for labels for positive and negative values */
    customizeLabel = (arg: any) => {
        if (arg.series.type !== 'rangearea' && arg.value < 0) {
            return {
                backgroundColor: this.labelNegativeBackgroundColor,
                visible: this.maxLabelCount >= this.statsData.length,
                customizeText: (e: any) => {
                    return this._statsService.replaceMinusWithBrackets(e.valueText, this.cfoPreferencesService.selectedCurrencySymbol);
                }
            };
        }
    }

    /** Replace minus for the brackets */
    customizeAxisValues = (arg: any) => {
        return arg.value < 0 ? this._statsService.replaceMinusWithBrackets(arg.valueText, this.cfoPreferencesService.selectedCurrencySymbol) : arg.valueText.replace('$', this.cfoPreferencesService.selectedCurrencySymbol);
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

    activate() {
        this.initToolbarConfig();
        this.setupFilters();
        this.initFiltering();

        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        this.bankAccountsService.load();
        this._lifecycleService.activate.next();

        /** If selected accounts changed in another component - update widgets */
        if (this.updateAfterActivation) {
            this.setBankAccountsFilter(true);
            this.updateAfterActivation = false;
        }

        this.synchProgressComponent.activate();
        this.rootComponent.overflowHidden(true);
    }

    deactivate() {
        this._dialog.closeAll();
        this._appService.updateToolbar(null);
        this._filtersService.unsubscribe();
        this.synchProgressComponent.deactivate();
        this.rootComponent.overflowHidden();
    }

}
