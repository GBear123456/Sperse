/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    Injector,
    HostListener,
    ViewChild,
    ChangeDetectorRef,
    OnDestroy
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import { select, Store } from '@ngrx/store';
import { DxChartComponent } from 'devextreme-angular/ui/chart';
import { BehaviorSubject, Observable, asapScheduler, combineLatest, merge, from, of } from 'rxjs';
import {
    catchError,
    filter,
    first,
    finalize,
    take,
    tap,
    toArray,
    switchMap,
    map,
    mapTo,
    takeUntil,
    publishReplay,
    refCount
} from 'rxjs/operators';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import {
    BankAccountsServiceProxy,
    BankAccountDailyStatDto,
    InstanceType,
    CashFlowForecastServiceProxy,
    GroupByPeriod
} from '@shared/service-proxies/service-proxies';
import { TrendByPeriodModel } from './trend-by-period.model';
import { StatsService } from '@app/cfo/shared/helpers/stats.service';
import { DashboardService } from '../dashboard.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { PeriodModel } from '@app/shared/common/period/period.model';
import {
    CfoStore,
    CurrenciesStoreSelectors,
    ForecastModelsStoreActions,
    ForecastModelsStoreSelectors
} from '@app/cfo/store';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppConsts } from '@shared/AppConsts';
import { ChartTypeModel } from '@shared/cfo/dashboard-widgets/trend-by-period/chart-type.model';
import { ChartType } from '@shared/cfo/dashboard-widgets/trend-by-period/chart-type.enum';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { CacheService } from '@node_modules/ng2-cache-service';

