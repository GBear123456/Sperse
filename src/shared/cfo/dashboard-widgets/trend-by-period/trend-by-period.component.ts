/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    Injector,
    HostListener,
    ChangeDetectorRef,
    OnDestroy
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import { select, Store } from '@ngrx/store';
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
import color from 'color';
import { CacheService } from 'ng2-cache-service';

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
import { CfoStore, ForecastModelsStoreActions, ForecastModelsStoreSelectors } from '@app/cfo/store';
import { RootStore, CurrenciesStoreSelectors } from '@root/store';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppConsts } from '@shared/AppConsts';
import { ChartTypeModel } from '@shared/cfo/dashboard-widgets/trend-by-period/chart-type.model';
import { ChartType } from '@shared/cfo/dashboard-widgets/trend-by-period/chart-type.enum';
import { AbpSessionService } from 'abp-ng2-module';
import { CalendarValuesModel } from '../../../common/widgets/calendar/calendar-values.model';
import { Period } from '../../../../app/shared/common/period/period.enum';
import { DateHelper } from '../../../helpers/DateHelper';
import { CalendarService } from '@app/shared/common/calendar-button/calendar.service';

@Component({
    selector: 'app-trend-by-period',
    templateUrl: './trend-by-period.component.html',
    providers: [ BankAccountsServiceProxy, StatsService, CurrencyPipe, LifecycleSubjectsService ],
    styleUrls: ['./trend-by-period.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrendByPeriodComponent extends CFOComponentBase implements OnInit, OnDestroy {
    bankAccountIds$: Observable<number[]> = this.bankAccountService.selectedBankAccountsIds$;
    trendData$: Observable<Array<BankAccountDailyStatDto>>;
    trendData: Array<BankAccountDailyStatDto>;
    chartHeight = 245;
    chartWidth = 650;
    isForecast = false;
    historicalCreditColor = this.layoutService.getLayoutColor('historicalCredit');
    historicalDebitColor = this.layoutService.getLayoutColor('historicalDebit');
    historicalNetChangeColor = this.layoutService.getLayoutColor('historicalNetChange');
    endingBalanceColor = this.layoutService.getLayoutColor('endingBalance');
    endingBalanceStopColor = color(this.endingBalanceColor).lighten(0.1).hex();
    forecastCreditColor = this.layoutService.getLayoutColor('forecastCredit');
    forecastDebitColor = this.layoutService.getLayoutColor('forecastDebit');
    forecastNetChangeColor = this.layoutService.getLayoutColor('forecastNetChange');
    forecastEndingBalanceColor = this.layoutService.getLayoutColor('forecastEndingBalance');
    forecastEndingBalanceStopColor = color(this.forecastEndingBalanceColor).lighten(0.1).hex();
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
    period$ = this.calendarService.dateRange$.pipe(
        map((calendarValues: CalendarValuesModel) => {
            let periodName = 'month';
            if (calendarValues.period === Period.Today || periodName === Period.Yesterday) {
                periodName = 'day';
            }

            this.selectedPeriod = this.periods.find((obj) => {
                return (obj.name === periodName);
            });
            this.selectedPeriod.startDate = calendarValues.from.value
                ? DateHelper.getDateWithoutTime(DateHelper.removeTimezoneOffset(new Date(calendarValues.from.value)))
                : undefined;
            this.selectedPeriod.endDate = calendarValues.to.value
                ? DateHelper.getDateWithoutTime(DateHelper.removeTimezoneOffset(new Date(calendarValues.to.value), false, 'from'))
                : undefined;
            return this.selectedPeriod;
        })
    );
    currencyId$ = this.rootStore$.pipe(
        select(CurrenciesStoreSelectors.getSelectedCurrencyId),
        filter(Boolean)
    );
    forecastModelId$ = this.cfoStore$.pipe(select(ForecastModelsStoreSelectors.getSelectedForecastModelId));
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
        map((selectedChartType: ChartType) => selectedChartType === ChartType.CashInflowsAndOutflows
                                                      || selectedChartType === ChartType.Combined)
    );
    showNetChangeChart$ = this.selectedChartType$.pipe(
        map((selectedChartType: ChartType) => selectedChartType === ChartType.CashInflowsAndOutflows
                                                      || selectedChartType === ChartType.Combined
                                                      || selectedChartType === ChartType.CashBalanceWithNetChange)
    );
    showBalancesChart$ = this.selectedChartType$.pipe(
        map((selectedChartType: ChartType) => selectedChartType === ChartType.CashBalancesTrends
                                                      || selectedChartType === ChartType.Combined
                                                      || selectedChartType === ChartType.CashBalanceWithNetChange)
    );
    showRightAxis$ = this.selectedChartType$.pipe(
        map((selectedChartType: ChartType) => selectedChartType === ChartType.Combined
                                                      || selectedChartType === ChartType.CashBalanceWithNetChange)
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
        private rootStore$: Store<RootStore.State>,
        private cfoStore$: Store<CfoStore.State>,
        private sessionService: AbpSessionService,
        private cacheService: CacheService,
        private calendarService: CalendarService,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.cfoStore$.dispatch(new ForecastModelsStoreActions.LoadRequestAction());
        this.loadStatsData();
        this.selectedChartType$.pipe(
            takeUntil(this.lifeCycleService.destroy$)
        ).subscribe((chartType: ChartType) => {
            this.saveSelectedChartInCache(chartType);
        });
    }

    @HostListener('window:resize', ['$event']) onResize() {
        if (this.componentIsActivated) {
            this.updateWidth();
        } else {
            this.updateChartWidthAfterActivation = true;
        }
    }

    updateWidth() {
        this.chartWidth = this.getChartWidth();
        this.changeDetectorRef.markForCheck();
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
            switchMap(([, period, currencyId, forecastModelId, bankAccountIds]: [null, TrendByPeriodModel, string, number, number[]]) => {
                return this.bankAccountServiceProxy.getStats(
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
                );
            }),
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
                        statsItem.isForecast ? 'forecastNetChange' : 'netChange',
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
            this.updateWidth();
            this.changeDetectorRef.detectChanges();
        });
    }

    activate() {
        if (this.updateChartWidthAfterActivation) {
            this.updateWidth();
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
        if ((this.selectedChartType.value === ChartType.Combined
            || this.selectedChartType.value === ChartType.CashBalanceWithNetChange)
            && chartType !== ChartType.CashBalancesTrends) {
            axisName = 'rightAxis';
        }
        return axisName;
    }

    ngOnDestroy() {
        this.lifeCycleService.destroy.next();
    }

}
