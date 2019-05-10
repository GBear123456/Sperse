/** Core imports */
import { Component, Injector, OnInit, Input, ViewChild } from '@angular/core';

/** Third party imports */
import { mergeMap, scan, tap, switchMap } from 'rxjs/operators';

/** */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { DashboardService } from '../dashboard.service';
import { DxChartComponent } from 'devextreme-angular/ui/chart';
import {
    BankAccountsServiceProxy,
    GroupBy,
    InstanceType
} from '@shared/service-proxies/service-proxies';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';

@Component({
    selector: 'app-totals-by-period',
    templateUrl: './totals-by-period.component.html',
    styleUrls: ['./totals-by-period.component.less'],
    providers: [BankAccountsServiceProxy]
})
export class TotalsByPeriodComponent extends CFOComponentBase implements OnInit {
    @ViewChild(DxChartComponent) chartComponent: DxChartComponent;
    @Input() waitForBankAccounts = false;
    @Input() waitForPeriods = false;
    bankAccountIds: number[] = [];
    totalData: any;
    selectedPeriod: any = String(GroupBy['Yearly']).toLowerCase();
    startDate;
    endDate;
    creditColor = '#35bd9f';
    debitColor = '#f2526a';
    netChangeColor = '#35c8a8';
    loading = true;
    allPeriodLocalizationValue = this.l('All_Periods');
    currentPeriod: string;

    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        private _bankAccountService: BankAccountsServiceProxy,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);

        _dashboardService.subscribePeriodChange(
            this.onValueChanged.bind(this));
    }

    loadStatsData() {
        if (!this.waitForBankAccounts && !this.waitForPeriods) {
            this.startLoading();
            this.cfoPreferencesService.getCurrencyId().pipe(
                switchMap((currencyId: string) => this._bankAccountService.getStats(
                    InstanceType[this.instanceType],
                    this.instanceId,
                    currencyId,
                    undefined,
                    this.bankAccountIds,
                    this.startDate,
                    this.endDate,
                    this.selectedPeriod
                )),
                tap(result => {
                    if (!result || !result.length) {
                        this.totalData = null;
                    }
                }),
                mergeMap(x => x),
                scan((prevStatsItem, currentStatsItem: any) => {
                    let credit = currentStatsItem.credit + prevStatsItem.credit;
                    let debit = currentStatsItem.debit + prevStatsItem.debit;
                    let adjustments = currentStatsItem.adjustments + prevStatsItem.adjustments;
                    let startingBalanceAdjustments = currentStatsItem.startingBalanceAdjustments + prevStatsItem.startingBalanceAdjustments;
                    return {
                        'startingBalance': prevStatsItem.hasOwnProperty('startingBalance') ? prevStatsItem['startingBalance'] : currentStatsItem.startingBalance - currentStatsItem.startingBalanceAdjustments,
                        'endingBalance': currentStatsItem.endingBalance,
                        'credit': credit,
                        'debit': debit,
                        'adjustments': adjustments,
                        'startingBalanceAdjustments': startingBalanceAdjustments,
                        'netChange': credit - Math.abs(debit),
                        'date': currentStatsItem.date
                    };
                }, {
                    'credit': 0,
                    'debit': 0,
                    'netChange': 0,
                    'adjustments': 0,
                    'startingBalance': 0,
                    'endingBalance': 0,
                    'startingBalanceAdjustments': 0,
                    'date': 'date'
                })
            ).subscribe(
            result => {
                this.totalData = result;
                let maxValue = Math.max(
                    Math.abs(result.credit),
                    Math.abs(result.debit),
                    Math.abs(result.netChange)
                );
                this.totalData.creditPercent = this.getPercentage(maxValue, result.credit);
                this.totalData.debitPercent = this.getPercentage(maxValue, result.debit);
                this.totalData.netChangePercent = this.getPercentage(maxValue, result.netChange);
                setTimeout(() => { this.render(); }, 300);
            },
            e => { this.finishLoading(); },
            () => this.finishLoading()
            );
        }
    }

    getPercentage(maxValue, currValue) {
        return maxValue ? Math.round(Math.abs(currValue) / maxValue * 100) : 0;
    }

    onValueChanged(period): void {
        let groupBy;
        switch (period.name) {
            case this.l('Today'):
                groupBy = 'Daily';
                break;
            case this.l('Yesterday'):
                groupBy = 'Daily';
                break;
            case this.l('This_Week'):
                groupBy = 'Weekly';
                break;
            case this.l('This_Month'):
                groupBy = 'Monthly';
                break;
            case this.l('Last_Month'):
                groupBy = 'Monthly';
                break;
            case this.l('This_Year'):
                groupBy = 'Yearly';
                break;
            case this.l('Last_Year'):
                groupBy = 'Yearly';
                break;
            case this.l('All_Periods'):
                groupBy = 'Yearly';
                break;
            default:
                groupBy = 'Yearly';
                break;
        }

        this.startDate = period.from ? period.from.startOf('day') : null;
        this.endDate = period.to ? period.to.startOf('day') : null;

        this.selectedPeriod = String(GroupBy[groupBy]).toLowerCase();
        this.waitForPeriods = false;
        this.loadStatsData();
    }

    customizeText = (pointInfo: any) => {
        if (this.totalData[0].credit - this.totalData[0].debit < 0) {
            return '-' + pointInfo.valueText;
        } else {
            return pointInfo.valueText;
        }
    }

    filterByBankAccounts(bankAccountIds: number[]) {
        this.waitForBankAccounts = false;
        this.bankAccountIds = bankAccountIds;
        this.loadStatsData();
    }

    render() {
        if (this.chartComponent)
            this.chartComponent.instance.render();
    }
}
