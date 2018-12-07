/** Core imports */
import { Component, OnInit, Injector, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import { Observable, combineLatest, of } from 'rxjs';
import {
    finalize,
    first,
    switchMap,
    takeUntil,
    toArray,
    map,
    mergeAll,
    mergeMap,
    pluck,
    distinct,
    publishReplay,
    refCount,
    withLatestFrom
} from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import * as moment from 'moment-timezone';
import 'moment-timezone';

/** Application imports */
import { CrmStore, PipelinesStoreSelectors } from '@app/crm/store';
import { TotalsByPeriodModel } from './totals-by-period.model';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardServiceProxy, GroupBy, GroupBy2 } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { DxChartComponent } from 'devextreme-angular';
import { AppConsts } from '@shared/AppConsts';
import { GetCustomerAndLeadStatsOutput } from '@shared/service-proxies/service-proxies';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { BehaviorSubject } from '@node_modules/rxjs';

@Component({
    selector: 'totals-by-period',
    templateUrl: './totals-by-period.component.html',
    styleUrls: ['./totals-by-period.component.less'],
    providers: [ DashboardServiceProxy ]
})
export class TotalsByPeriodComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxChartComponent) chartComponent: DxChartComponent;
    totalsData: any[] = [];
    totalsData$: Observable<GetCustomerAndLeadStatsOutput[]>;
    startDate: any;
    endDate: any;
    chartWidth = 650;
    currency = 'USD';
    clientColor = '#8487e7';

    periods: TotalsByPeriodModel[] = [
         {
             key: GroupBy.Daily,
             name: 'Daily',
             text: `30 ${this.ls('Platform', 'Periods_Day_plural')}`,
             amount: 30
         },
         {
             key: GroupBy.Weekly,
             name: 'Weekly',
             text: `15 ${this.ls('Platform', 'Periods_Week_plural')}`,
             amount: 15
        },
        {
            key: GroupBy.Monthly,
            name: 'Monthly',
            text: `12 ${this.l('Periods_Month_plural')}`,
            amount: 12
        }
    ];
    selectItems = [
        {
            name: this.l('CumulativeLeadStageRatioAndMemberCount'),
            value: true
        },
        {
            name: this.l('NetLeadStageRatioAndMemberCount'),
            value: false
        }
    ];
    private isCumulative: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.selectItems[0].value);
    private isCumulative$: Observable<boolean> = this.isCumulative.asObservable();

    selectedPeriod: TotalsByPeriodModel = this.periods.find(period => period.name === 'Daily');
    private renderTimeout;
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

    constructor(injector: Injector,
        private _dashboardServiceProxy: DashboardServiceProxy,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private store$: Store<CrmStore.State>,
        private _pipelineService: PipelineService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        this.totalsData$ = combineLatest(
            this._dashboardWidgetsService.period$.pipe(map(period => this.savePeriod(period))),
            this.isCumulative$
        ).pipe(
            takeUntil(this.destroy$),
            switchMap(([period, isCumulative]) => this.loadCustomersAndLeadsStats(period, isCumulative)),
            publishReplay(),
            refCount()
        );

        this.totalsData$.subscribe(data => {
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

    changeCumulative(e) {
        this.isCumulative.next(e.selectedItem.value);
    }

    private savePeriod(period) {
        if (period) {
            if ([this.l('Today'), this.l('Yesterday'), this.l('This_Week'), this.l('This_Month'), this.l('Last_Month')].indexOf(period.name) >= 0)
                this.selectedPeriod = this.periods[0];
            else
                this.selectedPeriod = this.periods[2];
        }
        return this.selectedPeriod;
    }

    private loadCustomersAndLeadsStats(period: any, isCumulative: boolean): Observable<GetCustomerAndLeadStatsOutput[]> {
        this.startLoading();
        return this._dashboardServiceProxy.getCustomerAndLeadStats(
            GroupBy2[(period.name as GroupBy2)],
            period.amount,
            isCumulative
        ).pipe(finalize(() => { this.finishLoading(); }) );
    }

    private convertLeadsStatsToSeriesConfig(data): Observable<any> {
        return of(data).pipe(
            mergeAll(),
            pluck('leadStageCount'),
            mergeMap(leadsStages => Object.keys(leadsStages)),
            distinct(),
            switchMap(stageId => this.getLeadStageSeriaConfig(+stageId)),
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
            map(stage => {
                return {
                    valueField: stageId.toString(),
                    name: stage && stage.name,
                    color: (stage && stage.color) || this._pipelineService.getStageDefaultColorByStageSortOrder(stage && stage.sortOrder),
                    type: 'stackedBar',
                    sortOrder: stage && stage.sortOrder
                };
            })
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
        let date = moment(pointInfo.argument);
        moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);

        const leadsArePresent = pointInfo.points.length > this.series.length;
        html += `<header class="tooltip-header">${date.format('MMM YYYY')}</header>`;
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
                        ${point.seriesName}
                        <span class="tooltip-item-value">${point.value}</span>
                     </div>`;
        }
        return { html: html };
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
        return month + ' ' + date;
    }

    render(component?: any) {
        component = component || this.chartComponent
            && this.chartComponent.instance;
        if (component) {
            clearTimeout(this.renderTimeout);
            this.renderTimeout = setTimeout(
                () => component.render()
            , 300);
        }
    }

    ngOnDestroy() {
        super.ngOnDestroy();
    }
}
