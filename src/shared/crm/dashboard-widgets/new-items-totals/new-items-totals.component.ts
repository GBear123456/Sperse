/** Core imports */
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

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
    totalsData$: Observable<GetTotalsOutput> = this._dashboardService.totalsData$;
    totalsDataAvailable$: Observable<boolean> = this._dashboardService.totalsDataAvailable$;
    totalsDataLoading$ = this._dashboardService.totalsDataLoading$.pipe(takeUntil(this._lifeCycleService.destroy$));

    constructor(
        private _lifeCycleService: LifecycleSubjectsService,
        private _dashboardService: DashboardWidgetsService,
        private _loadingService: LoadingService,
        private _elementRef: ElementRef,
        public ls: AppLocalizationService
    ) {
        this.fields = this._dashboardService.totalsDataFields;
    }

    ngOnInit() {
        this.totalsDataLoading$.pipe(takeUntil(this._lifeCycleService.destroy$)).subscribe((loading: boolean) => {
            loading
                ? this._loadingService.startLoading(this._elementRef.nativeElement)
                : this._loadingService.finishLoading(this._elementRef.nativeElement);
        });
    }

    ngOnDestroy() {
        this._lifeCycleService.destroy.next();
    }
}
