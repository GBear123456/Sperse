/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable, ReplaySubject, combineLatest, of } from 'rxjs';
import { catchError, finalize, switchMap, map, tap, distinctUntilChanged } from 'rxjs/operators';
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
import { ContactGroup } from '@shared/AppEnums';

@Injectable()
export class DashboardWidgetsService  {
    public period$: Observable<PeriodModel> = this.calendarService.dateRange$.pipe(
        map((dateRange: CalendarValuesModel) => {
            return {
                from: dateRange.from.value && DateHelper.removeTimezoneOffset(new Date(dateRange.from.value.getTime()), true, 'from'),
                to: dateRange.to.value && DateHelper.removeTimezoneOffset(new Date(dateRange.to.value.getTime()), true, 'to'),
                period: dateRange.period,
                name: dateRange.period
            };
        })
    );
    private _totalsData: ReplaySubject<GetTotalsOutput> = new ReplaySubject<GetTotalsOutput>(1);
    totalsData$: Observable<GetTotalsOutput> = this._totalsData.asObservable();
    totalsDataAvailable$: Observable<boolean> = this.totalsData$.pipe(
        map((totalsData: GetTotalsOutput) => !!(totalsData.totalOrderAmount || totalsData.totalLeadCount || totalsData.totalClientCount))
    );
    private totalsDataLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    totalsDataLoading$: Observable<boolean> = this.totalsDataLoading.asObservable();
    private isAnyCGGranted = !!this.permissionService.getFirstAvailableCG();
    totalsDataFields = [
        {
            title: 'Sales',
            color: this.layoutService.getLayoutColor('totalSales'),
            name: 'totalOrderAmount',
            type: 'currency',
            percent:  '0%',
            visible: this.isAnyCGGranted ||
                this.permissionService.isGranted(AppPermissions.CRMOrders)
        }, {
            title: 'Leads',
            color: this.layoutService.getLayoutColor('totalLeads'),
            name: 'totalLeadCount',
            type: 'number',
            percent: '0%',
            visible: this.isAnyCGGranted
       }, {
           title: 'Clients',
           color: this.layoutService.getLayoutColor('totalClients'),
           name: 'totalClientCount',
           type: 'number',
           percent: '0%',
           visible: this.isAnyCGGranted
       }];
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this._refresh.asObservable();
    private _contactId: BehaviorSubject<number> = new BehaviorSubject<number>(undefined);
    contactId$: Observable<number> = this._contactId.asObservable();
    private _contactGroupId: BehaviorSubject<ContactGroup> = new BehaviorSubject<ContactGroup>(this.permissionService.getFirstAvailableCG());
    contactGroupId$: Observable<ContactGroup> = this._contactGroupId.asObservable().pipe(
        map((value: ContactGroup) => value || this.permissionService.getFirstAvailableCG()), distinctUntilChanged());
    private _sourceOrgUnitIds: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
    sourceOrgUnitIds$: Observable<number[]> = this._sourceOrgUnitIds.asObservable();

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
            this.contactId$,
            this.contactGroupId$,
            this.sourceOrgUnitIds$,
            this.refresh$
        ).pipe(
            tap(() => this.totalsDataLoading.next(true)),
            switchMap(([period, contactId, groupId, orgUnitIds, ]: [PeriodModel, number, ContactGroup, number[], null]) =>
                this.dashboardServiceProxy.getTotals(
                    period && period.from,
                    period && period.to,
                    String(groupId),
                    contactId,
                    orgUnitIds
                ).pipe(
                    catchError(() => of(new GetTotalsOutput())),
                    finalize(() => this.totalsDataLoading.next(false))
                )
            )
        ).subscribe((totalData: GetTotalsOutput) => {
            this._totalsData.next(totalData);
        });
    }

    refresh() {
        this._refresh.next(null);
    }

    setContactIdForTotals(contactId?: number) {
        this._contactId.next(contactId);
    }

    setGroupIdForTotals(groupId?: ContactGroup) {
        this._contactGroupId.next(groupId);
    }

    setOrgUnitIdsForTotals(orgUnitIds?: number[]) {
        this._sourceOrgUnitIds.next(orgUnitIds);
    }

    getPercentage(value, total) {
        return (total ? Math.round(value / total * 100) : 0)  + '%';
    }
}