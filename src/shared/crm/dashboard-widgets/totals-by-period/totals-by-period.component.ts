/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    DoCheck,
    OnInit,
    Injector,
    Inject,
    OnDestroy,
    ViewChild,
    ChangeDetectorRef,
    ElementRef
} from '@angular/core';
import { DOCUMENT, DecimalPipe } from '@angular/common';

/** Third party imports */
import { AbpSessionService } from '@abp/session/abp-session.service';
import { DxChartComponent } from 'devextreme-angular/ui/chart';
import { BehaviorSubject, Observable, combineLatest, fromEvent, of } from 'rxjs';
import {
    catchError,
    distinct,
    distinctUntilChanged,
    finalize,
    filter,
    first,
    switchMap,
    takeUntil,
    tap,
    toArray,
    map,
    mergeAll,
    mergeMap,
    pluck,
    publishReplay,
    refCount,
    withLatestFrom
} from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import * as moment from 'moment-timezone';
import 'moment-timezone';
import { CacheService } from 'ng2-cache-service';
import startCase from 'lodash/startCase';
import invert from 'lodash/invert';

/** Application imports */
import { CrmStore, PipelinesStoreSelectors } from '@app/crm/store';
import { TotalsByPeriodModel } from './totals-by-period.model';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardServiceProxy, GroupByPeriod } from '@shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { AppConsts } from '@shared/AppConsts';
import { GetCustomerAndLeadStatsOutput } from '@shared/service-proxies/service-proxies';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { Period } from '@app/shared/common/period/period.enum';
import { LayoutService } from '@app/shared/layout/layout.service';
import { StageDtoExtended } from '@app/crm/store/pipelines-store/stage-dto-extended.interface';
import { ContactGroup } from '@shared/AppEnums';

