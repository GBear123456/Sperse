import { Component, OnInit, Injector } from '@angular/core';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import * as moment from 'moment';
import {
    BankAccountsServiceProxy,
    BankAccountDailyStatDto,
    GroupBy,
    InstanceType
} from '@shared/service-proxies/service-proxies';
import { TrendByPeriodModel } from './trend-by-period.model';
import { Observable } from 'rxjs/Observable';
import { asap } from 'rxjs/scheduler/asap';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/take';

@Component({
    selector: 'app-trend-by-period',
    templateUrl: './trend-by-period.component.html',
    providers: [ BankAccountsServiceProxy ],
    styleUrls: ['./trend-by-period.component.less']
})
export class TrendByPeriodComponent extends CFOComponentBase implements OnInit {
    trendData: Array<BankAccountDailyStatDto>;
    chartWidth = 650;
    currency = 'USD';
    historicalIncomeColor = '#00aeef';
    historicalExpensesColor = '#f05b2a';
    forecastIncomeColor = '#a9e3f9';
    forecastExpensesColor = '#fec6b3';
    historicalNetChangeColor = '#fab800';
    forecastNetChangeColor = '#a82aba';
    barChartTooltipFieldsNames = [
        'startingBalance',
        'income',
        'expenses',
        'netChange',
        'endingBalance',
        'forecastStartingBalance',
        'forecastIncome',
        'forecastExpenses',
        'forecastNetChange',
        'forecastEndingBalance'
    ];
    /** @todo check what forecast id get */
    selectedForecastModelId = 52;
    periods: TrendByPeriodModel[] = [
        // {
        //     key: 0,
        //     name: 'day',
        //     text: `30 ${this.ls('Platform', 'Periods_Day_plural')}`,
        //     amount: 30
        // },
        // {
        //     key: 1,
        //     name: 'week',
        //     text: `15 ${this.ls('Platform', 'Periods_Week_plural')}`,
        //     amount: 15
        // },
        {
            key: 2,
            name: 'month',
            text: `12 ${this.ls('Platform', 'Periods_Month_plural')}`,
            amount: 12
        }
    ];
    selectedPeriod: TrendByPeriodModel = this.periods.find(period => period.name === 'month');
    loading = false;
    constructor(injector: Injector,
                private _bankAccountService: BankAccountsServiceProxy) {
        super(injector);
    }

    ngOnInit() {
        this.loadStatsData();
        this.chartWidth = this.getElementRef().nativeElement.clientWidth - 60;
    }

    /** Replace minus for the brackets */
    customizeAxisValues = (arg: any) => {
        return arg.value < 0 ? this.replaceMinusWithBrackets(arg.valueText) : arg.valueText;
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
        return `${elem.value.getDate()}.${elem.value.getMonth() + 1}`;
    }

    /** @todo move to helper */
    /**
     * Replace string negative value like '$-1000' for the string '$(1000)' (with brackets)
     * @param {string} value
     * @return {string}
     */
    replaceMinusWithBrackets(value: string) {
        return value.replace(/\B(?=(\d{3})+\b)/g, ',').replace(/-(.*)/, '($1)');
    }

    customizeBarTooltip = (pointInfo) => {
        return {
            html: this.getTooltipInfoHtml(pointInfo)
        };
    }

    /** @todo move to stats service (but create it first) */
    getTooltipInfoHtml(pointInfo) {
        let html = '';
        let pointDataObject = this.trendData.find(item => item.date.toDate().toString() == pointInfo.argument);
        this.barChartTooltipFieldsNames.forEach(fieldName => {
            if (pointDataObject[fieldName] !== null && pointDataObject[fieldName] !== undefined) {
                html += `${this.l('Stats_' + fieldName)} : <span style="float: right; font-family: Lato; margin-left: 10px">${pointDataObject[fieldName].toLocaleString('en-EN', {style: 'currency',  currency: 'USD' })}</span>`;
                if (fieldName === 'startingBalance' ||
                    fieldName === 'forecastStartingBalance' ||
                    fieldName === 'netChange' ||
                    fieldName === 'forecastNetChange')
                    html += '<hr style="margin: 5px 0"/>';
                else
                    html += '<br>';
            }
        });
        return html;
    }

    loadStatsData() {
        this.startLoading();
        /** change Monthly string to months and others periods to provide moment add and subtract with proper param */
        let modifyingArguments = [this.selectedPeriod.amount, this.selectedPeriod.name + 's'];
        let startDate = moment().subtract(...modifyingArguments),
            endDate = moment().add(...modifyingArguments),
            accountIds = [];
        this._bankAccountService.getStats(
            InstanceType[this.instanceType],
            this.instanceId,
            'USD',
            this.selectedForecastModelId,
            accountIds,
            startDate,
            endDate,
            this.selectedPeriod.key
        ).subscribe(result => {
                if (result) {
                    let historical = [], forecast = [];
                    result.forEach(statsItem => {
                        Object.defineProperty(
                            statsItem,
                            'netChange',
                            { value: statsItem.income + statsItem.expenses, enumerable: true }
                        );
                        if (statsItem.isForecast) {
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
                        .subscribe(res => { this.trendData = <any>res; this.finishLoading(); });
                } else {
                    console.log('No daily stats');
                    this.finishLoading();
                }
            },
            error => { console.log('Error: ' + error); this.finishLoading(); }
        );
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
                    Observable.from(historical.slice(-this.selectedPeriod.amount), asap)
               )
            .take(this.selectedPeriod.amount)
            .toArray();
    }

    onSelectChange(event) {
        this.selectedPeriod = this.periods.find(period => period.key === event.value);
        this.loadStatsData();
    }

}
