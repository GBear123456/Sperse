/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    ElementRef,
    ChangeDetectorRef, OnDestroy
} from '@angular/core';
import { DecimalPipe } from '@angular/common';

/** Third party imports */
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, finalize, switchMap, takeUntil, tap, map } from 'rxjs/operators';

/** Application imports */
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { GetContactsByRegionOutput } from '@shared/service-proxies/service-proxies';
import { MapData } from '@app/shared/common/slice/map/map-data.model';
import { MapService } from '@app/shared/common/slice/map/map.service';
import { LayoutService } from '@app/shared/layout/layout.service';

@Component({
    selector: 'clients-by-region',
    templateUrl: './clients-by-region.component.html',
    styleUrls: ['./clients-by-region.component.less'],
    providers: [ LifecycleSubjectsService, MapService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsByRegionComponent implements OnInit, OnDestroy {
    data$: Observable<MapData>;
    pipe: any = new DecimalPipe('en-US');
    palette: string[] = this.layoutService.getMapPalette();

    constructor(
        private dashboardWidgetsService: DashboardWidgetsService,
        private dashboardServiceProxy: DashboardServiceProxy,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        private lifeCycleService: LifecycleSubjectsService,
        private changeDetectorRef: ChangeDetectorRef,
        private layoutService: LayoutService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.data$ = combineLatest(
            this.dashboardWidgetsService.period$,
            this.dashboardWidgetsService.refresh$
        ).pipe(
            takeUntil(this.lifeCycleService.destroy$),
            tap(() => this.loadingService.startLoading(this.elementRef.nativeElement)),
            switchMap(([period, refresh]: [PeriodModel, null]) => this.dashboardServiceProxy.getContactsByRegion(period && period.from, period && period.to).pipe(
                catchError(() => of([])),
                finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
            )),
            map((contactsByRegion: GetContactsByRegionOutput[]) => {
                let data = {};
                contactsByRegion.forEach((val: GetContactsByRegionOutput) => {
                    data[val.stateId] = {
                        name: val.stateId || 'Other',
                        total: val.count
                    };
                });
                return data;
            })
        );
    }

    ngOnDestroy() {
        this.lifeCycleService.destroy.next();
    }
}
