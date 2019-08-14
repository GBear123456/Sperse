/** Core imports */
import { Component, Injector, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

/** Third party libraries */
import { Store, select } from '@ngrx/store';
import * as moment from 'moment';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { first, filter, finalize, switchMap, takeUntil, map, mapTo, tap, catchError } from 'rxjs/operators';

/** Application imports */
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import {
    DashboardServiceProxy,
    GetDailyBalanceStatsOutput,
    InstanceType
} from 'shared/service-proxies/service-proxies';
import { DashboardService } from '../dashboard.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { CurrenciesStoreSelectors } from '@app/cfo/store';
import { CfoStore } from '@app/cfo/store';
import { AccountTotals } from '@shared/service-proxies/service-proxies';
import { DailyStatsPeriodModel } from '@shared/cfo/dashboard-widgets/accounts/daily-stats-period.model';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    selector: 'app-accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less'],
    providers: [ DashboardServiceProxy, LifecycleSubjectsService ]
})
export class AccountsComponent extends CFOComponentBase implements OnInit {
    @ViewChild('networth') networth: ElementRef;
    @ViewChild('dailyStats') dailyStats: ElementRef;
    @Output() onTotalAccountsMouseEnter: EventEmitter<any> = new EventEmitter();
    accountsData$: Observable<AccountTotals>;
    dailyStatsToggleValues: any[] = [
        this.l('Highest'),
        this.l('Average'),
        this.l('Lowest')
    ];

    startDate: moment.Moment = null;
    endDate: moment.Moment = moment().utc().startOf('day');
    dailyStatsAmount$: Observable<number>;
    dailyStatsText$: Observable<string>;
    dailyStatsSliderSelected: BehaviorSubject<number> = new BehaviorSubject<number>(1);
    dailyStatsSliderSelected$: Observable<number> = this.dailyStatsSliderSelected.asObservable();
    currencyId$ = this.store$.pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId), filter(Boolean));
    bankAccountIds$: Observable<number[]> = this.bankAccountsService.selectedBankAccountsIds$;
    period$ = this._dashboardService.dailyStatsPeriod$;

    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        private _dashboardProxy: DashboardServiceProxy,
        private _loadingService: LoadingService,
        private _lifeCycleService: LifecycleSubjectsService,
        private store$: Store<CfoStore.State>,
        public bankAccountsService: BankAccountsService,
        public cfoPreferencesService: CfoPreferencesService,
    ) {
        super(injector);
    }

    ngOnInit() {
        this.accountsData$ = combineLatest(
            this.currencyId$,
            this.bankAccountIds$,
            this._dashboardService.refresh$
        ).pipe(
            takeUntil(this.destroy$),
            switchMap((data) => this.componentIsActivated ? of(data) : this._lifeCycleService.activate$.pipe(first(), mapTo(data))),
            tap(() => this._loadingService.startLoading(this.networth.nativeElement)),
            switchMap(([currencyId, bankAccountIds]: [ string, number[]]) => {
                return this._dashboardProxy.getAccountTotals(
                    InstanceType[this.instanceType],
                    this.instanceId,
                    bankAccountIds,
                    currencyId
                ).pipe(
                    catchError(() => of(new AccountTotals())),
                    finalize(() => this._loadingService.finishLoading(this.networth.nativeElement))
                );
            })
        );

        const dailyStatsData$: Observable<GetDailyBalanceStatsOutput> = combineLatest(
            this.currencyId$,
            this.bankAccountIds$,
            this.period$,
            this._dashboardService.refresh$
        ).pipe(
            takeUntil(this.destroy$),
            switchMap((data) => this.componentIsActivated ? of(data) : this._lifeCycleService.activate$.pipe(first(), mapTo(data))),
            tap(() => this._loadingService.startLoading(this.dailyStats.nativeElement)),
            switchMap(([currencyId, bankAccountIds, period]: [string, number[], DailyStatsPeriodModel]) => {
                return this._dashboardProxy.getDailyBalanceStats(
                    InstanceType[this.instanceType],
                    this.instanceId,
                    bankAccountIds,
                    currencyId,
                    period.startDate,
                    period.endDate
                ).pipe(
                    catchError(() => of(new GetDailyBalanceStatsOutput())),
                    finalize(() => this._loadingService.finishLoading(this.dailyStats.nativeElement))
                );
            })
        );

        this.dailyStatsAmount$ = combineLatest(
            dailyStatsData$,
            this.dailyStatsSliderSelected$
        ).pipe(
            map(([dailyStatsData, dailyStatsSliderSelected]: [GetDailyBalanceStatsOutput, number]) => {
                return this.getDailyStatsAmount(dailyStatsData, dailyStatsSliderSelected);
            })
        );

        this.dailyStatsText$ = this.dailyStatsSliderSelected$.pipe(
            map((dailyStatsSliderSelected: number) => {
                return this.l(this.dailyStatsToggleValues[dailyStatsSliderSelected]) + ' ' + this.l('Balance');
            })
        );
    }

    totalAccountsMouseEnter() {
        this.onTotalAccountsMouseEnter.emit();
    }

    changeDailyStatsToggleValue(index) {
        this.dailyStatsSliderSelected.next(index);
    }

    getDailyStatsAmount(dailyStatsData: GetDailyBalanceStatsOutput, dailyStatsSliderSelected: number): number {
        return [
            dailyStatsData.maxBalance,
            dailyStatsData.avarageBalance,
            dailyStatsData.minBalance
        ][dailyStatsSliderSelected];
    }

    activate() {
        this._lifeCycleService.activate.next();
    }
}
