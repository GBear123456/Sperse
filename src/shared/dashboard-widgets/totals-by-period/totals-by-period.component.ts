import {Component, Injector, OnInit} from '@angular/core';
import {CFOComponentBase} from '@app/cfo/shared/common/cfo-component-base';
import {AppConsts} from '@shared/AppConsts';
import {
    BankAccountsServiceProxy,
    GroupBy,
    InstanceType
} from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';

@Component({
    selector: 'app-totals-by-period',
    templateUrl: './totals-by-period.component.html',
    styleUrls: ['./totals-by-period.component.less'],
    providers: [BankAccountsServiceProxy]
})
export class TotalsByPeriodComponent extends CFOComponentBase implements OnInit {
    availablePeriods = [
        this.l('Today'),
        this.l('Yesterday'),
        this.l('This_Week'),
        this.l('This_Month'),
        this.l('Last_Month'),
        this.l('This_Year'),
        this.l('Last_Year')
    ];
    totalData: any;
    selectedPeriod: any = String(GroupBy['Yearly']).toLowerCase();
    startDate = moment().utc().subtract(1, 'year').startOf('year');
    endDate = moment().utc().subtract(1, 'year').endOf('year');
    incomeColor = '#32bef2';
    expensesColor = '#f9b74b';
    netChangeColor = '#35c8a8';

    constructor(
        injector: Injector,
        private _bankAccountService: BankAccountsServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.loadStatsData();
    }

    loadStatsData() {
        abp.ui.setBusy('.totalByPeriod');
        this._bankAccountService.getStats(
            InstanceType[this.instanceType],
            this.instanceId,
            'USD',
            undefined,
            null,
            this.startDate,
            this.endDate,
            undefined,
            this.selectedPeriod
        ).subscribe(result => {
                result.forEach(statsItem => {
                    statsItem.income = Math.abs(statsItem.income);
                    statsItem.expenses = Math.abs(statsItem.expenses);
                    Object.defineProperty(
                        statsItem,
                        'netChange',
                        { value: Math.abs(statsItem.income - statsItem.expenses) }
                    );
                });
                this.totalData = result;
                abp.ui.clearBusy('.totalByPeriod');
            });
    }

    onValueChanged($event): void {
        let period;
        let groupBy;
        let startDate = moment().utc();
        let endDate = moment().utc();

        switch ($event.value) {
            case 'Today':
                period = 'day';
                groupBy = 'Daily';
                break;
            case 'Yesterday':
                period = 'day';
                groupBy = 'Daily';
                startDate.subtract(1, 'day');
                endDate.subtract(1, 'day');
                break;
            case 'This Week':
                period = 'week';
                groupBy = 'Weekly';
                break;
            case 'This Month':
                period = 'month';
                groupBy = 'Monthly';
                break;
            case 'Last Month':
                period = 'month';
                groupBy = 'Monthly';
                startDate.subtract(1, 'month');
                endDate.subtract(1, 'month');
                break;
            case 'This Year':
                period = 'year';
                groupBy = 'Yearly';
                break;
            case 'Last Year':
                period = 'year';
                groupBy = 'Yearly';
                startDate.subtract(1, 'year');
                endDate.subtract(1, 'year');
                break;
            default:
                period = 'year';
                groupBy = 'Yearly';
                startDate.subtract(1, 'year');
                endDate.subtract(1, 'year');
                break;
        }

        this.startDate = startDate.startOf(period);
        this.endDate = endDate.endOf(period);
        this.selectedPeriod = String(GroupBy[groupBy]).toLowerCase();
        this.loadStatsData();
    }

    customizeText = (pointInfo: any) => {
        if (this.totalData[0].income - this.totalData[0].expenses < 0) {
            return '-' + pointInfo.valueText;
        } else {
            return pointInfo.valueText;
        }
    }
}
