<<<<<<< HEAD
/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    DoCheck,
    OnInit,
    Inject,
    OnDestroy,
    ChangeDetectorRef,
    EventEmitter,
    ElementRef,
    Input,
    Output
} from '@angular/core';
import { DOCUMENT, DecimalPipe } from '@angular/common';

/** Third party imports */
import { AbpSessionService } from 'abp-ng2-module';
import { BehaviorSubject, Observable, Subject, combineLatest, fromEvent, of } from 'rxjs';
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
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { CrmStore, PipelinesStoreSelectors } from '@app/crm/store';
import { TotalsByPeriodModel } from './totals-by-period.model';
import { DashboardServiceProxy, GroupByPeriod } from '@shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { AppConsts } from '@shared/AppConsts';
import { GetCustomerAndLeadStatsOutput } from '@shared/service-proxies/service-proxies';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { LayoutService } from '@app/shared/layout/layout.service';
import { StageDtoExtended } from '@app/crm/store/pipelines-store/stage-dto-extended.interface';
import { ContactGroup } from '@shared/AppEnums';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'totals-by-period',
    templateUrl: './totals-by-period.component.html',
    styleUrls: ['./totals-by-period.component.less'],
    providers: [ DashboardServiceProxy, DecimalPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalsByPeriodComponent implements DoCheck, OnInit, OnDestroy {
    @Input() waitFor$: Observable<any> = of().pipe(
        publishReplay(), refCount()
    );
    @Output() loadComplete: EventEmitter<any> = new EventEmitter();

    totalsData: any[] = [];
    totalsData$: Observable<GetCustomerAndLeadStatsOutput[]>;
    startDate: any;
    endDate: any;
    clientColor = this.layoutService.getLayoutColor('clientsCount');
    periods: TotalsByPeriodModel[] = [
         {
             key: GroupByPeriod.Daily,
             name: 'Daily'
         },
         {
             key: GroupByPeriod.Weekly,
             name: 'Weekly'
        },
        {
            key: GroupByPeriod.Monthly,
            name: 'Monthly'
        },
        {
            key: GroupByPeriod.Yearly,
            name: 'Yearly'
        }
    ];
    selectItems = [
        {
            name: this.ls.l('NetLeadStageRatioAndMemberCount'),
            value: false
        },
        {
            name: this.ls.l('CumulativeLeadStageRatioAndMemberCount'),
            value: true
        }
    ];

    private cumulativeOptionCacheKey = 'CRM_Dashboard_TotalsByPeriod_IsCumulative_' + this.sessionService.tenantId + '_' + this.sessionService.userId;
    private lastIsCumulative: boolean = this.cacheService.get(this.cumulativeOptionCacheKey) !== null ?
        !!+this.cacheService.get(this.cumulativeOptionCacheKey) :
        this.selectItems[0].value
    private isCumulative: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.lastIsCumulative);
    isCumulative$: Observable<boolean> = this.isCumulative.asObservable().pipe(distinctUntilChanged());
    selectedPeriod: TotalsByPeriodModel = this.periods.find(period => period.name === 'Daily');

    private series: any[] = [
        {
            type: 'spline',
            valueField: 'customerCount',
            name: this.ls.l('ClientsCount'),
            color: this.clientColor
        }
    ];

    allSeries$: Observable<any>;
    allSeriesColors: { [seriaName: string]: string } = {};
    leadStagesSeries$: Observable<any>;
    showFullLegend = false;
    startCase = startCase;
    widgetWidth: number;
    private destroy: Subject<void> = new Subject<void>();
    private destroy$: Observable<void> = this.destroy.asObservable();

    constructor(
        private dashboardServiceProxy: DashboardServiceProxy,
        private dashboardWidgetsService: DashboardWidgetsService,
        private changeDetectorRef: ChangeDetectorRef,
        private store$: Store<CrmStore.State>,
        private pipelineService: PipelineService,
        private cacheService: CacheService,
        private sessionService: AbpSessionService,
        private decimalPipe: DecimalPipe,
        private layoutService: LayoutService,
        public loadingService: LoadingService,
        public elementRef: ElementRef,
        public ls: AppLocalizationService,
        @Inject(DOCUMENT) private document: Document
    ) {}

    ngOnInit() {
        this.totalsData$ = combineLatest(
            this.dashboardWidgetsService.period$,
            this.isCumulative$,
            this.dashboardWidgetsService.contactId$,
            this.dashboardWidgetsService.contactGroupId$,
            this.dashboardWidgetsService.sourceOrgUnitIds$,
            this.dashboardWidgetsService.refresh$
        ).pipe(
            takeUntil(this.destroy$),
            tap(() => this.loadingService.startLoading(this.elementRef.nativeElement)),
            switchMap(([period, isCumulative, contactId, contactGroupId, orgUnitIds, ]:
                [PeriodModel, boolean, number, string, number[], null]) => {
                const totalsByPeriodModel = this.savePeriod(period);
                return (this.lastIsCumulative != isCumulative ? of(isCumulative) : this.waitFor$).pipe(first(), switchMap(() =>
                    this.loadCustomersAndLeadsStats(
                        totalsByPeriodModel,
                        period.from,
                        period.to,
                        isCumulative,
                        contactId,
                        contactGroupId,
                        orgUnitIds
                    ).pipe(
                        catchError(() => of([])),
                        finalize(() => {
                            this.loadComplete.next();
                            this.lastIsCumulative = isCumulative;
                            this.loadingService.finishLoading(this.elementRef.nativeElement);
                        })
                    )
                ));
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
            if (moment(period.to).diff(moment(period.from), 'days') < 90 ) {
                this.selectedPeriod = { ...this.periods[0] };
            } else if(moment(period.to).diff(moment(period.from), 'years') > 3) {
                this.selectedPeriod = { ...this.periods[3] };
            } else {
                this.selectedPeriod = { ...this.periods[2] };
            }
        }
        return this.selectedPeriod;
    }

    private loadCustomersAndLeadsStats(
        period: TotalsByPeriodModel,
        startDate: Date,
        endDate: Date,
        isCumulative: boolean,
        contactId: number,
        contactGroupId: string,
        orgUnitIds: number[]
    ): Observable<GetCustomerAndLeadStatsOutput[]> {
        const momentEndDate = moment(endDate);
        const today = moment();
        return this.dashboardServiceProxy.getContactAndLeadStats(
            GroupByPeriod[(period.name as GroupByPeriod)],
            undefined,
            isCumulative,
            moment(startDate),
            momentEndDate.isAfter(today) ? today : momentEndDate,
            contactGroupId,
            contactId,
            orgUnitIds
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
        return this[`get${capitalize(period)}BottomAxisCustomizer`];
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

    getYearlyBottomAxisCustomizer(elem) {
        return elem.value.getUTCFullYear().toString();
    }

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
        this.destroy.next();
    }
}
=======
/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    DoCheck,
    OnInit,
    Inject,
    OnDestroy,
    ChangeDetectorRef,
    EventEmitter,
    ElementRef,
    Input,
    Output
} from '@angular/core';
import { DOCUMENT, DecimalPipe } from '@angular/common';

/** Third party imports */
import { AbpSessionService } from 'abp-ng2-module';
import { BehaviorSubject, Observable, Subject, combineLatest, fromEvent, of } from 'rxjs';
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
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { CrmStore, PipelinesStoreSelectors } from '@app/crm/store';
import { TotalsByPeriodModel } from './totals-by-period.model';
import { DashboardServiceProxy, GroupByPeriod } from '@shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { AppConsts } from '@shared/AppConsts';
import { GetCustomerAndLeadStatsOutput } from '@shared/service-proxies/service-proxies';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { LayoutService } from '@app/shared/layout/layout.service';
import { StageDtoExtended } from '@app/crm/store/pipelines-store/stage-dto-extended.interface';
import { ContactGroup } from '@shared/AppEnums';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'totals-by-period',
    templateUrl: './totals-by-period.component.html',
    styleUrls: ['./totals-by-period.component.less'],
    providers: [ DashboardServiceProxy, DecimalPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalsByPeriodComponent implements DoCheck, OnInit, OnDestroy {
    @Input() waitFor$: Observable<any> = of().pipe(
        publishReplay(), refCount()
    );
    @Output() loadComplete: EventEmitter<any> = new EventEmitter();

    totalsData: any[] = [];
    totalsData$: Observable<GetCustomerAndLeadStatsOutput[]>;
    startDate: any;
    endDate: any;
    clientColor = this.layoutService.getLayoutColor('clientsCount');
    periods: TotalsByPeriodModel[] = [
         {
             key: GroupByPeriod.Daily,
             name: 'Daily'
         },
         {
             key: GroupByPeriod.Weekly,
             name: 'Weekly'
        },
        {
            key: GroupByPeriod.Monthly,
            name: 'Monthly'
        },
        {
            key: GroupByPeriod.Yearly,
            name: 'Yearly'
        }
    ];
    selectItems = [
        {
            name: this.ls.l('NetLeadStageRatioAndMemberCount'),
            value: false
        },
        {
            name: this.ls.l('CumulativeLeadStageRatioAndMemberCount'),
            value: true
        }
    ];

    private cumulativeOptionCacheKey = 'CRM_Dashboard_TotalsByPeriod_IsCumulative_' + this.sessionService.tenantId + '_' + this.sessionService.userId;
    private lastIsCumulative: boolean = this.cacheService.get(this.cumulativeOptionCacheKey) !== null ?
        !!+this.cacheService.get(this.cumulativeOptionCacheKey) :
        this.selectItems[0].value
    private isCumulative: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.lastIsCumulative);
    isCumulative$: Observable<boolean> = this.isCumulative.asObservable().pipe(distinctUntilChanged());
    selectedPeriod: TotalsByPeriodModel = this.periods.find(period => period.name === 'Daily');

    private series: any[] = [
        {
            type: 'spline',
            valueField: 'customerCount',
            name: this.ls.l('ClientsCount'),
            color: this.clientColor
        }
    ];

    allSeries$: Observable<any>;
    allSeriesColors: { [seriaName: string]: string } = {};
    leadStagesSeries$: Observable<any>;
    showFullLegend = false;
    startCase = startCase;
    widgetWidth: number;
    private destroy: Subject<void> = new Subject<void>();
    private destroy$: Observable<void> = this.destroy.asObservable();

    constructor(
        private dashboardServiceProxy: DashboardServiceProxy,
        private dashboardWidgetsService: DashboardWidgetsService,
        private changeDetectorRef: ChangeDetectorRef,
        private store$: Store<CrmStore.State>,
        private pipelineService: PipelineService,
        private cacheService: CacheService,
        private sessionService: AbpSessionService,
        private decimalPipe: DecimalPipe,
        private layoutService: LayoutService,
        public loadingService: LoadingService,
        public elementRef: ElementRef,
        public ls: AppLocalizationService,
        @Inject(DOCUMENT) private document: Document
    ) {}

    ngOnInit() {
        this.totalsData$ = combineLatest(
            this.dashboardWidgetsService.period$,
            this.isCumulative$,
            this.dashboardWidgetsService.contactId$,
            this.dashboardWidgetsService.contactGroupId$,
            this.dashboardWidgetsService.sourceOrgUnitIds$,
            this.dashboardWidgetsService.refresh$
        ).pipe(
            takeUntil(this.destroy$),
            tap(() => this.loadingService.startLoading(this.elementRef.nativeElement)),
            switchMap(([period, isCumulative, contactId, contactGroupId, orgUnitIds, ]:
                [PeriodModel, boolean, number, string, number[], null]) => {
                const totalsByPeriodModel = this.savePeriod(period);
                return (this.lastIsCumulative != isCumulative ? of(isCumulative) : this.waitFor$).pipe(first(), switchMap(() =>
                    this.loadCustomersAndLeadsStats(
                        totalsByPeriodModel,
                        period.from,
                        period.to,
                        isCumulative,
                        contactId,
                        contactGroupId,
                        orgUnitIds
                    ).pipe(
                        catchError(() => of([])),
                        finalize(() => {
                            this.loadComplete.next();
                            this.lastIsCumulative = isCumulative;
                            this.loadingService.finishLoading(this.elementRef.nativeElement);
                        })
                    )
                ));
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
            if (moment(period.to).diff(moment(period.from), 'days') < 90 ) {
                this.selectedPeriod = { ...this.periods[0] };
            } else if(moment(period.to).diff(moment(period.from), 'years') > 3) {
                this.selectedPeriod = { ...this.periods[3] };
            } else {
                this.selectedPeriod = { ...this.periods[2] };
            }
        }
        return this.selectedPeriod;
    }

    private loadCustomersAndLeadsStats(
        period: TotalsByPeriodModel,
        startDate: Date,
        endDate: Date,
        isCumulative: boolean,
        contactId: number,
        contactGroupId: string,
        orgUnitIds: number[]
    ): Observable<GetCustomerAndLeadStatsOutput[]> {
        const momentEndDate = moment(endDate);
        const today = moment();
        return this.dashboardServiceProxy.getContactAndLeadStats(
            GroupByPeriod[(period.name as GroupByPeriod)],
            undefined,
            isCumulative,
            moment(startDate),
            momentEndDate.isAfter(today) ? today : momentEndDate,
            contactGroupId,
            contactId,
            orgUnitIds
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
        return this[`get${capitalize(period)}BottomAxisCustomizer`];
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

    getYearlyBottomAxisCustomizer(elem) {
        return elem.value.getUTCFullYear().toString();
    }

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
        this.destroy.next();
    }
}
>>>>>>> f999b481882149d107812286d0979872df712626
