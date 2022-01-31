/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

/** Third party imports */
import * as moment from 'moment-timezone';
import { BehaviorSubject, Observable, combineLatest, zip } from 'rxjs';
import { finalize, first, map, tap, switchMap, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import {
    TopStatsData,
    HostDashboardServiceProxy,
    IncomeStastistic,
    ChartDateInterval,
    TenantEdition, GetExpiringTenantsOutput, GetRecentTenantsOutput
} from '@shared/service-proxies/service-proxies';
import { MomentFormatPipe } from '@shared/utils/moment-format.pipe';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppService } from '@app/app.service';

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
    providers: [ CurrencyPipe, DatePipe, MomentFormatPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HostDashboardComponent implements OnInit {
    selectedDateRange: BehaviorSubject<CalendarValuesModel>;
    selectedDateRange$: Observable<CalendarValuesModel>;
    calendarOptions = { allowFutureDates: true };
    calendarValues: CalendarValuesModel;
    refresh: BehaviorSubject<null> = new BehaviorSubject(null);
    refresh$: Observable<null> = this.refresh.asObservable();
    currency = '$';
    chartDateInterval = ChartDateInterval;
    private selectedIncomeStatisticsDateInterval: BehaviorSubject<ChartDateInterval> = new BehaviorSubject<ChartDateInterval>(ChartDateInterval.Daily);
    selectedIncomeStatisticsDateInterval$: Observable<ChartDateInterval> = this.selectedIncomeStatisticsDateInterval.asObservable();
    allData$: Observable<[TopStatsData, IncomeStastistic[], TenantEdition[], GetExpiringTenantsOutput, GetRecentTenantsOutput]>;
    topStatsData$: Observable<TopStatsData>;
    incomeStatistics$: Observable<IncomeStastistic[]>;
    productStatisticData$: Observable<TenantEdition[]>;
    expiringTenantsData$: Observable<GetExpiringTenantsOutput>;
    recentTenantsData$: Observable<GetRecentTenantsOutput>;
    refreshing = false;
    constructor(
        private appService: AppService,
        private hostDashboardService: HostDashboardServiceProxy,
        private momentFormatPipe: MomentFormatPipe,
        private currencyPipe: CurrencyPipe,
        private changeDetector: ChangeDetectorRef,
        private datePipe: DatePipe,
        public ls: AppLocalizationService
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
        this.appService.isClientSearchDisabled = true;
        this.allData$ = combineLatest(
            this.refresh$,
            this.selectedIncomeStatisticsDateInterval$,
            this.selectedDateRange$
        ).pipe(
            tap(() => {
                //this.refreshing = true;
                this.changeDetector.detectChanges();
            }),
            switchMap(([, interval, dateRange]: [null, ChartDateInterval, CalendarValuesModel]) => {
                let from = dateRange.from.value && DateHelper.removeTimezoneOffset(dateRange.from.value, true, 'from');
                let to = dateRange.to.value && DateHelper.removeTimezoneOffset(dateRange.to.value, true, 'to');
                return zip(this.hostDashboardService.getTopStatsData(from, to),
                    this.hostDashboardService.getIncomeStatistics(interval, from, to).pipe(map(data => data.incomeStatistics)),
                    this.hostDashboardService.getEditionTenantStatistics(from, to).pipe(map(data => data.editionStatistics)),
                    this.hostDashboardService.getSubscriptionExpiringTenantsData(),
                    this.hostDashboardService.getRecentTenantsData()
                )
            }),
            //finalize(() => this.refreshing = false),
            publishReplay(),
            refCount()
        );
        this.topStatsData$ = this.allData$.pipe(
            map(([topStatsData, incomeStatistics, editionStatistics, expiringTenantOutput, recentTenantsOutput]) => topStatsData)
        );
        this.incomeStatistics$ = this.allData$.pipe(
            map(([topStatsData, incomeStatistics, editionStatistics, expiringTenantOutput, recentTenantsOutput]) => incomeStatistics.map(
                item => ({ ...item, ...{ minAmount: 0 } })
            ) || [] as any),
        );
        this.productStatisticData$ = this.allData$.pipe(
            map(([topStatsData, incomeStatistics, editionStatistics, expiringTenantOutput, recentTenantsOutput]) => editionStatistics || [])
        );
        this.expiringTenantsData$ = this.allData$.pipe(
            map(([topStatsData, incomeStatistics, editionStatistics, expiringTenantOutput, recentTenantsOutput]) => expiringTenantOutput)
        );
        this.recentTenantsData$ = this.allData$.pipe(
            map(([topStatsData, incomeStatistics, editionStatistics, expiringTenantOutput, recentTenantsOutput]) => recentTenantsOutput)
        );
    }

    getSelectedDateRangeLabel(format: string) {
        return this.selectedDateRange.value.from.value && this.selectedDateRange.value.to.value
            ? this.datePipe.transform(this.selectedDateRange.value.from.value, format) + ' - ' + this.datePipe.transform(this.selectedDateRange.value.to.value, format)
            : this.ls.l('Periods_AllTime');
    }

    incomeStatisticsDateIntervalChange(interval: number) {
        this.selectedIncomeStatisticsDateInterval.next(interval);
    }

    /*
     * Recent tenants
     */
    gotoAllRecentTenants(): void {
        this.recentTenantsData$.pipe(first()).subscribe(recentTenantsData => {
            window.open(abp.appPath + 'app/crm/tenants?' +
                'creationDateStart=' + encodeURIComponent(recentTenantsData.tenantCreationStartDate.format()));
        });
    }

    /*
     * Expiring tenants
     */
    gotoAllExpiringTenants(): void {
        this.expiringTenantsData$.pipe(first()).subscribe(expiringTenantsData => {
            const url = abp.appPath +
                'app/admin/tenants?' +
                'subscriptionEndDateStart=' +
                encodeURIComponent(expiringTenantsData.subscriptionEndDateStart.format()) +
                '&' +
                'subscriptionEndDateEnd=' +
                encodeURIComponent(expiringTenantsData.subscriptionEndDateEnd.format());

            window.open(url);
        });
    }

    reformatCreationTime = (data) => {
        return this.momentFormatPipe.transform(data.creationTime, 'L LT');
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
        if (this.selectedIncomeStatisticsDateInterval.value === ChartDateInterval.Daily ||
            isSingleDaySelected) {
            html += moment(e.argument).format('dddd, DD MMMM YYYY');
        } else {
            const isLastItem = e.point.index === e.point.series._points.length - 1;
            html += moment(e.argument).format('LL');
            if (isLastItem) {
                html += ' - ' + this.datePipe.transform(this.selectedDateRange.value.to.value, 'MMMM dd, yyyy');
            } else {
                const nextItem = e.point.series._points[e.point.index + 1];
                html += ' - ' + moment(nextItem[0]).format('LL');
            }
        }
        html += `<br/>Income: <span class="bold">${this.currencyPipe.transform(e.originalValue)}</span>`;
        return { html: html };
    }

    changeDateRange(dateRange: CalendarValuesModel) {
        this.selectedDateRange.next(dateRange);
    }
}
