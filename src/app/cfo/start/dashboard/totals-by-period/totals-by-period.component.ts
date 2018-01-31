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
    selectedPeriod: any = String(GroupBy['Monthly']).toLowerCase();
    startDate = moment().startOf('month');
    endDate = moment().endOf('month');
    incomeColor = '#32bef2';
    expensesColor = '#f9b74b';
    netChangeColor = '#35c8a8';

    constructor(
        injector: Injector,
        private _bankAccountService: BankAccountsServiceProxy
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit() {
        this.loadStatsData();
    }

    loadStatsData() {
        abp.ui.setBusy('app-totals-by-period');
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
                        { value: statsItem.income - statsItem.expenses }
                    );
                });
                this.totalData = result;
                console.log(this.totalData);
                abp.ui.clearBusy('app-totals-by-period');
            });
    }

    onValueChanged($event): void {
        let period;
        let groupBy;

        switch ($event.value) {
            case 'Today':
                period = 'day';
                groupBy = 'Daily';
                break;
            case 'Yesterday':
                period = 'day';
                groupBy = 'Daily';
                break;
            case 'This_Week':
                period = 'week';
                groupBy = 'Weekly';
                break;
            case 'This_Month':
                period = 'month';
                groupBy = 'Monthly';
                break;
            case 'Last_Month':
                period = 'month';
                groupBy = 'Monthly';
                break;
            case 'This_Year':
                period = 'year';
                groupBy = 'Yearly';
                break;
            case 'Last_Year':
                period = 'year';
                groupBy = 'Yearly';
                break;
            default:
                period = 'month';
                groupBy = 'Monthly';
                break;
        }

        this.startDate = moment().utc().startOf(period);
        this.endDate = moment().utc().endOf(period);
        this.selectedPeriod = String(GroupBy[groupBy]).toLowerCase();
        this.loadStatsData();
    }

}
