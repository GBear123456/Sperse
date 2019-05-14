/** Core imports */
import { Component, Injector, OnInit, Output, EventEmitter } from '@angular/core';

/** Third party libraries */
import * as moment from 'moment';
import { finalize, switchMap } from 'rxjs/operators';

/** Application imports */
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { DashboardServiceProxy, InstanceType, GetDailyBalanceStatsOutput } from 'shared/service-proxies/service-proxies';
import { DashboardService } from '../dashboard.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';

@Component({
    selector: 'app-accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less'],
    providers: [ DashboardServiceProxy ]
})
export class AccountsComponent extends CFOComponentBase implements OnInit {
    @Output() onTotalAccountsMouseenter: EventEmitter<any> = new EventEmitter();

    accountsData: any;
    bankAccountIds: number[] = [];

    dailyStatsToggleValues: any[] = [
        this.l('Highest'),
        this.l('Average'),
        this.l('Lowest')
    ];

    startDate: moment.Moment = null;
    endDate: moment.Moment;
    dailyStatsData: any/*GetDailyBalanceStatsOutput*/;
    dailyStatsAmount: number;
    dailyStatsText: string;
    dailyStatsSliderSelected = 1;
    isActive = null;
    visibleAccountCount = 0;

    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        private _dashboardProxy: DashboardServiceProxy,
        public bankAccountsService: BankAccountsService,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);

        this.endDate = moment().utc().startOf('day');

        this._dashboardService.subscribePeriodChange(
            this.onDailyStatsPeriodChanged.bind(this));
    }

    ngOnInit() {
        this.getAccountTotals();
    }

    getAccountTotals(): void {
        this.cfoPreferencesService.getCurrencyId().pipe(
            switchMap((currencyId: string) => this._dashboardProxy.getAccountTotals(InstanceType[this.instanceType], this.instanceId, this.bankAccountIds, currencyId))
        ).subscribe((result) => {
            this.accountsData = result;
        });
    }

    getDailyStats(): void {
        this.startLoading();
        this.cfoPreferencesService.getCurrencyId().pipe(
            switchMap((currencyId: string) => this._dashboardProxy.getDailyBalanceStats(InstanceType[this.instanceType], this.instanceId, this.bankAccountIds, this.startDate, this.endDate, currencyId)),
            finalize(() => this.finishLoading())
        ).subscribe(result => {
            this.dailyStatsData = result;
            this.setDailyStatsAmount();
        });
    }

    navigateTo() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']);
    }

    filterByBankAccounts(bankAccountData) {
        //this.waitForBankAccounts = false;
        this.isActive = bankAccountData.isActive;
        this.visibleAccountCount = bankAccountData.visibleAccountCount;
        this.bankAccountIds = bankAccountData.selectedBankAccountIds;
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

        //this.waitForPeriods = false;
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
    }
}
