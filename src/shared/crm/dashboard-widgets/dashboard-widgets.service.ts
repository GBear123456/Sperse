/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Subscription, Observable, ReplaySubject, combineLatest } from 'rxjs';
import { finalize, switchMap, map, tap } from 'rxjs/operators';
import * as moment from 'moment';

/** Application imports */
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { GetTotalsOutput } from '@shared/service-proxies/service-proxies';
import { CacheService } from '@node_modules/ng2-cache-service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Injectable()
export class DashboardWidgetsService  {
    private readonly PERIOD_CACHE_KEY = 'crm.dashboard.selected.period';
    availablePeriods = [
        this._ls.l('Today'),
        this._ls.l('Yesterday'),
        this._ls.l('This_Week'),
        this._ls.l('This_Month'),
        this._ls.l('Last_Month'),
        this._ls.l('This_Year'),
        this._ls.l('Last_Year'),
        this._ls.l('All_Periods')
    ];
    selectedPeriod: string = this._cacheService.exists(this.PERIOD_CACHE_KEY)
                     ? this._cacheService.get(this.PERIOD_CACHE_KEY)
                     : this._ls.l('This_Month') || this.availablePeriods[this.availablePeriods.length - 1];
    private _period: BehaviorSubject<PeriodModel> = new BehaviorSubject<PeriodModel>(this.getDatePeriodFromName(this.selectedPeriod));
    private _totalsData: ReplaySubject<GetTotalsOutput> = new ReplaySubject<GetTotalsOutput>(1);
    totalsData$: Observable<GetTotalsOutput> = this._totalsData.asObservable();
    totalsDataAvailable$: Observable<boolean> = this.totalsData$.pipe(
        map((totalsData: GetTotalsOutput) => !!(totalsData.totalOrderAmount || totalsData.totalLeadCount || totalsData.totalClientCount))
    );
    private totalsDataLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    totalsDataLoading$: Observable<boolean> = this.totalsDataLoading.asObservable();
    private _subscribers: Array<Subscription> = [];
    public period$: Observable<PeriodModel> = this._period.asObservable();
    totalsDataFields = [
        {
            title: 'Sales',
            color: '#8487e7',
            name: 'totalOrderAmount',
            type: 'currency',
            percent:  '0%'
        }, {
            title: 'Leads',
            color: '#00aeef',
            name: 'totalLeadCount',
            type: 'number',
            percent: '0%'
       }, {
           title: 'Clients',
           color: '#f4ae55',
           name: 'totalClientCount',
           type: 'number',
           percent: '0%'
       }];
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this._refresh.asObservable();

    constructor(
        private _dashboardServiceProxy: DashboardServiceProxy,
        private _cacheService: CacheService,
        private _ls: AppLocalizationService
    ) {
        combineLatest(
            this.period$,
            this.refresh$
        ).pipe(
            tap(() => this.totalsDataLoading.next(true)),
            switchMap(([period]: [PeriodModel]) => this._dashboardServiceProxy.getTotals(period && period.from, period && period.to).pipe(finalize(() => this.totalsDataLoading.next(false)))),
        ).subscribe((totalData: GetTotalsOutput) => {
            this._totalsData.next(totalData);
        });
    }

    refresh() {
        this._refresh.next(null);
    }

    periodChanged(period?: PeriodModel) {
        this._period.next(period);
        this._cacheService.set(this.PERIOD_CACHE_KEY, period.name);
    }

    getPercentage(value, total) {
        return (total ? Math.round(value / total * 100) : 0)  + '%';
    }

    getDatePeriodFromName(name: string): PeriodModel {
        let period: string;
        let startDate: moment.Moment = moment();
        let endDate: moment.Moment = moment();
        switch (name) {
            case this._ls.l('Today'):
                period = 'day';
                break;
            case this._ls.l('Yesterday'):
                period = 'day';
                startDate.subtract(1, 'day');
                endDate.subtract(1, 'day');
                break;
            case this._ls.l('This_Week'):
                period = 'week';
                break;
            case this._ls.l('This_Month'):
                period = 'month';
                break;
            case this._ls.l('Last_Month'):
                period = 'month';
                startDate.subtract(1, 'month');
                endDate.subtract(1, 'month');
                break;
            case this._ls.l('This_Year'):
                period = 'year';
                break;
            case this._ls.l('Last_Year'):
                period = 'year';
                startDate.subtract(1, 'year');
                endDate.subtract(1, 'year');
                break;
            case this._ls.l('All_Periods'):
                period = 'all';
                break;
            default:
                period = 'all';
                break;
        }

        return {
            name: name,
            period: period,
            from: period !== 'all' ? startDate.startOf(period) : undefined,
            to: period !== 'all' ? endDate.endOf(period) : undefined
        };
    }

    unsubscribe() {
        this._subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this._subscribers.length = 0;
    }
}
