/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable, ReplaySubject, combineLatest, of } from 'rxjs';
import { catchError, finalize, switchMap, map, tap } from 'rxjs/operators';
import * as moment from 'moment';

/** Application imports */
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { GetTotalsOutput } from '@shared/service-proxies/service-proxies';
import { CacheService } from '@node_modules/ng2-cache-service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { PeriodService } from '@app/shared/common/period/period.service';
import { AppPermissions } from '@shared/AppPermissions';
import { LayoutService } from '@app/shared/layout/layout.service';
import { CalendarService } from '@app/shared/common/calendar-button/calendar.service';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { DateHelper } from '@shared/helpers/DateHelper';

@Injectable()
export class DashboardWidgetsService  {
    public period$: Observable<PeriodModel> = this.calendarService.dateRange$.pipe(
        map((dateRange: CalendarValuesModel) => {
            return dateRange.period
                    ? this.periodService.getDatePeriod(dateRange.period)
                    : {
                        from: DateHelper.removeTimezoneOffset(new Date(dateRange.from.value.getTime()), true, 'from'),
                        to: DateHelper.removeTimezoneOffset(new Date(dateRange.to.value.getTime()), true, 'to')
                    } as PeriodModel;
            }
        )
    );
    private _totalsData: ReplaySubject<GetTotalsOutput> = new ReplaySubject<GetTotalsOutput>(1);
    totalsData$: Observable<GetTotalsOutput> = this._totalsData.asObservable();
    totalsDataAvailable$: Observable<boolean> = this.totalsData$.pipe(
        map((totalsData: GetTotalsOutput) => !!(totalsData.totalOrderAmount || totalsData.totalLeadCount || totalsData.totalClientCount))
    );
    private totalsDataLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    totalsDataLoading$: Observable<boolean> = this.totalsDataLoading.asObservable();
    private isGrantedCustomers = this.permissionService.isGranted(AppPermissions.CRMCustomers);
    totalsDataFields = [
        {
            title: 'Sales',
            color: this.layoutService.getLayoutColor('totalSales'),
            name: 'totalOrderAmount',
            type: 'currency',
            percent:  '0%',
            visible: this.isGrantedCustomers ||
                this.permissionService.isGranted(AppPermissions.CRMOrders)
        }, {
            title: 'Leads',
            color: this.layoutService.getLayoutColor('totalLeads'),
            name: 'totalLeadCount',
            type: 'number',
            percent: '0%',
            visible: this.isGrantedCustomers
       }, {
           title: 'Clients',
           color: this.layoutService.getLayoutColor('totalClients'),
           name: 'totalClientCount',
           type: 'number',
           percent: '0%',
           visible: this.isGrantedCustomers
       }];
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this._refresh.asObservable();

    constructor(
        private permissionService: AppPermissionService,
        private dashboardServiceProxy: DashboardServiceProxy,
        private cacheService: CacheService,
        private ls: AppLocalizationService,
        private periodService: PeriodService,
        private layoutService: LayoutService,
        private calendarService: CalendarService
    ) {
        combineLatest(
            this.period$,
            this.refresh$
        ).pipe(
            tap(() => this.totalsDataLoading.next(true)),
            switchMap(([period, refresh]: [PeriodModel, null]) => this.dashboardServiceProxy.getTotals(
                period && period.from,
                period && period.to
            ).pipe(
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

    getPercentage(value, total) {
        return (total ? Math.round(value / total * 100) : 0)  + '%';
    }

}
