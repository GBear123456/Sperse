/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable, ReplaySubject, combineLatest, of } from 'rxjs';
import { catchError, finalize, switchMap, map, tap } from 'rxjs/operators';

/** Application imports */
import { DashboardServiceProxy, ContactStarColorType } from 'shared/service-proxies/service-proxies';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { GetTotalsOutput } from '@shared/service-proxies/service-proxies';
import { CacheService } from '@node_modules/ng2-cache-service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { PeriodService } from '@app/shared/common/period/period.service';
import { AppPermissions } from '@shared/AppPermissions';
import { Period } from '@app/shared/common/period/period.enum';

@Injectable()
export class DashboardWidgetsService  {
    private _period: BehaviorSubject<PeriodModel> = new BehaviorSubject<PeriodModel>(this.periodService.selectedPeriod);
    private _totalsData: ReplaySubject<GetTotalsOutput> = new ReplaySubject<GetTotalsOutput>(1);
    totalsData$: Observable<GetTotalsOutput> = this._totalsData.asObservable();
    totalsDataAvailable$: Observable<boolean> = this.totalsData$.pipe(
        map((totalsData: GetTotalsOutput) => !!(totalsData.totalOrderAmount || totalsData.totalLeadCount || totalsData.totalClientCount))
    );
    private totalsDataLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    totalsDataLoading$: Observable<boolean> = this.totalsDataLoading.asObservable();
    public period$: Observable<PeriodModel> = this._period.asObservable();
    private isGrantedCustomers = this.permissionService.isGranted(AppPermissions.CRMCustomers);
    totalsDataFields = [
        {
            title: 'Sales',
            color: '#8487e7',
            name: 'totalOrderAmount',
            type: 'currency',
            percent:  '0%',
            visible: this.isGrantedCustomers ||
                this.permissionService.isGranted(AppPermissions.CRMOrders)
        }, {
            title: 'Leads',
            color: '#00aeef',
            name: 'totalLeadCount',
            type: 'number',
            percent: '0%',
            visible: this.isGrantedCustomers
       }, {
           title: 'Clients',
           color: '#f4ae55',
           name: 'totalClientCount',
           type: 'number',
           percent: '0%',
           visible: this.isGrantedCustomers
       }];
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this._refresh.asObservable();

    private _starColorTypes = {
        Yellow: 'rgb(230, 230, 0)',
        Blue: 'blue',
        Green: 'green',
        Purple: 'purple',
        Red: 'red',
        Gradient1: ['#24c26c', '#5ac860'],
        Gradient2: ['#82cc57', '#b1d049'],
        Gradient3: ['#f0eb56', '#ffc800'],
        Gradient4: ['#f3852a', '#e14617'],
        Gradient5: '#959595'
    };

    constructor(
        private permissionService: AppPermissionService,
        private dashboardServiceProxy: DashboardServiceProxy,
        private cacheService: CacheService,
        private ls: AppLocalizationService,
        private periodService: PeriodService
    ) {
        combineLatest(
            this.period$,
            this.refresh$
        ).pipe(
            tap(() => this.totalsDataLoading.next(true)),
            switchMap(([period]: [PeriodModel]) => this.dashboardServiceProxy.getTotals(period && period.from, period && period.to).pipe(
                catchError(() => of(new GetTotalsOutput())),
                finalize(() => this.totalsDataLoading.next(false))
            )),
        ).subscribe((totalData: GetTotalsOutput) => {
            this._totalsData.next(totalData);
        });
    }

    getStarColorByType(type: ContactStarColorType, gradient = false) {
        let colors: any = this._starColorTypes[type];
        if (colors && colors.join)
            return gradient ? 'linear-gradient(' + colors.join(',') + ')' : colors.shift();
        else
            return colors;
    }

    refresh() {
        this._refresh.next(null);
    }

    periodChanged(period: Period) {
        this._period.next(this.periodService.getDatePeriod(period));
    }

    getPercentage(value, total) {
        return (total ? Math.round(value / total * 100) : 0)  + '%';
    }

}
