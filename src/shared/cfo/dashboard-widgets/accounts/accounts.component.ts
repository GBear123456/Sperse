import { Component, Injector, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../dashboard.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { DashboardServiceProxy, InstanceType, GetDailyBalanceStatsOutput } from 'shared/service-proxies/service-proxies';
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
    @Input() waitForPeriods = false;

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
    isActive = null;
    visibleAccountCount = 0;

    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        private _dashboardProxy: DashboardServiceProxy
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
        if (!this.waitForBankAccounts && !this.waitForPeriods) {
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

    filterByBankAccounts(bankAccountData) {
        this.waitForBankAccounts = false;
        this.isActive = bankAccountData.isActive;
        this.visibleAccountCount = bankAccountData.visibleAccountCount;
        this.bankAccountIds = bankAccountData.bankAccountIds;
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

    onDailyStatsPeriodChanged(period) {
        let currentDate = moment().utc().startOf('day');

        if (period) {
            this.startDate = period.from ? period.from.startOf('day') : null;
            this.endDate = period.to ? period.to.startOf('day') : null;

            this.endDate = !this.endDate || currentDate.isBefore(this.endDate) ? currentDate : this.endDate;
            this.startDate = this.startDate && this.endDate.isBefore(this.startDate) ? this.endDate : this.startDate;
        } else {
            this.startDate = null;
            this.endDate = currentDate;
        }

        this.waitForPeriods = false;
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
        this.dailyStatsAmountInteger = (this.dailyStatsAmount < 0 ? -1 : 1) * Math.floor(Math.abs(this.dailyStatsAmount));
        this.dailyStatsAmountFloat = '.' + this.dailyStatsAmount.toFixed(2).split('.')[1];
    }
}
