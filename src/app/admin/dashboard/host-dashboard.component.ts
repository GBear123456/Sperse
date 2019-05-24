/** Core imports */
import {
    ChangeDetectionStrategy, ChangeDetectorRef,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

/** Third party imports */
import * as moment from 'moment-timezone';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { finalize, first, map, tap, switchMap, catchError, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { AppIncomeStatisticsDateInterval } from '@shared/AppEnums';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import {
    ExpiringTenant,
    HostDashboardData,
    HostDashboardServiceProxy,
    IncomeStastistic,
    IncomeStatisticsDateInterval,
    RecentTenant, TenantEdition
} from '@shared/service-proxies/service-proxies';
import { MomentFormatPipe } from '@shared/utils/moment-format.pipe';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
    templateUrl: './host-dashboard.component.html',
    styleUrls: [
        '../../../shared/metronic/progress.less',
        '../../../shared/metronic/dropdown-menu.less',
        '../../../shared/metronic/daterangepicker.less',
        '../../../shared/metronic/m-widget24.less',
        '../../../shared/metronic/m-button-icon.less',
        './host-dashboard.component.less'
    ],
    encapsulation: ViewEncapsulation.None,
    animations: [ appModuleAnimation() ],
    providers: [ CurrencyPipe, DatePipe, MomentFormatPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HostDashboardComponent implements OnInit {
    @ViewChild('DashboardDateRangePicker') dateRangePickerElement: ElementRef;
    selectedDateRange: BehaviorSubject<CalendarValuesModel>;
    selectedDateRange$: Observable<CalendarValuesModel>;
    calendarOptions = { allowFutureDates: true };
    calendarValues: CalendarValuesModel;
    refresh: BehaviorSubject<null> = new BehaviorSubject(null);
    refresh$: Observable<null> = this.refresh.asObservable();
    currency = '$';
    appIncomeStatisticsDateInterval = AppIncomeStatisticsDateInterval;
    private selectedIncomeStatisticsDateInterval: BehaviorSubject<AppIncomeStatisticsDateInterval> = new BehaviorSubject<AppIncomeStatisticsDateInterval>(AppIncomeStatisticsDateInterval.Daily);
    selectedIncomeStatisticsDateInterval$: Observable<AppIncomeStatisticsDateInterval> = this.selectedIncomeStatisticsDateInterval.asObservable();
    hostDashboardData$: Observable<HostDashboardData>;
    incomeStatistics$: Observable<IncomeStastistic[]>;
    productStatisticData$: Observable<TenantEdition[]>;
    expiringTenantsData$: Observable<ExpiringTenant[]>;
    recentTenantsData$: Observable<RecentTenant[]>;
    refreshing = false;
    constructor(
        private _dateTimeService: DateTimeService,
        private _hostDashboardService: HostDashboardServiceProxy,
        private _momentFormatPipe: MomentFormatPipe,
        private _currencyPipe: CurrencyPipe,
        public ls: AppLocalizationService,
        private _changeDetector: ChangeDetectorRef,
        private _datePipe: DatePipe
    ) {
        const startDate = DateHelper.addTimezoneOffset(moment().subtract(7, 'days').startOf('day').toDate(), true);
        const endDate = DateHelper.addTimezoneOffset(moment().endOf('day').toDate(), true);
        this.calendarValues = {
            from: { value: startDate },
            to: { value: endDate }
        };
        this.selectedDateRange = new BehaviorSubject({
            from: { value: new Date(startDate) },
            to: { value: new Date(endDate) }
        });
        this.selectedDateRange$ = this.selectedDateRange.asObservable();
    }

    ngOnInit() {
        this.hostDashboardData$ = combineLatest(
            this.refresh$,
            this.selectedIncomeStatisticsDateInterval$,
            this.selectedDateRange$
        ).pipe(
            tap(() => {
                this.refreshing = true;
                this._changeDetector.detectChanges();
            }),
            switchMap(([, interval, dateRange]: [null, AppIncomeStatisticsDateInterval, CalendarValuesModel]) => {
                return this._hostDashboardService.getDashboardStatisticsData(
                    interval as IncomeStatisticsDateInterval,
                    DateHelper.removeTimezoneOffset(dateRange.from.value, true, 'from'),
                    DateHelper.removeTimezoneOffset(dateRange.to.value, true, 'to')
                ).pipe(
                    finalize(() => this.refreshing = false),
                    catchError(() => of(new HostDashboardData()))
                );
            }),
            publishReplay(),
            refCount()
        );
        this.incomeStatistics$ = this.hostDashboardData$.pipe(
            map((data: HostDashboardData) => data.incomeStatistics.map(
                item => ({ ...item, ...{ minAmount: 0 }})
            ) || [] as any)
        );
        this.productStatisticData$ = this.hostDashboardData$.pipe(
            map((data: HostDashboardData) => data.editionStatistics || [])
        );
        this.expiringTenantsData$ = this.hostDashboardData$.pipe(
            map((data: HostDashboardData) => data.expiringTenants || [])
        );
        this.recentTenantsData$ = this.hostDashboardData$.pipe(
            map((data: HostDashboardData) => data.recentTenants || [])
        );
    }

    incomeStatisticsDateIntervalChange(interval: number) {
        this.selectedIncomeStatisticsDateInterval.next(interval);
    }

    /*
     * Recent tenants
     */
    gotoAllRecentTenants(): void {
        this.hostDashboardData$.pipe(first()).subscribe(hostDashboardData => {
            window.open(abp.appPath + 'app/crm/tenants?' +
                'creationDateStart=' + encodeURIComponent(hostDashboardData.tenantCreationStartDate.format()));
        });
    }

    /*
     * Expiring tenants
     */
    gotoAllExpiringTenants(): void {
        this.hostDashboardData$.pipe(first()).subscribe(hostDashboardData => {
            const url = abp.appPath +
                'app/admin/tenants?' +
                'subscriptionEndDateStart=' +
                encodeURIComponent(hostDashboardData.subscriptionEndDateStart.format()) +
                '&' +
                'subscriptionEndDateEnd=' +
                encodeURIComponent(hostDashboardData.subscriptionEndDateEnd.format());

            window.open(url);
        });
    }

    reformatCreationTime = (data) => {
        return this._momentFormatPipe.transform(data.creationTime, 'L LT');
    }

    customizePieChartLabel = (point) => {
        return point.argumentText + ': ' + point.percentText;
    }

    customizeBottomAxis(elem) {
        return elem.value.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    }

    customizeIncomeTooltip = e => {
        let html = '';
        const isSingleDaySelected = this.selectedDateRange.value.from.value.getTime() === this.selectedDateRange.value.to.value.getTime();
        if (this.selectedIncomeStatisticsDateInterval.value === AppIncomeStatisticsDateInterval.Daily ||
            isSingleDaySelected) {
            html += moment(e.argument).format('dddd, DD MMMM YYYY');
        } else {
            const isLastItem = e.point.index === e.point.series._points.length - 1;
            html += moment(e.argument).format('LL');
            if (isLastItem) {
                html += ' - ' + this._datePipe.transform(this.selectedDateRange.value.to.value, 'MMMM dd, yyyy');
            } else {
                const nextItem = e.point.series._points[e.point.index + 1];
                html += ' - ' + moment(nextItem[0]).format('LL');
            }
        }
        html += `<br/>Income: <span class="bold">${this._currencyPipe.transform(e.originalValue)}</span>`;
        return { html: html };
    }

    changeDateRange(dateRange: CalendarValuesModel) {
        this.selectedDateRange.next(dateRange);
    }
}
