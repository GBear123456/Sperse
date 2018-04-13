import { Component, Injector, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../dashboard.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { DashboardServiceProxy, InstanceType, GetDailyBalanceStatsOutput } from 'shared/service-proxies/service-proxies';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Component({
    selector: 'app-accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less'],
    providers: [DashboardServiceProxy]
})
export class AccountsComponent extends CFOComponentBase implements OnInit {
    @Output() onTotalAccountsMouseenter: EventEmitter<any> = new EventEmitter();
    @Input() waitForBankAccounts = false;

    accountsData: any;
    bankAccountIds: number[] = [];

    dailyStatsToggleValues: any[] = [
        this.l('Highest'),
        this.l('Average'),
        this.l('Lowest')
    ];

    startDate: moment.Moment = null;
    endDate: moment.Moment;
    dailyStatsData: GetDailyBalanceStatsOutput;
    dailyStatsAmount: number;
    dailyStatsAmountFloat: string;
    dailyStatsAmountInteger: number;
    dailyStatsText: string;
    dailyStatsSliderSelected = 1;
    dailyStatsPeriodSelected: string = this.l('All_Periods');

    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        private _dashboardProxy: DashboardServiceProxy,
        private _router: Router
    ) {
        super(injector);

        this.endDate = moment().utc().startOf('day');

        _dashboardService.subscribePeriodChange(
            this.onDailyStatsPeriodChanged.bind(this));
    }

    ngOnInit() {
        this.getAccountTotals();
    }

    getAccountTotals(): void {
        if (!this.waitForBankAccounts) {
            this._dashboardProxy.getAccountTotals(InstanceType[this.instanceType], this.instanceId, this.bankAccountIds)
                .subscribe((result) => {
                    this.accountsData = result;
                });
        }
    }

    getDailyStats(): void {
        if (!this.waitForBankAccounts) {
            this.startLoading();
            this._dashboardProxy.getDailyBalanceStats(InstanceType[this.instanceType], this.instanceId, this.bankAccountIds, this.startDate, this.endDate)
                .subscribe(result => {
                    this.dailyStatsData = result;
                    this.setDailyStatsAmount();
                }, () => this.finishLoading(),
                () => this.finishLoading());
        }
    }

    navigateTo() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']);
    }

    filterByBankAccounts(bankAccountIds: number[]) {
        this.waitForBankAccounts = false;
        this.bankAccountIds = bankAccountIds;
        this.getAccountTotals();

        this.getDailyStats();
    }

    totalAccountsMouseenter() {
        this.onTotalAccountsMouseenter.emit();
    }

    changeDailyStatsToggleValue(index) {
        this.dailyStatsSliderSelected = index;
        this.setDailyStatsAmount();
    }

    onDailyStatsPeriodChanged(value = '') {
        let startDate: moment.Moment = moment().utc();
        let endDate: moment.Moment = moment().utc();

        switch (value) {
            case this.l('Today'):
                startDate.startOf('day');
                endDate.startOf('day');
                break;
            case this.l('Yesterday'):
                startDate.subtract(1, 'day').startOf('day');
                endDate.subtract(1, 'day').endOf('day');
                break;
            case this.l('This_Week'):
                startDate.startOf('week');
                endDate.startOf('day');
                break;
            case this.l('This_Month'):
                startDate.startOf('month');
                endDate.startOf('day');
                break;
            case this.l('Last_Month'):
                startDate.subtract(1, 'month').startOf('month');
                endDate = startDate.clone().endOf('month');
                break;
            case this.l('This_Year'):
                startDate.startOf('year');
                endDate.startOf('day');
                break;
            case this.l('Last_Year'):
                startDate.subtract(1, 'year').startOf('year');
                endDate = startDate.clone().endOf('year');
                break;
            default:
                startDate = null;
                endDate.startOf('day');
                break;
        }

        this.startDate = startDate;
        this.endDate = endDate;

        this.getDailyStats();
    }

    setDailyStatsAmount(): void {
        switch (this.dailyStatsSliderSelected) {
            case 0:
                this.dailyStatsAmount = this.dailyStatsData.maxBalance;
                break;
            case 1:
                this.dailyStatsAmount = this.dailyStatsData.avarageBalance;
                break;
            case 2:
                this.dailyStatsAmount = this.dailyStatsData.minBalance;
                break;
        }

        this.dailyStatsText = this.l(this.dailyStatsToggleValues[this.dailyStatsSliderSelected]) + ' ' + this.l('Balance');
        this.dailyStatsAmountInteger = (this.dailyStatsAmount < 0 ? -1: 1) * Math.floor(Math.abs(this.dailyStatsAmount));
        this.dailyStatsAmountFloat = '.' + this.dailyStatsAmount.toFixed(2).split('.')[1];
    }
}
