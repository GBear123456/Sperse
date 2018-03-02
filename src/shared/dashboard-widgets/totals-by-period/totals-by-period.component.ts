import {Component, Injector, OnInit} from '@angular/core';
import {CFOComponentBase} from '@app/cfo/shared/common/cfo-component-base';
import {AppConsts} from '@shared/AppConsts';
import { DashboardService } from '../dashboard.service';
import {
    BankAccountsServiceProxy,
    GroupBy,
    InstanceType
} from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/scan';

@Component({
    selector: 'app-totals-by-period',
    templateUrl: './totals-by-period.component.html',
    styleUrls: ['./totals-by-period.component.less'],
    providers: [BankAccountsServiceProxy]
})
export class TotalsByPeriodComponent extends CFOComponentBase implements OnInit {
    bankAccountIds: number[] = [];
    availablePeriods = [
        this.l('Today'),
        this.l('Yesterday'),
        this.l('This_Week'),
        this.l('This_Month'),
        this.l('Last_Month'),
        this.l('This_Year'),
        this.l('Last_Year'),
        this.l('All_Periods')
    ];
    totalData: any;
    selectedPeriod: any = String(GroupBy['Yearly']).toLowerCase();
    startDate;
    endDate;
    incomeColor = '#32bef2';
    expensesColor = '#f75a29'; 
    netChangeColor = '#35c8a8';
    loading = true;

    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        private _bankAccountService: BankAccountsServiceProxy
    ) {
        super(injector);

        _dashboardService.subscribePeriodChange(
            this.onValueChanged.bind(this));
    }

    ngOnInit() {
        this.loadStatsData();
    }

    loadStatsData() {
        this.startLoading();
        this._bankAccountService.getStats(
            InstanceType[this.instanceType],
            this.instanceId,
            'USD',
            undefined,
            this.bankAccountIds,
            this.startDate,
            this.endDate,
            undefined,
            this.selectedPeriod
        )
            .mergeMap(x => x)
            .scan((prevStatsItem, currentStatsItem) => {
                let income = Math.abs(currentStatsItem.income) + prevStatsItem.income;
                let expenses = Math.abs(currentStatsItem.expenses) + prevStatsItem.expenses;
                return {
                    'startingBalance': prevStatsItem.hasOwnProperty('startingBalance') ? 
                        prevStatsItem['startingBalance']: currentStatsItem.startingBalance - currentStatsItem.startingBalanceAdjustments,
                    'endingBalance': currentStatsItem.endingBalance,
                    'income': income,
                    'expenses': expenses,
                    'netChange': Math.abs(income - expenses),
                    'date': currentStatsItem.date
                };
            }, { 'income': 0, 'expenses': 0, 'netChange': 0 })
            .subscribe(
                result => {
                    this.totalData = result;
                    let maxValue = Math.max(
                        Math.abs(result.income),
                        Math.abs(result.expenses),
                        Math.abs(result.netChange)
                    ) * 1.5;
                    
                    this.totalData.incomePercent = this.getPercentage(maxValue, result.income);
                    this.totalData.expensesPercent = this.getPercentage(maxValue, result.expenses);
                    this.totalData.netChangePercent = this.getPercentage(maxValue, result.netChange);
                },
                e => { this.finishLoading(); },
                () => this.finishLoading()
            );
    }

    getPercentage(maxValue, currValue) {
        return maxValue ? Math.round(currValue / maxValue * 100): 0;
    }

    onValueChanged(value): void {
        let period;
        let groupBy;
        let startDate = moment().utc();
        let endDate = moment().utc();
        switch (value) {
            case this.l('Today'):
                period = 'day';
                groupBy = 'Daily';
                break;
            case this.l('Yesterday'):
                period = 'day';
                groupBy = 'Daily';
                startDate.subtract(1, 'day');
                endDate.subtract(1, 'day');
                break;
            case this.l('This_Week'):
                period = 'week';
                groupBy = 'Weekly';
                break;
            case this.l('This_Month'):
                period = 'month';
                groupBy = 'Monthly';
                break;
            case this.l('Last_Month'):
                period = 'month';
                groupBy = 'Monthly';
                startDate.subtract(1, 'month');
                endDate.subtract(1, 'month');
                break;
            case this.l('This_Year'):
                period = 'year';
                groupBy = 'Yearly';
                break;
            case this.l('Last_Year'):
                period = 'year';
                groupBy = 'Yearly';
                startDate.subtract(1, 'year');
                endDate.subtract(1, 'year');
                break;
            case this.l('All_Periods'):
                period = 'all';
                groupBy = 'Yearly';
                break;
            default:
                period = 'year';
                groupBy = 'Yearly';
                startDate.subtract(1, 'year');
                endDate.subtract(1, 'year');
                break;
        }

        this.startDate = period !== 'all' ? startDate.startOf(period) : undefined;
        this.endDate = period !== 'all' ? endDate.endOf(period) : undefined;
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

    filterByBankAccounts(bankAccountIds: number[]) {
        this.bankAccountIds = bankAccountIds;
        this.loadStatsData();
    }

}
