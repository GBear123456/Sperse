/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { DxPieChartComponent } from 'devextreme-angular/ui/pie-chart';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import {
    finalize,
    publishReplay,
    refCount,
    switchMap,
    tap,
    takeUntil,
    map,
    pluck,
    withLatestFrom
} from 'rxjs/operators';

/** Application imports */
import { DashboardServiceProxy, StageDto } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { ITotalOption } from '@app/crm/dashboard/total-options.interface';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { ContactGroup } from '@shared/AppEnums';

@Component({
    selector: 'totals-by-source',
    templateUrl: './totals-by-source.component.html',
    styleUrls: ['./totals-by-source.component.less'],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalsBySourceComponent implements OnInit, OnDestroy {
    @ViewChild(DxPieChartComponent) chartComponent: DxPieChartComponent;
    data$: Observable<any[]>;
    totalCount$: Observable<number>;
    totalCount: string;
    rangeColors = [
        '#00aeef',
        '#8487e7',
        '#86c45d',
        '#f7d15e',
        '#ecf0f3'
    ];
    rawData: any[];
    percentage: string;
    rangeCount: string;
    rangeName: string;
    rangeColor: string;
    totalNumbersTop: string;
    totalsOptions: ITotalOption[] = [
        {
            key: 'star',
            label: this.ls.l('TotalsByStar/CreditRating'),
            method: this._dashboardServiceProxy.getCustomersByStar,
            argumentField: 'key',
            valueField: 'count'
        },
        {
            key: 'stageDistribution',
            label: this.ls.l('TotalsByStageDistribution'),
            method: this._dashboardServiceProxy.getLeadsCountByStage,
            argumentField: 'key',
            valueField: 'count',
            getColor: (stageName: string) => {
                const stage: StageDto = this._pipelineService.getStageByName('Lead', stageName);
                return this._pipelineService.getStageDefaultColorByStageSortOrder(stage.sortOrder);
            }
        },
        {
            key: 'ageDistribution',
            label: this.ls.l('TotalsByLeadAgeDistribution'),
            method: this._dashboardServiceProxy.getContactsCountByAge,
            argumentField: 'key',
            valueField: 'count'
        },
        {
            key: 'companySize',
            label: this.ls.l('TotalsByCompanySize'),
            method: this._dashboardServiceProxy.getCustomersByCompanySize,
            argumentField: 'companySizeRange',
            valueField: 'customerCount',
            sorting: (a, b) => {
                return (parseInt(a.companySizeRange) || Infinity) > (parseInt(b.companySizeRange) || Infinity) ? 1 : -1;
            }
        },
        {
            key: 'rating',
            label: this.ls.l('TotalsByRating'),
            method: this._dashboardServiceProxy.getCustomersByRating,
            argumentField: 'key',
            valueField: 'count'
        }
    ];
    selectedTotal: BehaviorSubject<ITotalOption> = new BehaviorSubject<ITotalOption>(
        this._appSession.tenant && this._appSession.tenant.customLayoutType === LayoutType.LendSpace
        ? this.totalsOptions.find(option => option.key === 'star')
        : this.totalsOptions.find(option => option.key === 'companySize')
    );
    selectedTotal$: Observable<ITotalOption> = this.selectedTotal.asObservable();
    selectedArgumentField$: Observable<string> = this.selectedTotal$.pipe(pluck('argumentField'));
    selectedValueField$: Observable<string> = this.selectedTotal$.pipe(pluck('valueField'));
    loading = false;

    constructor(
        private _dashboardWidgetsService: DashboardWidgetsService,
        private _dashboardServiceProxy: DashboardServiceProxy,
        private _elementRef: ElementRef,
        private _loadingService: LoadingService,
        private _lifeCycleService: LifecycleSubjectsService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _appSession: AppSessionService,
        private _pipelineService: PipelineService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        /** Get pipeline definitions to get colors for stage distributions */
        this._pipelineService.getPipelineDefinitionObservable('Lead', ContactGroup.Client).subscribe();
        this.data$ = combineLatest(
            this.selectedTotal$,
            this._dashboardWidgetsService.period$,
            this._dashboardWidgetsService.refresh$,
        ).pipe(
            takeUntil(this._lifeCycleService.destroy$),
            tap(() => {
                this.loading = true;
                this._loadingService.startLoading(this._elementRef.nativeElement);
            }),
            switchMap(([selectedTotal, period]: [ITotalOption, PeriodModel]) => selectedTotal.method.call(
                this._dashboardServiceProxy, period && period.from || new Date('2000-01-01'), period && period.to || new Date()).pipe(
                    finalize(() => this._loadingService.finishLoading(this._elementRef.nativeElement))
                )
            ),
            map((data: any[]) => {
                this.rawData = data;
                return (this.selectedTotal.value.sorting ? data.sort(this.selectedTotal.value.sorting) : data)
                    .map((item: any) => {
                        item[this.selectedTotal.value.argumentField] = this.ls.l(
                            item[this.selectedTotal.value.argumentField] || 'Unknown');
                        return item;
                    });
            }),
            tap(() => this.loading = false),
            publishReplay(),
            refCount()
        );

        this.totalCount$ = this.data$.pipe(
            withLatestFrom(this.selectedValueField$),
            map(([data, valueField]: [any[], string]) => data.reduce((total: number, customer: any) => {
                return total + customer[valueField];
            }, 0))
        );
        this.totalCount$.subscribe((totalCount: number) => {
            this.rangeCount = this.totalCount = totalCount.toLocaleString('en');
        });
    }

    customizePoint = (data) => {
        return {
            color: this.getItemColor(data)
        };
    }

    private getItemColor(item) {
        return this.rawData[item.index].colorType || (
            this.selectedTotal.value.getColor ?
            this.selectedTotal.value.getColor(item.argument) :
            this.rangeColors[item.index]
        );
    }

    onPointHoverChanged($event) {
        let isHoverIn = $event.target.fullState, item = $event.target;
        this.percentage = isHoverIn ? (item.percent * 100).toFixed(1) + '%' : '';
        this.rangeCount = (isHoverIn ? item.initialValue : this.totalCount).toLocaleString('en');
        this.rangeColor = isHoverIn ? this.getItemColor(item) : undefined;
        this.rangeName = item.argument;
        this._changeDetectorRef.detectChanges();
    }

    onDrawn(e) {
        this.updatePieChartTopPositions(e);
    }

    private updatePieChartTopPositions(e) {
        const componentTop = this._elementRef.nativeElement.getBoundingClientRect().top;
        const circleBoundingRect = e.component.getAllSeries()[0]._group.element.getBoundingClientRect();
        const circleTop = circleBoundingRect.top;
        const circleCenterY = circleTop - componentTop + circleBoundingRect.height / 2;
        this.totalNumbersTop = circleCenterY - 55 + 'px';
        this._changeDetectorRef.detectChanges();
    }

    ngOnDestroy() {
        this._lifeCycleService.destroy.next();
    }
}
