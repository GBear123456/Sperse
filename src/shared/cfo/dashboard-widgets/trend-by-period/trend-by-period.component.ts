import { Component, OnInit, Injector, Input } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import {
    BankAccountsServiceProxy,
    BankAccountDailyStatDto,
    GroupBy,
    InstanceType,
    CashFlowForecastServiceProxy
} from '@shared/service-proxies/service-proxies';
import { TrendByPeriodModel } from './trend-by-period.model';
import { Observable } from 'rxjs/Observable';
import { asap } from 'rxjs/scheduler/asap';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/take';
import { StatsService } from '@app/cfo/shared/helpers/stats.service';
import { DashboardService } from '../dashboard.service';

import * as moment from 'moment';

@Component({
    selector: 'app-trend-by-period',
    templateUrl: './trend-by-period.component.html',
    providers: [ BankAccountsServiceProxy, StatsService, CashFlowForecastServiceProxy ],
    styleUrls: ['./trend-by-period.component.less']
})
export class TrendByPeriodComponent extends CFOComponentBase implements OnInit {
    @Input() waitForBankAccounts = false;
    bankAccountIds: number[] = [];
    trendData: Array<BankAccountDailyStatDto>;
    startDate: any;
    endDate: any;
    chartWidth = 650;
    currency = 'USD';
    isForecast = false;
    initCallback;
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
    selectedForecastModelId = 1;
    periods: TrendByPeriodModel[] = [
         {
             key: 0,
             name: 'day',
             text: `30 ${this.ls('Platform', 'Periods_Day_plural')}`,
             amount: 30
         },
         {
             key: 1,
             name: 'week',
             text: `15 ${this.ls('Platform', 'Periods_Week_plural')}`,
             amount: 15
        },
        {
            key: 2,
            name: 'month',
            text: `12 ${this.l('Periods_Month_plural')}`,
            amount: 12
        }
    ];
    selectedPeriod: TrendByPeriodModel = this.periods.find(period => period.name === 'month');
    loading = true;
    constructor(injector: Injector,
        private _dashboardService: DashboardService,
        private _bankAccountService: BankAccountsServiceProxy,
        private _statsService: StatsService,
        private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy
    ) {
        super(injector);

        _dashboardService.subscribePeriodChange((value) => {
            if (this.initCallback)
                this.onSelectChange(value);
            else
                this.initCallback = this.onSelectChange.bind(this, value);
        });
    }

    ngOnInit() {
        this._cashFlowForecastServiceProxy
            .getModels(InstanceType[this.instanceType], this.instanceId)
            .subscribe(data => {
                if (data && data.length) {
                    this.selectedForecastModelId = data[0].id;
                }
                if (this.initCallback)
                    this.initCallback.call(this);
                else
                    this.initCallback = Function();
                this.chartWidth = this.getElementRef().nativeElement.clientWidth - 60;
            });
    }

    /** Replace minus for the brackets */
    customizeAxisValues = (arg: any) => {
        return arg.value < 0 ? this._statsService.replaceMinusWithBrackets(arg.valueText) : arg.valueText;
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

    loadStatsData() {
        if (!this.waitForBankAccounts) {
            this.startLoading();
            this._bankAccountService.getStats(
                InstanceType[this.instanceType],
                this.instanceId,
                'USD',
                this.selectedForecastModelId,
                undefined,
                this.bankAccountIds,
                this.startDate,
                this.endDate,
                undefined,
                this.selectedPeriod.key
            ).subscribe(result => {
                if (result) {
                    let historical = [], forecast = [];
                    result.forEach(statsItem => {
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
                    this.mergeHistoricalAndForecast(historical, forecast)
                        .subscribe(res => {
                            this.trendData = <any>res.map((obj) => {
                                obj['date'].add(obj['date'].toDate().getTimezoneOffset(), 'minutes');
                                return obj;
                            });
                            this.finishLoading();
                        });
                } else {
                    console.log('No daily stats');
                    this.finishLoading();
                }
            },
                error => { console.log('Error: ' + error); this.finishLoading(); }
                );
        }
    }

    /**
     * Merge historical and forecast data concurrently from both arrays
     * @param historical
     * @param forecast
     */
    mergeHistoricalAndForecast(historical, forecast) {
        return Observable.merge(
                    Observable.from(forecast, asap),
                    /** Get last values closer to the current date */
                    Observable.from(
                        historical.slice(-this.selectedPeriod.amount)
                                  .sort((item1, item2) => item1.date < item2.date ? 1 : -1),
                        asap
                    )
                )
            .take(this.selectedPeriod.amount)
            .toArray();
    }

    onSelectChange(value) {
        let period = 'month';
        let startDate = moment().utc();
        let endDate = moment().utc();
        switch (value) {
            case this.l('Today'):
                period = 'day';
                break;
            case this.l('Yesterday'):
                period = 'day';
                startDate.subtract(1, 'day');
                endDate.subtract(1, 'day');
                break;
            case this.l('This_Week'):
                period = 'day';
                startDate.startOf('week');
                endDate.endOf('week');
                break;
            case this.l('This_Month'):
                period = 'day';
                startDate.startOf('month');
                endDate.endOf('month');
                break;
            case this.l('Last_Month'):
                period = 'day';
                startDate.startOf('month').subtract(1, 'month');
                endDate.endOf('month').subtract(1, 'month');
                break;
            case this.l('This_Year'):
                startDate.startOf('year');
                endDate.endOf('year');
                break;
            case this.l('Last_Year'):
                startDate.startOf('year').subtract(1, 'year');
                endDate.endOf('year').subtract(1, 'year');
                break;
            case this.l('All_Periods'):
                period = 'all';
                break;
            default:
                startDate.subtract(12, 'month');
                break;
        }

        this.startDate = (period == 'all' ? undefined : startDate.startOf('day'));
        this.endDate = (period == 'all' ? undefined : endDate.endOf('day'));

        this.selectedPeriod = this.periods.find((obj) => {
            return obj.name === (period == 'all' ? 'month': period);
        });

        this.loadStatsData();
    }

    filterByBankAccounts(bankAccountIds: number[]) {
        this.waitForBankAccounts = false;
        this.bankAccountIds = bankAccountIds;
        this.loadStatsData();
    }

}