@Component({
    selector: 'app-trend-by-period',
    templateUrl: './trend-by-period.component.html',
    providers: [ BankAccountsServiceProxy, StatsService, CurrencyPipe, LifecycleSubjectsService ],
    styleUrls: ['./trend-by-period.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrendByPeriodComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxChartComponent) chartComponent: DxChartComponent;
    bankAccountIds$: Observable<number[]> = this.bankAccountService.selectedBankAccountsIds$;
    trendData$: Observable<Array<BankAccountDailyStatDto>>;
    trendData: Array<BankAccountDailyStatDto>;
    chartHeight = 245;
    chartWidth = 650;
    isForecast = false;
    endingBalanceColor = '#ace2f9';
    forecastEndingBalanceColor = '#f9ba4e';
    historicalCreditColor = '#00aeef';
    historicalDebitColor = '#f05b2a';
    forecastCreditColor = '#a9e3f9';
    forecastDebitColor = '#fec6b3';
    historicalNetChangeColor = '#fab800';
    forecastNetChangeColor = '#a82aba';
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
            'name': 'credit',
            'label': this.l('Stats_Inflows')
        },
        {
            'name': 'debit',
            'label': this.l('Stats_Outflows')
        },
        {
            'name': 'netChange',
            'label': this.l('Net_Change')
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
    periods: TrendByPeriodModel[] = [
        {
            key: GroupByPeriod.Daily,
            name: 'day',
            amount: 30
        },
        {
            key: GroupByPeriod.Weekly,
            name: 'week',
            amount: 15
        },
        {
            key: GroupByPeriod.Monthly,
            name: 'month',
            amount: 12
        }
    ];
    selectedPeriod: TrendByPeriodModel = this.periods.find(period => period.name === 'month');
    refresh$: Observable<null> = this.dashboardService.refresh$;
    period$ = this.dashboardService.period$.pipe(
        map((period: PeriodModel) => {
            let periodName = period.name;
            if (periodName === 'year' || periodName === 'quarter' || periodName === 'all') {
                periodName = 'month';
            } else {
                periodName = 'day';
            }

            this.selectedPeriod = this.periods.find((obj) => {
                return (obj.name === periodName);
            });
            this.selectedPeriod['startDate'] = period.from ? period.from.startOf('day') : null;
            this.selectedPeriod['endDate'] = period.to ? period.to.startOf('day') : null;
            return this.selectedPeriod;
        })
    );
    currencyId$ = this.store$.pipe(
        select(CurrenciesStoreSelectors.getSelectedCurrencyId),
        filter(Boolean)
    );
    forecastModelId$ = this.store$.pipe(select(ForecastModelsStoreSelectors.getSelectedForecastModelId));
    loading = true;
    chartTypes: ChartTypeModel[] = [
        {
            displayName: this.l('TrendByPeriod_CashBalancesTrends'),
            value: ChartType.CashBalancesTrends
        },
        {
            displayName: this.l('TrendByPeriod_CashBalanceWithNetChange'),
            value: ChartType.CashBalanceWithNetChange
        },
        {
            displayName: this.l('TrendByPeriod_CashInflowsAndOutflows'),
            value: ChartType.CashInflowsAndOutflows
        },
        {
            displayName: this.l('TrendByPeriod_BalancesInflowsOutflows'),
            value: ChartType.Combined
        }
    ];
    chartType = ChartType;
    private selectedChartCacheKey = [
        'CFO_Dashboard_TrendByPeriod_SelectedChart',
        this.sessionService.tenantId,
        this.sessionService.userId,
        this._cfoService.instanceId ||
        this._cfoService.instanceType
    ].join('_');
    selectedChartType: BehaviorSubject<ChartType> = new BehaviorSubject(
        this.cacheService.exists(this.selectedChartCacheKey)
            ? this.cacheService.get(this.selectedChartCacheKey)
            : ( this._cfoService.hasStaticInstance ? ChartType.Combined : ChartType.CashInflowsAndOutflows )
    );
    selectedChartType$: Observable<ChartType> = this.selectedChartType.asObservable();
    leftAxisTitle$: Observable<string> = this.selectedChartType$.pipe(
        map((selectedChartType: ChartType) => {
            return selectedChartType === ChartType.Combined
                   || selectedChartType === ChartType.CashBalanceWithNetChange
                   ? this.l('TrendByPeriod_CashBalancesTrends')
                   : '';
        })
    );
    rightAxisTitle$: Observable<string> = this.selectedChartType$.pipe(
        map((selectedChartType: ChartType) => {
            let rightAxisTitle = '';
            if (selectedChartType === ChartType.Combined) {
                rightAxisTitle = this.l('TrendByPeriod_CashInflowsAndOutflows');
            }
            if (selectedChartType === ChartType.CashBalanceWithNetChange) {
                rightAxisTitle = this.l('TrendByPeriod_NetChange');
            }
            return rightAxisTitle;
        })
    );
    showInflowsOutflowsCharts$: Observable<boolean> = this.selectedChartType$.pipe(
        map((selectedChartType: ChartType) => (selectedChartType === ChartType.CashInflowsAndOutflows
        || selectedChartType === ChartType.Combined))
    );
    showNetChangeChart$ = this.selectedChartType$.pipe(
        map((selectedChartType: ChartType) => (selectedChartType === ChartType.CashInflowsAndOutflows
            || selectedChartType === ChartType.Combined || selectedChartType === ChartType.CashBalanceWithNetChange))
    );
    showBalancesChart$ = this.selectedChartType$.pipe(
        map((selectedChartType: ChartType) => (selectedChartType === ChartType.CashBalancesTrends
            || selectedChartType === ChartType.Combined || selectedChartType === ChartType.CashBalanceWithNetChange))
    );
    showRightAxis$ = this.selectedChartType$.pipe(
        map((selectedChartType: ChartType) => (selectedChartType === ChartType.Combined || selectedChartType === ChartType.CashBalanceWithNetChange))
    );
    updateChartWidthAfterActivation = false;

    constructor(
        injector: Injector,
        private dashboardService: DashboardService,
        private bankAccountServiceProxy: BankAccountsServiceProxy,
        private statsService: StatsService,
        private cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
        private bankAccountService: BankAccountsService,
        private changeDetectorRef: ChangeDetectorRef,
        private lifeCycleService: LifecycleSubjectsService,
        private store$: Store<CfoStore.State>,
        private sessionService: AbpSessionService,
        private cacheService: CacheService,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.store$.dispatch(new ForecastModelsStoreActions.LoadRequestAction());
        this.loadStatsData();
        this.selectedChartType$.pipe(
            takeUntil(this.lifeCycleService.destroy$)
        ).subscribe((chartType: ChartType) => {
            this.saveSelectedChartInCache(chartType);
        });
    }

    @HostListener('window:resize', ['$event']) onResize() {
        if (this.componentIsActivated) {
            this.chartWidth = this.getChartWidth();
        } else {
            this.updateChartWidthAfterActivation = true;
        }
    }

    getChartWidth() {
        return this.getElementRef().nativeElement.clientWidth - ( AppConsts.isMobile ? 30 : 60 );
    }

    /** Replace minus for the brackets */
    customizeAxisValues = (arg: any) => {
        return arg.value < 0 ? this.statsService.replaceMinusWithBrackets(arg.valueText, this.cfoPreferencesService.selectedCurrencySymbol) : arg.valueText.replace('$', this.cfoPreferencesService.selectedCurrencySymbol);
    }

    customizeBottomAxis = (elem) => {
        return this.getPeriodBottomAxisCustomizer(this.selectedPeriod.name)(elem);
    }

    /** Factory for method that customize axis */
    getPeriodBottomAxisCustomizer(period: string) {
        return this[`get${this.capitalize(period)}BottomAxisCustomizer`];
    }

    getMonthBottomAxisCustomizer(elem) {
        return `${elem.valueText.substring(0, 3).toUpperCase()}<br/><div class="yearArgument">${elem.value.getFullYear().toString().substr(-2)}</div>`;
    }

    getWeekBottomAxisCustomizer(elem) {
        return `${elem.value.getDate()}.${elem.value.getMonth() + 1}`;
    }

    getDayBottomAxisCustomizer(elem) {
        return elem.value.toDateString().split(' ').splice(1, 2).join(' ');
    }

    customizeBarTooltip = (pointInfo) => {
        return {
            html: this.statsService.getTooltipInfoHtml(this.trendData, this.barChartTooltipFields, pointInfo)
        };
    }

    private loadStatsData() {
        const statsData$ = combineLatest(
            this.refresh$,
            this.period$,
            this.currencyId$,
            this.forecastModelId$.pipe(filter(Boolean)),
            this.bankAccountIds$
        ).pipe(
            switchMap((data) => this.componentIsActivated ? of(data) : this.lifeCycleService.activate$.pipe(first(), mapTo(data))),
            tap(() => this.startLoading()),
            switchMap(([, period, currencyId, forecastModelId, bankAccountIds]: [null, TrendByPeriodModel, string, number, number[]]) => this.bankAccountServiceProxy.getStats(
                    InstanceType[this.instanceType],
                    this.instanceId,
                    currencyId,
                    forecastModelId,
                    bankAccountIds,
                    period.startDate,
                    period.endDate,
                    period.key
                ).pipe(
                    catchError(() => of([])),
                    finalize(() => this.finishLoading())
                )
            ),
            filter(Boolean),
            map((stats: BankAccountDailyStatDto[]) => {
                let historical = [], forecast = [];
                stats.forEach((statsItem: BankAccountDailyStatDto) => {
                    if (statsItem.isForecast) {
                        this.isForecast = true;
                        for (let prop in statsItem) {
                            if (statsItem.hasOwnProperty(prop) && prop !== 'date' && prop !== 'isForecast') {
                                statsItem['forecast' + this.capitalize(prop)] = statsItem[prop];
                                delete statsItem[prop];
                            }
                        }
                    }
                    if (statsItem.isForecast) {
                        forecast.push(statsItem);
                    } else {
                        historical.push(statsItem);
                    }
                });
                return {
                    historical: historical,
                    forecast: forecast
                };
            }),
            switchMap(data => this.mergeHistoricalAndForecast(data.historical, data.forecast)),
            map((stats: BankAccountDailyStatDto[]) => {
                stats.forEach((statsItem: BankAccountDailyStatDto) => {
                    Object.defineProperty(
                        statsItem,
                        'netChange',
                        {
                            value: statsItem.isForecast
                                   ? statsItem['forecastCredit'] + statsItem['forecastDebit']
                                   : statsItem.credit + statsItem.debit,
                            enumerable: true
                        }
                    );
                });
                return <any>stats.map((obj) => {
                    obj['date'].add(obj['date'].toDate().getTimezoneOffset(), 'minutes');
                    return obj;
                });
            })
        );
        this.trendData$ = combineLatest(
            statsData$,
            this.selectedChartType$
        ).pipe(
            map(([stats, selectedChartType]: [BankAccountDailyStatDto[], ChartType]) => {
                if (selectedChartType === ChartType.CashBalancesTrends
                    || selectedChartType === ChartType.Combined
                    || selectedChartType === ChartType.CashBalanceWithNetChange
                ) {
                    const allValues = stats.map(statsItem => statsItem.endingBalance !== undefined
                        ? statsItem.endingBalance
                        : statsItem['forecastEndingBalance']
                    );
                    const minValue = Math.min.apply(Math, allValues);
                    const maxValue = Math.max.apply(Math, allValues);
                    const minRange = minValue - (0.2 * Math.abs(maxValue - minValue));
                    stats.forEach((statsItem: BankAccountDailyStatDto) => {
                        Object.defineProperty(
                            statsItem,
                            'minRange',
                            {value: minRange, enumerable: true}
                        );
                    });
                }
                return stats;
            }),
            publishReplay(),
            refCount()
        );
        this.trendData$.pipe(takeUntil(this.destroy$)).subscribe(trendData => {
            this.trendData = trendData;
            this.chartWidth = this.getChartWidth();
            this.changeDetectorRef.detectChanges();
        });
    }

    activate() {
        if (this.updateChartWidthAfterActivation) {
            this.chartWidth = this.getChartWidth();
            this.updateChartWidthAfterActivation = false;
        }
        this.lifeCycleService.activate.next();
    }

    /**
     * Merge historical and forecast data concurrently from both arrays
     * @param historical
     * @param forecast
     */
    mergeHistoricalAndForecast(historical, forecast) {
        return merge(
                    from(forecast, asapScheduler),
                    /** Get last values closer to the current date */
                    from(
                        historical.slice(-this.selectedPeriod.amount)
                                  .sort((item1, item2) => item1.date < item2.date ? 1 : -1),
                        asapScheduler
                    )
                ).pipe(
                    take(this.selectedPeriod.amount),
                    toArray()
                );
    }

    private saveSelectedChartInCache(chartType: ChartType) {
        this.cacheService.set(this.selectedChartCacheKey, chartType);
    }

    changeSelectedChartType(e) {
        this.selectedChartType.next(e.selectedItem.value);
    }

    getAxisName(chartType: ChartType.CashInflowsAndOutflows | ChartType.CashBalancesTrends): string {
        let axisName = 'leftAxis';
        if (this.selectedChartType.value === ChartType.Combined
            || this.selectedChartType.value === ChartType.CashBalanceWithNetChange) {
            axisName = chartType === ChartType.CashBalancesTrends ? 'leftAxis' : 'rightAxis';
        }
        return axisName;
    }

    ngOnDestroy() {
        this.lifeCycleService.destroy.next();
    }

}
