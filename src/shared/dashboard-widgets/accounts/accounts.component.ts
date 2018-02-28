import { Component, Injector, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CFOComponentBase } from 'app/cfo/shared/common/cfo-component-base';
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

    accountsData: any;
    bankAccountIds: number[] = [];

    dailyStatsData: GetDailyBalanceStatsOutput;
    dailyStatsAmount: number;
    dailyStatsText: string;
    dailyStatsSliderSelected: number = 1;
    availablePeriods = [
        this.l('Last_Month'),
        this.l('Last_Year'),
        this.l('All_Periods')
    ];
    dailyStatsToggleValues: any[] = [
        this.l('Minimum'),
        this.l('Average'),
        this.l('Maximum')
    ];

    constructor(
        injector: Injector,
        private _dashboardService: DashboardServiceProxy,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnInit() {
        this.getAccountTotals();
        this.onDailyStatsPeriodChanged({
            value: this.l('Last_Month')
        });
    }

    getAccountTotals(): void {
        this._dashboardService.getAccountTotals(InstanceType[this.instanceType], this.instanceId, this.bankAccountIds)
            .subscribe((result) => {
                this.accountsData = result;
            });
    }

    getDailyStats(startDate: moment.Moment, endDate: moment.Moment): void {
        this._dashboardService.getDailyBalanceStats(InstanceType[this.instanceType], this.instanceId, this.bankAccountIds, startDate, endDate)
            .subscribe(result => {
                this.dailyStatsData = result;
                this.setDailyStatsAmount();
            });
    }

    navigateTo() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']);
    }

    filterByBankAccounts(bankAccountIds: number[]) {
        this.bankAccountIds = bankAccountIds;
        this.getAccountTotals();
    }

    totalAccountsMouseenter() {
        this.onTotalAccountsMouseenter.emit();
    }

    onDailyStatsPeriodChanged($event) {
        let startDate: moment.Moment = moment().utc();
        let endDate: moment.Moment = moment().utc();

        switch ($event.value) {
            case this.l('Last_Month'):
                startDate.subtract(1, 'month').startOf('month');
                endDate = startDate.clone().endOf('month');
                break;
            case this.l('Last_Year'):
                startDate.subtract(1, 'year').startOf('year');
                endDate = startDate.clone().endOf('year');
                break;
            case this.l('All_Periods'):
                startDate = null;
                break; 
        }

        this.getDailyStats(startDate, endDate);
    }

    setDailyStatsAmount(): void {
        switch (this.dailyStatsSliderSelected) {
            case 0:
                this.dailyStatsAmount = this.dailyStatsData.minBalance;
                break;
            case 1:
                this.dailyStatsAmount = this.dailyStatsData.avarageBalance;
                break;
            case 2:
                this.dailyStatsAmount = this.dailyStatsData.maxBalance;
                break;
        }

        this.dailyStatsText = this.l('Daily_Balance', this.l(this.dailyStatsToggleValues[this.dailyStatsSliderSelected]));
    }
}
