import { Component, OnInit, Injector } from '@angular/core';
import {
    BankAccountsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { TotalsByPeriodModel } from './totals-by-period.model';
import { AppComponentBase } from '@shared/common/app-component-base';

import * as moment from 'moment';

@Component({
    selector: 'totals-by-period',
    templateUrl: './totals-by-period.component.html',
    styleUrls: ['./totals-by-period.component.less'],
    providers: [  ]
})
export class TotalsByPeriodComponent extends AppComponentBase implements OnInit {
    totalsData: any = [];
    startDate: any;
    endDate: any;
    chartWidth = 650;
    currency = 'USD';

    historicalCreditColor = '#00aeef';
    historicalDebitColor = '#f05b2a';
    historicalNetChangeColor = '#fab800';
    barChartTooltipFields = [
        {
            'name': 'startingCount',
            'label': this.l('Stats_startingCount')
        },
        {
            'name': 'endingCount',
            'label': this.l('Stats_endingCount')
        }
    ];

    periods: TotalsByPeriodModel[] = [
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
    selectedPeriod: TotalsByPeriodModel = this.periods.find(period => period.name === 'day');

    constructor(injector: Injector
    ) {
        super(injector);
    }

    ngOnInit() {
    }

    /** Replace minus for the brackets */
    customizeAxisValues = (arg: any) => {
        return arg.valueText;
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
            html: 'Tooltip TEMPLATE'
        };
    }

    loadStatsData() {
        this.startLoading();
    }
}
