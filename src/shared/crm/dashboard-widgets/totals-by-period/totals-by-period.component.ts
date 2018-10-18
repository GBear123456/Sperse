/** Core imports */
import { Component, OnInit, Injector, OnDestroy } from '@angular/core';

/** Third party imports */
import { Observable, of } from 'rxjs';
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
import { Store } from '@ngrx/store';

/** Application imports */
import { CrmStore, PipelinesStoreSelectors } from '@app/crm/store';
import { TotalsByPeriodModel } from './totals-by-period.model';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardServiceProxy, GroupBy, GroupBy2 } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { AppConsts } from '@shared/AppConsts';
import { GetCustomerAndLeadStatsOutput } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'totals-by-period',
    templateUrl: './totals-by-period.component.html',
    styleUrls: ['./totals-by-period.component.less'],
    providers: [ DashboardServiceProxy ]
})
export class TotalsByPeriodComponent extends AppComponentBase implements OnInit, OnDestroy {
    totalsData: any[] = [];
    totalsData$: Observable<GetCustomerAndLeadStatsOutput[]>;
    startDate: any;
    endDate: any;
    chartWidth = 650;
    currency = 'USD';

    clientColor = '#8487e7';
    leadColor = '#54e4c9';

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
    selectedPeriod: TotalsByPeriodModel = this.periods.find(period => period.name === 'Daily');
    private series = [
        {
            axis: 'total',
            type: 'spline',
            valueField: 'customerCount',
            name: this.l('Client Count'),
            color: this.clientColor
        }/*,
        {
            valueField: 'leadTotalCount',
            name: 'Total',
            color: 'red',
            type: 'fullstackedbar'
        }*/
    ];
    allSeries$: Observable<any>;
    leadStagesSeries$: Observable<any>;

    constructor(injector: Injector,
        private _dashboardServiceProxy: DashboardServiceProxy,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private store$: Store<CrmStore.State>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        this.totalsData$ = this._dashboardWidgetsService.period$.pipe(
            takeUntil(this.destroy$),
            map(period => this.savePeriod(period)),
            switchMap(period => this.loadCustomersAndLeadsStats(period)),
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

        /** Merge default series config for clients and dynamic leads series configs after period change */
        this.allSeries$ = this.leadStagesSeries$.pipe(
            withLatestFrom(of(this.series), ((leadStagesSeries , allSeries) => [ ...leadStagesSeries, ...allSeries ]))
        );
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

    private loadCustomersAndLeadsStats(period: any): Observable<GetCustomerAndLeadStatsOutput[]> {
        this.startLoading();
        return this._dashboardServiceProxy.getCustomerAndLeadStats(
            GroupBy2[period.name],
            period.amount,
            true
        ).pipe(finalize(() => { this.finishLoading(); }) );
    }

    private convertLeadsStatsToSeriesConfig(data) {
        return of(data).pipe(
            mergeAll(),
            pluck('leadStageCount'),
            mergeMap(leadsStages => Object.keys(leadsStages)),
            distinct(),
            switchMap(stageId => this.getLeadStageSeriaConfig(stageId)),
            toArray()
        );
    }

    private getLeadStageSeriaConfig(stageId: number): Observable<any> {
        return this.store$.select(PipelinesStoreSelectors.getStageColorByStageId({
            purpose: AppConsts.PipelinePurposeIds.lead,
            stageId: stageId
        })).pipe(
            first(),
            map(color => {
                return {
                    valueField: stageId,
                    name: stageId,
                    color: color,
                    type: 'fullstackedbar'
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

    /** Factory for method that customize axis */

    getMonthlyBottomAxisCustomizer(elem) {
        return `${elem.valueText.substring(0, 3).toUpperCase()}<br/><div class="yearArgument">${elem.value.getFullYear().toString().substr(-2)}</div>`;
    }

    getWeeklyBottomAxisCustomizer(elem) {
        return `${elem.value.getDate()}.${elem.value.getMonth() + 1}`;
    }

    getDailyBottomAxisCustomizer(elem) {
        return elem.value.toDateString().split(' ').splice(1, 2).join(' ');
    }

    onDrawn($event) {
        setTimeout(() => $event.component.render(), 1000);
    }

    ngOnDestroy() {
        super.ngOnDestroy();
    }
}
