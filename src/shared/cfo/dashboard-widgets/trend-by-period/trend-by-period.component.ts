/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    Injector,
    HostListener,
    ViewChild,
    ChangeDetectorRef
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import { select, Store } from '@ngrx/store';
import { DxChartComponent } from 'devextreme-angular/ui/chart';
import { BehaviorSubject, Observable, asapScheduler, combineLatest, merge, from, of } from 'rxjs';
import {
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
    GroupBy
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

@Component({
    selector: 'app-trend-by-period',
    templateUrl: './trend-by-period.component.html',
    providers: [ BankAccountsServiceProxy, StatsService, CurrencyPipe, LifecycleSubjectsService ],
    styleUrls: ['./trend-by-period.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrendByPeriodComponent extends CFOComponentBase implements OnInit {
    @ViewChild(DxChartComponent) chartComponent: DxChartComponent;
    bankAccountIds$: Observable<number[]> = this._bankAccountService.selectedBankAccountsIds$;
    trendData$: Observable<Array<BankAccountDailyStatDto>>;
    trendData: Array<BankAccountDailyStatDto>;
    chartWidth = 650;
    isForecast = false;
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
             key: GroupBy.Daily,
             name: 'day',
             text: `30 ${this.ls('Platform', 'Periods_Day_plural')}`,
             amount: 30
         },
         {
             key: GroupBy.Weekly,
             name: 'week',
             text: `15 ${this.ls('Platform', 'Periods_Week_plural')}`,
             amount: 15
        },
        {
            key: GroupBy.Monthly,
            name: 'month',
            text: `12 ${this.l('Periods_Month_plural')}`,
            amount: 12
        }
    ];
    selectedPeriod: TrendByPeriodModel = this.periods.find(period => period.name === 'month');
    refresh: BehaviorSubject<any> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this.refresh.asObservable();
    period$ = this._dashboardService.period$.pipe(
        map((period: PeriodModel) => {
            let periodName = period.period;
            if (periodName === 'year' || periodName === 'all') {
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

    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        private _bankAccountServiceProxy: BankAccountsServiceProxy,
        private _statsService: StatsService,
        private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
        private _bankAccountService: BankAccountsService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _lifeCycleService: LifecycleSubjectsService,
        private store$: Store<CfoStore.State>,
        public cfoPreferencesService: CfoPreferencesService,
    ) {
        super(injector);
    }

    ngOnInit() {
        this.store$.dispatch(new ForecastModelsStoreActions.LoadRequestAction());
        this.loadStatsData();
    }

    @HostListener('window:resize', ['$event']) onResize() {
        this.chartWidth = this.getChartWidth();
    }

    getChartWidth() {
        return this.getElementRef().nativeElement.clientWidth - 60;
    }

    /** Replace minus for the brackets */
    customizeAxisValues = (arg: any) => {
        return arg.value < 0 ? this._statsService.replaceMinusWithBrackets(arg.valueText, this.cfoPreferencesService.selectedCurrencySymbol) : arg.valueText.replace('$', this.cfoPreferencesService.selectedCurrencySymbol);
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
            html: this._statsService.getTooltipInfoHtml(this.trendData, this.barChartTooltipFields, pointInfo)
        };
    }

    private loadStatsData() {
        this.trendData$ = combineLatest(
            this.refresh$.pipe(tap(x => console.log('refresh', x))),
            this.period$.pipe(tap(x => console.log('period', x))),
            this.currencyId$.pipe(tap(x => console.log('currencyId', x))),
            this.forecastModelId$.pipe(filter(Boolean)).pipe(tap(x => console.log('forecastModelId', x))),
            this.bankAccountIds$.pipe(tap(x => console.log('bank accounts ids', x)))
        ).pipe(
            switchMap((data) => this.componentIsActivated ? of(data) : this._lifeCycleService.activate$.pipe(first(), mapTo(data))),
            tap(() => this.startLoading()),
            switchMap(([, period, currencyId, forecastModelId, bankAccountIds]: [null, TrendByPeriodModel, string, number, number[]]) => this._bankAccountServiceProxy.getStats(
                    InstanceType[this.instanceType],
                    this.instanceId,
                    currencyId,
                    forecastModelId,
                    bankAccountIds,
                    period.startDate,
                    period.endDate,
                    period.key
                ).pipe(finalize(() => this.finishLoading()))
            ),
            filter(Boolean),
            map((stats: BankAccountDailyStatDto[]) => {
                let historical = [], forecast = [];
                stats.forEach(statsItem => {
                    Object.defineProperty(
                        statsItem,
                        'netChange',
                        { value: statsItem.credit + statsItem.debit, enumerable: true }
                    );
                    if (statsItem.isForecast) {
                        this.isForecast = true;
                        for (let prop in statsItem) {
                            if (statsItem.hasOwnProperty(prop) && prop !== 'date' && prop !== 'isForecast') {
                                statsItem['forecast' + this.capitalize(prop)] = statsItem[prop];
                                delete statsItem[prop];
                            }
                        }
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
            map(data => {
                return <any>data.map((obj) => {
                    obj['date'].add(obj['date'].toDate().getTimezoneOffset(), 'minutes');
                    return obj;
                });
            }),
            publishReplay(),
            refCount()
        );
        this.trendData$.pipe(takeUntil(this.destroy$)).subscribe(trendData => {
            this.trendData = trendData;
            this.chartWidth = this.getChartWidth();
            this._changeDetectorRef.detectChanges();
        });
    }

    activate() {
        this._lifeCycleService.activate.next();
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

}
