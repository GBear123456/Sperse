/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable, ReplaySubject, combineLatest, of } from 'rxjs';
import { catchError, finalize, switchMap, map, tap } from 'rxjs/operators';

/** Application imports */
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { GetTotalsOutput } from '@shared/service-proxies/service-proxies';
import { CacheService } from '@node_modules/ng2-cache-service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PeriodService } from '@app/shared/common/period/period.service';

@Injectable()
export class DashboardWidgetsService  {
    private _period: BehaviorSubject<PeriodModel> = new BehaviorSubject<PeriodModel>(this._periodService.selectedPeriod);
    private _totalsData: ReplaySubject<GetTotalsOutput> = new ReplaySubject<GetTotalsOutput>(1);
    totalsData$: Observable<GetTotalsOutput> = this._totalsData.asObservable();
    totalsDataAvailable$: Observable<boolean> = this.totalsData$.pipe(
        map((totalsData: GetTotalsOutput) => !!(totalsData.totalOrderAmount || totalsData.totalLeadCount || totalsData.totalClientCount))
    );
    private totalsDataLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    totalsDataLoading$: Observable<boolean> = this.totalsDataLoading.asObservable();
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
        private _ls: AppLocalizationService,
        private _periodService: PeriodService
    ) {
        combineLatest(
            this.period$,
            this.refresh$
        ).pipe(
            tap(() => this.totalsDataLoading.next(true)),
            switchMap(([period]: [PeriodModel]) => this._dashboardServiceProxy.getTotals(period && period.from, period && period.to).pipe(
                catchError(() => of(new GetTotalsOutput())),
                finalize(() => this.totalsDataLoading.next(false))
            )),
        ).subscribe((totalData: GetTotalsOutput) => {
            this._totalsData.next(totalData);
        });
    }

    refresh() {
        this._refresh.next(null);
    }

    periodChanged(period: string) {
        this._period.next(this._periodService.getDatePeriodFromName(period));
    }

    getPercentage(value, total) {
        return (total ? Math.round(value / total * 100) : 0)  + '%';
    }

}
