/** Core imports */
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/** Application imports */
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { GetTotalsOutput } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'new-items-totals',
    templateUrl: './new-items-totals.component.html',
    styleUrls: ['./new-items-totals.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewItemsTotalsComponent implements OnDestroy, OnInit {
    fields: any;
    totalsData$: Observable<GetTotalsOutput> = this.dashboardService.totalsData$;
    totalsDataAvailable$: Observable<boolean> = this.dashboardService.totalsDataAvailable$;
    totalsDataLoading$ = this.dashboardService.totalsDataLoading$.pipe(takeUntil(this.lifeCycleService.destroy$));

    constructor(
        private lifeCycleService: LifecycleSubjectsService,
        private dashboardService: DashboardWidgetsService,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        public ls: AppLocalizationService
    ) {
        this.fields = this.dashboardService.totalsDataFields;
    }

    ngOnInit() {
        this.totalsDataLoading$.pipe(takeUntil(this.lifeCycleService.destroy$)).subscribe((loading: boolean) => {
            loading
                ? this.loadingService.startLoading(this.elementRef.nativeElement)
                : this.loadingService.finishLoading(this.elementRef.nativeElement);
        });
    }

    ngOnDestroy() {
        this.lifeCycleService.destroy.next();
    }
}
