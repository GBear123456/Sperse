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
import { combineLatest } from 'rxjs';
import { finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import * as mapsData from 'devextreme/dist/js/vectormap-data/usa.js';
import { DxVectorMapComponent } from 'devextreme-angular/ui/vector-map';

/** Application imports */
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { GetContactsByRegionOutput } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'clients-by-region',
    templateUrl: './clients-by-region.component.html',
    styleUrls: ['./clients-by-region.component.less'],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsByRegionComponent implements OnInit, OnDestroy {
    @ViewChild(DxVectorMapComponent) mapComponent: DxVectorMapComponent;
    usaMap: any = mapsData.usa;
    gdpData: any = {};
    pipe: any = new DecimalPipe('en-US');

    constructor(
        private _dashboardWidgetsService: DashboardWidgetsService,
        private _dashboardServiceProxy: DashboardServiceProxy,
        private _loadingService: LoadingService,
        private _ls: AppLocalizationService,
        private _elementRef: ElementRef,
        private _lifeCycleService: LifecycleSubjectsService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit() {
        combineLatest(
            this._dashboardWidgetsService.period$,
            this._dashboardWidgetsService.refresh$
        ).pipe(
            takeUntil(this._lifeCycleService.destroy$),
            tap(() => this._loadingService.startLoading(this._elementRef.nativeElement)),
            switchMap(([period]: [PeriodModel]) => {
                return this._dashboardServiceProxy.getContactsByRegion(period && period.from, period && period.to)
                    .pipe(finalize(() => this._loadingService.finishLoading(this._elementRef.nativeElement)));
            })
        ).subscribe((contactsByRegion: GetContactsByRegionOutput[]) => {
            this.gdpData = {};
            contactsByRegion.forEach((val) => {
                this.gdpData[val.stateId] = {
                    name: val.stateId  || 'Other',
                    total: val.count
                };
            });
            this.mapComponent.instance.getLayerByName('areas').getDataSource().reload();
            this._changeDetectorRef.detectChanges();
        });
    }

    customizeTooltip = (arg) => {
        let stateData = this.gdpData[arg.attribute('postal')];
        let total = stateData && stateData.total;
        let totalMarkupString = total ? '<div id="nominal"><b>' + total + '</b> ' + this._ls.l('contacts') + '</div>' : '<div>' + this._ls.l('CRMDashboard_NoData') + '</div>';
        let node = '<div #gdp>' + '<h5>' + arg.attribute('name') + '</h5>' + totalMarkupString + '</div>';
        return {
            html: node
        };
    }

    customizeLayers = (elements) => {
        elements.forEach((element) => {
            let stateData = this.gdpData[element.attribute('postal')];
            element.attribute('total', stateData && stateData.total || 0);
        });
    }

    customizeText = (arg) => this.pipe.transform(arg.start, '1.0-0') +
        ' to ' + this.pipe.transform(arg.end, '1.0-0')

    ngOnDestroy() {
        this._lifeCycleService.destroy.next();
    }
}
