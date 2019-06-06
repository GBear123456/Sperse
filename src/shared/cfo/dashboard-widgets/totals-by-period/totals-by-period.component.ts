/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { select, Store } from '@ngrx/store';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import {
    filter,
    first,
    finalize,
    map,
    mapTo,
    mergeMap,
    scan,
    tap,
    switchMap,
    takeUntil,
    publishReplay,
    refCount
} from 'rxjs/operators';

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
import { PeriodModel } from '@app/shared/common/period/period.model';
import {
    CfoStore,
    CurrenciesStoreSelectors,
    ForecastModelsStoreActions
} from '@app/cfo/store';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { TotalDataModel } from '@shared/cfo/dashboard-widgets/totals-by-period/total-data.model';

@Component({
    selector: 'app-totals-by-period',
    templateUrl: './totals-by-period.component.html',
    styleUrls: ['./totals-by-period.component.less'],
    providers: [ BankAccountsServiceProxy, LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalsByPeriodComponent extends CFOComponentBase implements OnInit {
    @ViewChild(DxChartComponent) chartComponent: DxChartComponent;
    bankAccountIds$: Observable<number[]> = this._bankAccountService.selectedBankAccountsIds$;
    totalData$: Observable<TotalDataModel>;
    totalData: TotalDataModel;
    startDate;
    endDate;
    creditColor = '#35bd9f';
    debitColor = '#f2526a';
    netChangeColor = '#35c8a8';
    loading = true;
    allPeriodLocalizationValue = this.l('All_Periods');
    currentPeriod: string;
    period$: Observable<any> = this._dashboardService.period$.pipe(
        map((period: PeriodModel) => {
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
            return {
                startDate: period.from ? period.from.startOf('day') : null,
                endDate: period.to ? period.to.startOf('day') : null,
                selectedPeriod: String(GroupBy[groupBy]).toLowerCase(),
            };
        })
    );
    refresh$: Observable<null> = this._dashboardService.refresh$;
    currencyId$ = this.store$.pipe(
        select(CurrenciesStoreSelectors.getSelectedCurrencyId),
        filter(Boolean)
    );
    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        private _bankAccountServiceProxy: BankAccountsServiceProxy,
        private _bankAccountService: BankAccountsService,
        private _lifeCycleService: LifecycleSubjectsService,
        private _changeDetectorRef: ChangeDetectorRef,
        public cfoPreferencesService: CfoPreferencesService,
        private store$: Store<CfoStore.State>,
    ) {
        super(injector);
    }

    ngOnInit() {
        this.store$.dispatch(new ForecastModelsStoreActions.LoadRequestAction());
        this.loadStatsData();
    }

    private loadStatsData() {
        this.totalData$ = combineLatest(
            this.refresh$,
            this.period$,
            this.currencyId$,
            this.bankAccountIds$
        ).pipe(
            switchMap((data) => this.componentIsActivated ? of(data) : this._lifeCycleService.activate$.pipe(first(), mapTo(data))),
            tap(() => this.startLoading()),
            switchMap(([, period, currencyId, bankAccountIds]: [null, any, string, number[]]) => this._bankAccountServiceProxy.getStats(
                InstanceType[this.instanceType],
                this.instanceId,
                currencyId,
                undefined,
                bankAccountIds,
                period.startDate,
                period.endDate,
                period.selectedPeriod
            ).pipe(finalize(() => {
                this.finishLoading();
                this._changeDetectorRef.detectChanges();
            }))),
            tap(result => {
                if (!result || !result.length) {
                    this.totalData = null;
                    this._changeDetectorRef.detectChanges();
                }
            }),
            mergeMap(x => x),
            scan(
                (prevStatsItem, currentStatsItem: any) => {
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
                },
                {
                    'credit': 0,
                    'debit': 0,
                    'netChange': 0,
                    'adjustments': 0,
                    'startingBalance': 0,
                    'endingBalance': 0,
                    'startingBalanceAdjustments': 0,
                    'date': 'date'
                }
            ),
            map((totalData: TotalDataModel) => {
                const maxValue = Math.max(
                    Math.abs(totalData.credit),
                    Math.abs(totalData.debit),
                    Math.abs(totalData.netChange)
                );
                totalData['creditPercent'] = this.getPercentage(maxValue, totalData.credit);
                totalData['debitPercent'] = this.getPercentage(maxValue, totalData.debit);
                totalData['netChangePercent'] = this.getPercentage(maxValue, totalData.netChange);
                return totalData;
            }),
            publishReplay(),
            refCount()
        );
        this.totalData$.pipe(takeUntil(this.destroy$)).subscribe((totalData: TotalDataModel) => {
            this.totalData = totalData;
            this._changeDetectorRef.detectChanges();
        });
    }

    getPercentage(maxValue, currValue) {
        return maxValue ? Math.round(Math.abs(currValue) / maxValue * 100) : 0;
    }

    customizeText = (pointInfo: any) => {
        if (this.totalData[0].credit - this.totalData[0].debit < 0) {
            return '-' + pointInfo.valueText;
        } else {
            return pointInfo.valueText;
        }
    }

    activate() {
        this._lifeCycleService.activate.next();
    }
}
