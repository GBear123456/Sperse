/** Core imports */
import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ElementRef, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { takeUntil } from 'rxjs/operators';

/** Application imports */
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { GetTotalsOutput } from '@shared/service-proxies/service-proxies';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'counts-and-totals',
    templateUrl: './counts-and-totals.component.html',
    styleUrls: ['./counts-and-totals.component.less'],
    providers: [ DashboardServiceProxy, LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountsAndTotalsComponent implements OnInit, OnDestroy {
    data: GetTotalsOutput;
    fields = this.dashboardService.totalsDataFields;
    totalsDataLoading$ = this.dashboardService.totalsDataLoading$.pipe(takeUntil(this.lifeCycleService.destroy$));

    constructor(
        private dashboardService: DashboardWidgetsService,
        private lifeCycleService: LifecycleSubjectsService,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.dashboardService.totalsData$
            .pipe(takeUntil(this.lifeCycleService.destroy$))
            .subscribe((totalsData: GetTotalsOutput) => {
                this.data = totalsData;
                this.fields.forEach((field) => {
                    field.percent = this.dashboardService.getPercentage(
                        totalsData[field.name.replace('total', 'new')],
                        totalsData[field.name]
                    );
                });
                this.changeDetectorRef.detectChanges();
            });

        this.totalsDataLoading$.pipe(
            takeUntil(this.lifeCycleService.destroy$)
        ).subscribe((loading: boolean) => {
            loading
                ? this.loadingService.startLoading(this.elementRef.nativeElement)
                : this.loadingService.finishLoading(this.elementRef.nativeElement);
        });
    }

    ngOnDestroy() {
        this.lifeCycleService.destroy.next();
    }
}
