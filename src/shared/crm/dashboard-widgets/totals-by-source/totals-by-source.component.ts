/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    EventEmitter,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
    Input,
    Output
} from '@angular/core';

/** Third party imports */
import { DxPieChartComponent } from 'devextreme-angular/ui/pie-chart';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import {
    catchError,
    finalize,
    first,
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
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { ITotalOption } from '@app/crm/dashboard/total-options.interface';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { ContactGroup } from '@shared/AppEnums';
import { LayoutService } from '@app/shared/layout/layout.service';
import { StarsHelper } from '@shared/common/stars-helper/stars-helper';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'totals-by-source',
    templateUrl: './totals-by-source.component.html',
    styleUrls: ['./totals-by-source.component.less'],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalsBySourceComponent implements OnInit, OnDestroy {
    @ViewChild(DxPieChartComponent, { static: false }) chartComponent: DxPieChartComponent;
    @Input() waitFor$: Observable<any> = of().pipe(
        publishReplay(), refCount()
    );
    @Output() loadComplete: EventEmitter<any> = new EventEmitter();

    data$: Observable<any[]>;
    totalCount$: Observable<number>;
    totalCount: string;
    rangeColors = [
        this.layoutService.getLayoutColor('blue'),
        this.layoutService.getLayoutColor('purple'),
        this.layoutService.getLayoutColor('green'),
        this.layoutService.getLayoutColor('orange'),
        '#ecf0f3'
    ];
    rawData: any[];
    percentage: string;
    rangeCount: string;
    rangeName: string;
    rangeColor: string;
    totalNumbersTop: string;
    totalsOptions: ITotalOption[] = [
        ...(!this.appSession.tenant || this.appSession.tenant.customLayoutType !== LayoutType.BankCode ?
            [
                {
                    key: 'star',
                    label: this.ls.l('TotalsByStar/CreditRating'),
                    method: this.dashboardServiceProxy.getContactsByStar,
                    argumentField: 'key',
                    valueField: 'count',
                    getColor: (item) => {
                        return StarsHelper.getStarColorByType(this.rawData[item.index].colorType);
                    }
                },
                {
                    key: 'stageDistribution',
                    label: this.ls.l('TotalsByStageDistribution'),
                    method: this.dashboardServiceProxy.getLeadsCountByStage,
                    argumentField: 'key',
                    valueField: 'count',
                    getColor: (item) => {
                        const stage: StageDto = this.pipelineService.getStageByName(
                            AppConsts.PipelinePurposeIds.lead, item.argument, this.selectedContactGroupId
                        );
                        return stage && this.pipelineService.getStageDefaultColorByStageSortOrder(stage.sortOrder);
                    }
                },
                {
                    key: 'ageDistribution',
                    label: this.ls.l('TotalsByLeadAgeDistribution'),
                    method: this.dashboardServiceProxy.getLeadsCountByAge,
                    argumentField: 'key',
                    valueField: 'count'
                },
                {
                    key: 'companySize',
                    label: this.ls.l('TotalsByCompanySize'),
                    method: this.dashboardServiceProxy.getContactsByCompanySize,
                    argumentField: 'companySizeRange',
                    valueField: 'contactCount',
                    sorting: (a, b) => {
                        return (parseInt(a.companySizeRange) || Infinity) > (parseInt(b.companySizeRange) || Infinity) ? 1 : -1;
                    }
                },
                {
                    key: 'rating',
                    label: this.ls.l('TotalsByRating'),
                    method: this.dashboardServiceProxy.getContactsByRating,
                    argumentField: 'key',
                    valueField: 'count'
                }
            ] : [{
                key: 'star',
                label: this.ls.l('TotalsByStar/CreditRating'),
                method: this.dashboardServiceProxy.getContactsByStar,
                argumentField: 'key',
                valueField: 'count',
                getColor: (item) => {
                    return StarsHelper.getStarColorByType(this.rawData[item.index].colorType);
                }
            }]
        )
    ];
    lastSelectedTotal: ITotalOption = 
        this.appSession.tenant && this.appSession.tenant.customLayoutType === LayoutType.LendSpace ||
        this.appSession.tenant && this.appSession.tenant.customLayoutType === LayoutType.BankCode ?
            this.totalsOptions.find(option => option.key === 'star') :
            this.totalsOptions.find(option => option.key === 'companySize');
    selectedTotal: BehaviorSubject<ITotalOption> = new BehaviorSubject<ITotalOption>(this.lastSelectedTotal);
    selectedTotal$: Observable<ITotalOption> = this.selectedTotal.asObservable();
    selectedArgumentField$: Observable<string> = this.selectedTotal$.pipe(pluck('argumentField'));
    selectedValueField$: Observable<string> = this.selectedTotal$.pipe(pluck('valueField'));
    selectedContactGroupId: ContactGroup = ContactGroup.Client;
    loading = false;

    constructor(
        private dashboardWidgetsService: DashboardWidgetsService,
        private dashboardServiceProxy: DashboardServiceProxy,
        private elementRef: ElementRef,
        private loadingService: LoadingService,
        private lifeCycleService: LifecycleSubjectsService,
        private changeDetectorRef: ChangeDetectorRef,
        private appSession: AppSessionService,
        private pipelineService: PipelineService,
        private layoutService: LayoutService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.data$ = combineLatest(
            this.selectedTotal$,
            this.dashboardWidgetsService.period$,
            this.dashboardWidgetsService.contactGroupId$,
            this.dashboardWidgetsService.contactId$,
            this.dashboardWidgetsService.sourceOrgUnitIds$,
            this.dashboardWidgetsService.refresh$
        ).pipe(
            takeUntil(this.lifeCycleService.destroy$),
            tap(() => {
                this.loading = true;
                this.loadingService.startLoading(this.elementRef.nativeElement);
            }),
            switchMap(([selectedTotal, period, groupId, contactId, orgUnitIds, ]: [ITotalOption, PeriodModel, string, number, number[], null]) => {
                this.pipelineService.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.lead, this.selectedContactGroupId = groupId).subscribe();
                return (this.lastSelectedTotal != selectedTotal ? of(selectedTotal) : this.waitFor$).pipe(first(), switchMap(() =>
                    selectedTotal.method.call(
                        this.dashboardServiceProxy, period && period.from || new Date('2000-01-01'),
                        period && period.to || new Date(), groupId, contactId, orgUnitIds
                    ).pipe(
                        catchError(() => of([])),
                        finalize(() => {
                            this.loadComplete.next();
                            this.lastSelectedTotal = selectedTotal;
                            this.loadingService.finishLoading(this.elementRef.nativeElement);
                        })
                    )
                ));
            }),
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
        let total = this.selectedTotal.value;
        return item.argument == 'Unknown'
            ? '#bbb'
            : total && total.getColor ? total.getColor(item) : this.rangeColors[item.index];
    }

    onPointHoverChanged($event) {
        let isHoverIn = $event.target.fullState, item = $event.target;
        this.percentage = isHoverIn ? (item.percent * 100).toFixed(1) + '%' : '';
        this.rangeCount = (isHoverIn ? item.initialValue : this.totalCount).toLocaleString('en');
        this.rangeColor = isHoverIn ? this.getItemColor(item) : undefined;
        this.rangeName = item.argument;
        this.changeDetectorRef.detectChanges();
    }

    onDrawn(e) {
        setTimeout(() => {
            this.updatePieChartTopPositions(e);
        }, 600);
    }

    private updatePieChartTopPositions(e) {
        const componentTop = this.elementRef.nativeElement.getBoundingClientRect().top;
        const chart = e.element.querySelector('.dxc-series');
        if (componentTop && chart) {
            const circleBoundingRect = chart.getBoundingClientRect();
            const circleTop = circleBoundingRect.top;
            const circleCenterY = circleTop - componentTop + (circleBoundingRect.height) / 2;
            this.totalNumbersTop = circleCenterY - 55 + 'px';
            this.changeDetectorRef.detectChanges();
        }
    }

    ngOnDestroy() {
        this.lifeCycleService.destroy.next();
    }
}