@Component({
    selector: 'totals-by-period',
    templateUrl: './totals-by-period.component.html',
    styleUrls: ['./totals-by-period.component.less'],
    providers: [ DashboardServiceProxy, DecimalPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalsByPeriodComponent extends AppComponentBase implements DoCheck, OnInit, OnDestroy {
    @ViewChild(DxChartComponent, { static: true }) chartComponent: DxChartComponent;
    totalsData: any[] = [];
    totalsData$: Observable<GetCustomerAndLeadStatsOutput[]>;
    startDate: any;
    endDate: any;
    currency = 'USD';
    clientColor = this.layoutService.getLayoutColor('clientsCount');
    periods: TotalsByPeriodModel[] = [
         {
             key: GroupByPeriod.Daily,
             name: 'Daily',
             amount: 30
         },
         {
             key: GroupByPeriod.Weekly,
             name: 'Weekly',
             amount: 15
        },
        {
            key: GroupByPeriod.Monthly,
            name: 'Monthly',
            amount: 12
        },
        {
            key: GroupByPeriod.Monthly,
            name: 'Monthly',
            amount: 5
        }
    ];
    selectItems = [
        {
            name: this.l('NetLeadStageRatioAndMemberCount'),
            value: false
        },
        {
            name: this.l('CumulativeLeadStageRatioAndMemberCount'),
            value: true
        }
    ];

    private cumulativeOptionCacheKey = 'CRM_Dashboard_TotalsByPeriod_IsCumulative_' + this.sessionService.tenantId + '_' + this.sessionService.userId;
    private isCumulative: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
        this.cacheService.get(this.cumulativeOptionCacheKey) !== null ?
            !!+this.cacheService.get(this.cumulativeOptionCacheKey) :
            this.selectItems[0].value
    );
    isCumulative$: Observable<boolean> = this.isCumulative.asObservable().pipe(distinctUntilChanged());
    selectedPeriod: TotalsByPeriodModel = this.periods.find(period => period.name === 'Daily');

    private series: any[] = [
        {
            type: 'spline',
            valueField: 'customerCount',
            name: this.l('ClientsCount'),
            color: this.clientColor
        }
    ];

    allSeries$: Observable<any>;
    allSeriesColors: { [seriaName: string]: string } = {};
    leadStagesSeries$: Observable<any>;
    showFullLegend = false;
    startCase = startCase;
    widgetWidth: number;

    constructor(
        injector: Injector,
        private dashboardServiceProxy: DashboardServiceProxy,
        private dashboardWidgetsService: DashboardWidgetsService,
        private changeDetectorRef: ChangeDetectorRef,
        private store$: Store<CrmStore.State>,
        private pipelineService: PipelineService,
        private cacheService: CacheService,
        private sessionService: AbpSessionService,
        private decimalPipe: DecimalPipe,
        private layoutService: LayoutService,
        public elementRef: ElementRef,
        @Inject(DOCUMENT) private document: Document
    ) {
        super(injector);
    }

    ngOnInit() {
        this.totalsData$ = combineLatest(
            this.dashboardWidgetsService.period$.pipe(map((period: PeriodModel) => this.savePeriod(period))),
            this.isCumulative$,
            this.dashboardWidgetsService.refresh$
        ).pipe(
            takeUntil(this.destroy$),
            tap(() => this.startLoading()),
            switchMap(([period, isCumulative, refresh]: [TotalsByPeriodModel, boolean, null]) => {
                return this.loadCustomersAndLeadsStats(period, isCumulative).pipe(
                    catchError(() => of([])),
                    finalize(() => { this.finishLoading(); })
                );
            }),
            publishReplay(),
            refCount()
        );

        /** Listen body click */
        fromEvent(this.document.body, 'click').pipe(
            /** Stop listen after component destroy */
            takeUntil(this.destroy$),
            /** Get click target */
            map((clickEvent: any) => clickEvent.target),
            /** If target is not in legend */
            filter(clickTarget => !clickTarget.closest('.legend'))
        ).subscribe(
            /** Close full legend */
            () => {
                this.showFullLegend = false;
                this.changeDetectorRef.detectChanges();
            }
        );

        /** Save is cumulative change to cache */
        this.isCumulative$.pipe(takeUntil(this.destroy$)).subscribe(
            isCumulative => this.cacheService.set(this.cumulativeOptionCacheKey, +isCumulative)
        );

        this.totalsData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
            /** Move leadStageCount object property inside data object to correctly display the widget */
            this.totalsData = data.map(dataItem => {
                return { ...dataItem, ...dataItem['leadStageCount'] };
            });
        });

        /** Return new stage for each unique stage id every time the total data change */
        this.leadStagesSeries$ = this.totalsData$.pipe(
            switchMap(data => this.convertLeadsStatsToSeriesConfig(data))
        );

        /** Merge default series config for clients and dynamic leads series configs */
        this.allSeries$ = this.leadStagesSeries$.pipe(
            withLatestFrom(of(this.series), ((leadStagesSeries , allSeries) => [ ...leadStagesSeries, ...allSeries ]))
        );
        this.allSeries$.subscribe(series => {
            series.forEach(seria => {
                this.allSeriesColors[seria.name] = seria.color;
            });
        });
    }

    ngDoCheck() {
        if (this.elementRef.nativeElement.offsetWidth) {
            const newWidgetWidth = this.elementRef.nativeElement.offsetWidth;
            if (newWidgetWidth !== this.widgetWidth) {
                this.widgetWidth = newWidgetWidth;
                this.changeDetectorRef.detectChanges();
            }
        }
    }

    changeCumulative(e) {
        this.isCumulative.next(e.selectedItem.value);
    }

    private savePeriod(period: PeriodModel): TotalsByPeriodModel {
        if (period) {
            if ([Period.Today, Period.Yesterday, Period.ThisWeek, Period.ThisMonth, Period.LastMonth].indexOf(period.period) >= 0)
                this.selectedPeriod = { ...this.periods[0] };
            else if (period.name === Period.LastQuarter) {
                this.selectedPeriod = { ...this.periods[3] };
            } else {
                this.selectedPeriod = { ...this.periods[2] };
            }
        }
        return this.selectedPeriod;
    }

    private loadCustomersAndLeadsStats(period: TotalsByPeriodModel, isCumulative: boolean): Observable<GetCustomerAndLeadStatsOutput[]> {
        return this.dashboardServiceProxy.getCustomerAndLeadStats(
            GroupByPeriod[(period.name as GroupByPeriod)],
            period.amount,
            isCumulative
        );
    }

    private convertLeadsStatsToSeriesConfig(data): Observable<any> {
        return of(data).pipe(
            mergeAll(),
            pluck('leadStageCount'),
            mergeMap(leadsStages => Object.keys(leadsStages)),
            distinct(),
            mergeMap(stageId => this.getLeadStageSeriaConfig(+stageId)),
            toArray(),
            map(stages => stages.sort((a, b) => +a.sortOrder > +b.sortOrder ? 1 : (+a.sortOrder === +b.sortOrder ? 0 : -1)))
        );
    }

    private getLeadStageSeriaConfig(stageId: number): Observable<any> {
        return this.store$.pipe(select(PipelinesStoreSelectors.getStageById({
            purpose: AppConsts.PipelinePurposeIds.lead,
            stageId: stageId
        }))).pipe(
            first(),
            map((stage: StageDtoExtended) => ({
                valueField: stageId.toString(),
                name: stage && (stage.name + (stage.contactGroupId !== ContactGroup.Client ? (' ' + invert(ContactGroup)[stage.contactGroupId]) : '')),
                color: (stage && stage.color) || this.pipelineService.getStageDefaultColorByStageSortOrder(stage && stage.sortOrder),
                type: 'stackedBar',
                sortOrder: stage && stage.sortOrder
            }))
        );
    }

    getPeriodBottomAxisCustomizer(period: string) {
        return this[`get${this.capitalize(period)}BottomAxisCustomizer`];
    }

    /** Replace minus for the brackets */
    customizeAxisValues = (arg: any) => {
        return arg.valueText;
    }

    customizeBottomAxis = (elem) => {
        return this.getPeriodBottomAxisCustomizer(this.selectedPeriod.name)(elem);
    }

    customizeTooltip = pointInfo => {
        let html = '';

        moment.tz.setDefault(undefined);
        let date = new Date(pointInfo.argument.getTime());
        date.setTime(date.getTime() + (date.getTimezoneOffset() * 60 * 1000));
        date = moment(date);
        moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
        const leadsArePresent = pointInfo.points.length > this.series.length;
        const headerFormattedDate = this.getHeaderFormattedDate(date);
        html += `<header class="tooltip-header">${headerFormattedDate}</header>`;
        if (leadsArePresent) {
            html += `<div class="label">Leads:</div>`;
        }

        for (let point of pointInfo.points) {
            const color = this.getColorBySeriesNames(point.seriesName);
            const isClientsPoint = point.seriesName === this.series[0].name;
            if (isClientsPoint && leadsArePresent) {
                html += `<hr style="margin: 5px 0"/>`;
            }
            html += `<div class="tooltip-item">
                        <span class="tooltip-item-marker" style="background-color: ${color}"></span>
                        ${startCase(point.seriesName.toLowerCase())}`;

            if (!isClientsPoint) {
                html += `<span class="tooltip-item-percent">${point.percentText}</span>`;
            }

            html += `<span class="tooltip-item-value">${this.decimalPipe.transform(point.value)}</span></div>`;
        }
        return { html: html };
    }

    private getHeaderFormattedDate(date: moment.Moment): string {
        let formattedDate;
        if (this.selectedPeriod.key !== GroupByPeriod.Monthly) {
            const dateEnding = date.format('Do').slice(-2);
            formattedDate = `${date.format('MMM D')}<sup>${dateEnding}</sup> ${date.format('YYYY')}`;
        } else {
            formattedDate = date.format('MMM YYYY');
        }
        return formattedDate;
    }

    getColorBySeriesNames(seriaName: string): string {
        return this.allSeriesColors[seriaName];
    }

    /** Factory for method that customize axis */

    getMonthlyBottomAxisCustomizer(elem) {
        return `${elem.value.toUTCString().split(' ')[2].toUpperCase()}<br/><div class="yearArgument">${elem.value.getUTCFullYear().toString().substr(-2)}</div>`;
    }

    getWeeklyBottomAxisCustomizer(elem) {
        return `${elem.value.getUTCDate()}.${elem.value.getUTCMonth() + 1}`;
    }

    getDailyBottomAxisCustomizer(elem) {
        const [ , date, month ] = elem.value.toUTCString().split(' ');
        return `${date}<br/>${month}`;
    }

    toggleFullLegend() {
        this.showFullLegend = !this.showFullLegend;
        this.changeDetectorRef.detectChanges();
    }

    ngOnDestroy() {
        super.ngOnDestroy();
    }
}
