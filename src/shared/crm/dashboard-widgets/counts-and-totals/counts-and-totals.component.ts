/** Core imports */
import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ElementRef, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { filter, takeUntil } from 'rxjs/operators';

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
    fields = this._dashboardService.totalsDataFields;
    totalsDataLoading$ = this._dashboardService.totalsDataLoading$.pipe(takeUntil(this._lifeCycleService.destroy$));

    constructor(
        private _dashboardService: DashboardWidgetsService,
        private _lifeCycleService: LifecycleSubjectsService,
        private _loadingService: LoadingService,
        private _elementRef: ElementRef,
        private _changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this._dashboardService.totalsData$
            .pipe(takeUntil(this._lifeCycleService.destroy$))
            .subscribe((totalsData: GetTotalsOutput) => {
                this.data = totalsData;
                this.fields.forEach((field) => {
                    field.percent = this._dashboardService.getPercentage(
                        totalsData[field.name.replace('total', 'new')],
                        totalsData[field.name]
                    );
                });
                this._changeDetectorRef.detectChanges();
            });

        this.totalsDataLoading$.pipe(
            takeUntil(this._lifeCycleService.destroy$)
        ).subscribe((loading: boolean) => {
            loading
                ? this._loadingService.startLoading(this._elementRef.nativeElement)
                : this._loadingService.finishLoading(this._elementRef.nativeElement);
        });
    }

    ngOnDestroy() {
        this._lifeCycleService.destroy.next();
    }
}
