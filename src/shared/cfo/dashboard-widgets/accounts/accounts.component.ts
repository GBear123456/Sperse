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
import { RootStore, CurrenciesStoreSelectors } from '@root/store';
import { AccountTotals } from '@shared/service-proxies/service-proxies';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { CalendarValuesModel } from '../../../common/widgets/calendar/calendar-values.model';
import { DateHelper } from '@shared/helpers/DateHelper';
import { CalendarService } from '@app/shared/common/calendar-button/calendar.service';

@Component({
    selector: 'app-accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less'],
    providers: [ DashboardServiceProxy, LifecycleSubjectsService ]
})
export class AccountsComponent extends CFOComponentBase implements OnInit {
    @ViewChild('networth', { static: true }) networth: ElementRef;
    @ViewChild('dailyStats', { static: true }) dailyStats: ElementRef;
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
    period$: Observable<CalendarValuesModel> = this.calendarService.dateRange$;

    constructor(
        injector: Injector,
        private dashboardService: DashboardService,
        private dashboardProxy: DashboardServiceProxy,
        private lifeCycleService: LifecycleSubjectsService,
        private store$: Store<RootStore.State>,
        private calendarService: CalendarService,
        public bankAccountsService: BankAccountsService,
        public cfoPreferencesService: CfoPreferencesService,
    ) {
        super(injector);
    }

    ngOnInit() {
        this.accountsData$ = combineLatest(
            this.currencyId$,
            this.bankAccountIds$,
            this.dashboardService.refresh$
        ).pipe(
            takeUntil(this.destroy$),
            switchMap((data) => this.componentIsActivated ? of(data) : this.lifeCycleService.activate$.pipe(first(), mapTo(data))),
            tap(() => this.loadingService.startLoading(this.networth.nativeElement)),
            switchMap(([currencyId, bankAccountIds, ]: [ string, number[], null]) => {
                return this.dashboardProxy.getAccountTotals(
                    InstanceType[this.instanceType],
                    this.instanceId,
                    bankAccountIds,
                    currencyId
                ).pipe(
                    catchError(() => of(new AccountTotals())),
                    finalize(() => this.loadingService.finishLoading(this.networth.nativeElement))
                );
            })
        );

        const dailyStatsData$: Observable<GetDailyBalanceStatsOutput> = combineLatest(
            this.currencyId$,
            this.bankAccountIds$,
            this.period$,
            this.dashboardService.refresh$
        ).pipe(
            takeUntil(this.destroy$),
            switchMap((data) => this.componentIsActivated ? of(data) : this.lifeCycleService.activate$.pipe(first(), mapTo(data))),
            tap(() => this.loadingService.startLoading(this.dailyStats.nativeElement)),
            switchMap(([currencyId, bankAccountIds, period,]: [string, number[], CalendarValuesModel, null]) => {
                return this.dashboardProxy.getDailyBalanceStats(
                    InstanceType[this.instanceType],
                    this.instanceId,
                    bankAccountIds && bankAccountIds.length ? bankAccountIds.join('_') : undefined,
                    currencyId,
                    DateHelper.getStartDate(period.from.value),
                    DateHelper.getEndDate(period.to.value)
                ).pipe(
                    catchError(() => of(new GetDailyBalanceStatsOutput())),
                    finalize(() => this.loadingService.finishLoading(this.dailyStats.nativeElement))
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
        this.lifeCycleService.activate.next();
    }
}
