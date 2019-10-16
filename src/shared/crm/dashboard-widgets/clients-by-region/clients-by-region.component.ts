/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    ViewChild,
    OnInit,
    ElementRef,
    ChangeDetectorRef, OnDestroy
} from '@angular/core';
import { DecimalPipe } from '@angular/common';

/** Third party imports */
import { combineLatest, of } from 'rxjs';
import { catchError, finalize, switchMap, takeUntil, tap } from 'rxjs/operators';

/** Application imports */
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { GetContactsByRegionOutput } from '@shared/service-proxies/service-proxies';
import { MapComponent } from '@app/shared/common/slice/map/map.component';
import { MapData } from '@app/shared/common/slice/map/map-data.model';
import { MapService } from '@app/shared/common/slice/map/map.service';

@Component({
    selector: 'clients-by-region',
    templateUrl: './clients-by-region.component.html',
    styleUrls: ['./clients-by-region.component.less'],
    providers: [ LifecycleSubjectsService, MapService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsByRegionComponent implements OnInit, OnDestroy {
    @ViewChild(MapComponent) mapComponent: MapComponent;
    data: MapData = {};
    pipe: any = new DecimalPipe('en-US');
    palette: string[] = ['#c1b9ff', '#b6abff', '#aa9eff', '#9e91ff', '#9383ff', '#8776ff', '#7b69ff', '#705bff'];
    colorGroups: number[] = [ 1, 10, 100, 500, 1000, 2500, 5000, 10000, 50000 ];

    constructor(
        private dashboardWidgetsService: DashboardWidgetsService,
        private dashboardServiceProxy: DashboardServiceProxy,
        private loadingService: LoadingService,
        private ls: AppLocalizationService,
        private elementRef: ElementRef,
        private lifeCycleService: LifecycleSubjectsService,
        private changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit() {
        combineLatest(
            this.dashboardWidgetsService.period$,
            this.dashboardWidgetsService.refresh$
        ).pipe(
            takeUntil(this.lifeCycleService.destroy$),
            tap(() => this.loadingService.startLoading(this.elementRef.nativeElement)),
            switchMap(([period]: [PeriodModel]) => {
                return this.dashboardServiceProxy.getContactsByRegion(period && period.from, period && period.to).pipe(
                    catchError(() => of([])),
                    finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
                );
            })
        ).subscribe((contactsByRegion: GetContactsByRegionOutput[]) => {
            this.data = {};
            contactsByRegion.forEach((val: GetContactsByRegionOutput) => {
                this.data[val.stateId] = {
                    name: val.stateId || 'Other',
                    total: val.count
                };
            });
            if (this.mapComponent.vectorMapComponent.instance['_layerCollection']) {
                this.mapComponent.vectorMapComponent.instance.getLayerByName('areas').getDataSource().reload();
                this.changeDetectorRef.detectChanges();
            }
        });
    }

    ngOnDestroy() {
        this.lifeCycleService.destroy.next();
    }
}
