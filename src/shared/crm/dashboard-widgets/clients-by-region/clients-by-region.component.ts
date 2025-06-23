/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    OnDestroy,
    OnInit,
    ViewChild,
    Input,
    Output
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Params, Router } from '@angular/router';

/** Third party imports */
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, first, finalize, map, switchMap, 
    takeUntil, tap, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { GetContactsByRegionOutput } from '@shared/service-proxies/service-proxies';
import { MapComponent } from '@app/shared/common/slice/map/map.component';
import { MapData } from '@app/shared/common/slice/map/map-data.model';
import { MapService } from '@app/shared/common/slice/map/map.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { MapArea } from '@app/shared/common/slice/map/map-area.enum';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { ContactGroup } from '@shared/AppEnums';
import { PeriodModel } from '@app/shared/common/period/period.model';

@Component({
    selector: 'clients-by-region',
    templateUrl: './clients-by-region.component.html',
    styleUrls: ['./clients-by-region.component.less'],
    providers: [
        LifecycleSubjectsService,
        MapService,
        { provide: 'selectedMapArea', useValue: MapArea.World }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsByRegionComponent implements OnDestroy {
    @ViewChild(MapComponent, { static: true }) mapComponent: MapComponent;
    @Input() waitFor$: Observable<any> = of().pipe(
        publishReplay(), refCount()
    );
    @Output() loadComplete: EventEmitter<any> = new EventEmitter();

    data$: Observable<MapData> = combineLatest(
        this.dashboardWidgetsService.period$,
        this.dashboardWidgetsService.contactId$,
        this.dashboardWidgetsService.contactGroupId$,
        this.dashboardWidgetsService.sourceOrgUnitIds$,            
        this.dashboardWidgetsService.refresh$
    ).pipe(
        takeUntil(this.lifeCycleService.destroy$),
        tap(() => this.loadingService.startLoading(this.elementRef.nativeElement)),
        switchMap(([period, contactId, groupId, orgUnitIds, ]: [PeriodModel, number, ContactGroup, number[], null]) => {
            return this.waitFor$.pipe(first(), switchMap(() =>
                this.dashboardServiceProxy.getContactsByRegion(
                    period && period.from,
                    period && period.to,
                    String(groupId),
                    contactId,
                    orgUnitIds
                ).pipe(
                    catchError(() => of([])),
                    finalize(() => {
                        this.loadComplete.emit();
                        this.loadingService.finishLoading(this.elementRef.nativeElement);
                    })
                ))
            );
        }),
        map((contactsByRegion: GetContactsByRegionOutput[]) => {
            let data = {};
            contactsByRegion.forEach((val: GetContactsByRegionOutput) => {
                if (!data[val.countryId]) {
                    data[val.countryId] = {};
                }
                data[val.countryId][val.stateId] = {
                    name: val.stateId || 'Other',
                    total: val.count
                };
            });
            return data;
        })
    );

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
        private router: Router,
        public ls: AppLocalizationService
    ) {}

    redirectToContacts(params: Params) {
        this.dashboardWidgetsService.period$.pipe(
            first()
        ).subscribe((period: PeriodModel) => {
            this.router.navigate(
                ['app', 'crm', 'leads' ],
                {
                    queryParams: {
                        dataLayoutType: DataLayoutType.DataGrid,
                        contactGroup: Object.keys(ContactGroup).shift(),
                        startDate: period.from ? period.from.toJSON() : 'null',
                        endDate: period.to ? period.to.toJSON() : 'null',
                        ...params
                    }
                }
            );
        });
    }

    ngOnDestroy() {
        this.lifeCycleService.destroy.next();
    }
}
