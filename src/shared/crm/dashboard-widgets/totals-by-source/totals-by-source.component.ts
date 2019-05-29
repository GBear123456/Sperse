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
import { Observable, combineLatest } from 'rxjs';
import { finalize, publishReplay, refCount, switchMap, tap, map, takeUntil } from 'rxjs/operators';

/** Application imports */
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { GetCustomersByCompanySizeOutput } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    selector: 'totals-by-source',
    templateUrl: './totals-by-source.component.html',
    styleUrls: ['./totals-by-source.component.less'],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalsBySourceComponent implements OnInit, OnDestroy {
    @ViewChild(DxPieChartComponent) chartComponent: DxPieChartComponent;
    customersByCompanySize$: Observable<GetCustomersByCompanySizeOutput[]>;
    totalCustomersCount$: Observable<number>;
    totalCustomersCount: number;
    rangeColors = [
        '#00aeef',
        '#8487e7',
        '#86c45d',
        '#f7d15e',
        '#ecf0f3'
    ];

    percentage: string;
    rangeCount: number;
    rangeName: string;
    rangeColor: string;
    totalNumbersTop: string;
    constructor(
        private _dashboardWidgetsService: DashboardWidgetsService,
        private _dashboardServiceProxy: DashboardServiceProxy,
        private _elementRef: ElementRef,
        private _loadingService: LoadingService,
        private _lifeCycleService: LifecycleSubjectsService,
        private _changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.customersByCompanySize$ = combineLatest(
            this._dashboardWidgetsService.period$,
            this._dashboardWidgetsService.refresh$
        ).pipe(
            takeUntil(this._lifeCycleService.destroy$),
            tap(() => this._loadingService.startLoading(this._elementRef.nativeElement)),
            switchMap(([period]: [PeriodModel]) => this._dashboardServiceProxy.getCustomersByCompanySize(period && period.from, period && period.to).pipe(finalize(() => this._loadingService.finishLoading(this._elementRef.nativeElement)))),
            map((customersByCompanySize: GetCustomersByCompanySizeOutput[]) => {
                return customersByCompanySize
                    .sort(this.sortCustomers)
                    .map((customer: GetCustomersByCompanySizeOutput) => {
                        if (!customer.companySizeRange)
                            customer.companySizeRange = 'Unknown';
                        return customer;
                    });
            }),
            publishReplay(),
            refCount()
        );

        this.totalCustomersCount$ = this.customersByCompanySize$.pipe(
            map((customersByCompanySize: GetCustomersByCompanySizeOutput[]) => {
                return customersByCompanySize
                    .reduce((total: number, customer: GetCustomersByCompanySizeOutput) => total + customer.customerCount, 0);
            })
        );
        this.totalCustomersCount$.subscribe((totalCustomersCount: number) => {
            this.totalCustomersCount = totalCustomersCount;
            this._changeDetectorRef.detectChanges();
        });
    }

    sortCustomers = (a, b) => {
        return (parseInt(a.companySizeRange) || Infinity) > (parseInt(b.companySizeRange) || Infinity) ? 1 : -1;
    }

    customizePoint = (data) => {
        return {
            color: this.rangeColors[data.index]
        };
    }

    onPointHoverChanged($event) {
        let isHoverIn = $event.target.fullState, item = $event.target;
        this.percentage = isHoverIn ? (item.percent * 100).toFixed(1) + '%' : '';
        this.rangeCount = (isHoverIn ? item.initialValue : this.totalCustomersCount).toLocaleString('en');
        this.rangeColor = isHoverIn ? this.rangeColors[item.index] : undefined;
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
