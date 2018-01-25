import { Component, OnInit, Injector } from '@angular/core';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import * as moment from 'moment';
import {
    BankAccountsServiceProxy,
    BankAccountDailyStatDto,
    GroupBy,
    InstanceType
} from '@shared/service-proxies/service-proxies';

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
    barChartTooltipFieldsNames = [
        'startingBalance',
        'income',
        'expenses',
        'endingBalance',
        'forecastStartingBalance',
        'forecastIncome',
        'forecastExpenses',
        'forecastEndingBalance'
    ];
    /** @todo check what forecast id get */
    selectedForecastModelId = 1;
    moreStatisticLink = '../stats';
    selectedPeriod: any = String(GroupBy['Monthly']).toLowerCase();
    selectedPeriodIndex: number = Object.keys(GroupBy).indexOf('Monthly');
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
        return this.getPeriodBottomAxisCustomizer(this.selectedPeriod)(elem);
    }

    /** Factory for method that customize axis */
    getPeriodBottomAxisCustomizer(period: GroupBy) {
        return this[`get${this.capitalize(period)}BottomAxisCustomizer`];
    }

    getMonthlyBottomAxisCustomizer(elem) {
        return `${elem.valueText.substring(0, 3).toUpperCase()}<br/><div class="yearArgument">${elem.value.getFullYear().toString().substr(-2)}</div>`;
    }

    getWeeklyBottomAxisCustomizer(elem) {
        return `${elem.value.getDate()}.${elem.value.getMonth() + 1}.${elem.value.getFullYear()}`;
    }

    getDailyBottomAxisCustomizer(elem) {
        return `${elem.value.getDate()}.${elem.value.getMonth() + 1}.${elem.value.getFullYear()}`;
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

    getTooltipInfoHtml(pointInfo) {
        let html = '';
        let pointDataObject = this.trendData.find(item => item.date.toDate().toString() == pointInfo.argument);
        this.barChartTooltipFieldsNames.forEach(fieldName => {
            if (pointDataObject[fieldName] !== null && pointDataObject[fieldName] !== undefined) {
                html += `${this.l('Stats_' + fieldName)} : ${pointDataObject[fieldName]}<br>`;
            }
        });
        return html;
    }

    loadStatsData() {
        /** change Monthly string to months and others periods to provide moment add and subtract with proper param */
        let selectedPeriodString = this.selectedPeriod === 'daily' ? 'days' : this.selectedPeriod.slice(0, -2) + 's',
            modifyingArguments = [12, selectedPeriodString];
        let startDate = moment().subtract(...modifyingArguments),
            endDate = moment().add(...modifyingArguments),
            accountIds = [];
        this._bankAccountService.getStats(
            InstanceType[this.instanceType], this.instanceId,
            'USD', this.selectedForecastModelId, accountIds, startDate, endDate, this.selectedPeriod
        ).subscribe(result => {
                if (result) {
                    let minEndingBalanceValue = Math.min.apply(Math, result.map(item => item.endingBalance)),
                        minRange = minEndingBalanceValue - (0.2 * Math.abs(minEndingBalanceValue));
                    this.trendData = result.map(statsItem => {
                        Object.defineProperties(statsItem, {
                            'netChange': { value: statsItem.income + statsItem.expenses, enumerable: true },
                            'minRange': { value: minRange, enumerable: true }
                        });
                        if (statsItem.isForecast) {
                            for (let prop in statsItem) {
                                if (statsItem.hasOwnProperty(prop) && prop !== 'date' && prop !== 'isForecast') {
                                    statsItem['forecast' + this.capitalize(prop)] = statsItem[prop];
                                    delete statsItem[prop];
                                }
                            }
                        }
                        return statsItem;
                    });
                } else {
                    console.log('No daily stats');
                }
            },
            error => console.log('Error: ' + error));
    }

    onSelectChange(event) {
        this.selectedPeriod = GroupBy[Object.keys(GroupBy)[event]].toLowerCase();
        this.loadStatsData();
    }

}
