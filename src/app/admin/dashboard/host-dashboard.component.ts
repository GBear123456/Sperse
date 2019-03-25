/** Core imports */
import {
    AfterViewInit,
    ChangeDetectionStrategy, ChangeDetectorRef,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import * as moment from 'moment';
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
import { DateRangeInterface } from './date-range.interface';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

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
    animations: [appModuleAnimation()],
    providers: [ CurrencyPipe, MomentFormatPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HostDashboardComponent implements AfterViewInit, OnInit {
    @ViewChild('DashboardDateRangePicker') dateRangePickerElement: ElementRef;
    selectedDateRange: BehaviorSubject<DateRangeInterface> = new BehaviorSubject({
        startDate: moment().add(-7, 'days').startOf('day'),
        endDate: moment().endOf('day')
    });
    selectedDateRange$: Observable<DateRangeInterface> = this.selectedDateRange.asObservable();
    private refresh: BehaviorSubject<null> = new BehaviorSubject(null);
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
        private _changeDetector: ChangeDetectorRef
    ) {}

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
            switchMap(([, interval, dateRange]: [null, AppIncomeStatisticsDateInterval, DateRangeInterface]) => {
                return this._hostDashboardService.getDashboardStatisticsData(
                    interval as IncomeStatisticsDateInterval,
                    dateRange.startDate,
                    dateRange.endDate
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

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.createDateRangePicker();
        }, 0);
    }

    createDateRangePicker(): void {
        $(this.dateRangePickerElement.nativeElement).daterangepicker(
            $.extend(true, this._dateTimeService.createDateRangePickerOptions(), this.selectedDateRange.value),
            (start, end) => {
                this.selectedDateRange.next({
                    startDate: start,
                    endDate: end
                });
            }
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
        const isSingleDaySelected = this.selectedDateRange.value.startDate.format('L') === this.selectedDateRange.value.endDate.format('L');
        if (this.selectedIncomeStatisticsDateInterval.value === AppIncomeStatisticsDateInterval.Daily ||
            isSingleDaySelected) {
            html += moment(e.argument).format('dddd, DD MMMM YYYY');
        } else {
            const isLastItem = e.point.index === e.point.series._points.length - 1;
            html += moment(e.argument).format('LL');
            if (isLastItem) {
                html += ' - ' + this.selectedDateRange.value.endDate.format('LL');
            } else {
                const nextItem = e.point.series._points[e.point.index + 1];
                html += ' - ' + moment(nextItem[0]).format('LL');
            }
        }
        html += `<br/>Income: <span class="bold">${this._currencyPipe.transform(e.originalValue)}</span>`;
        return { html: html };
    }
}
