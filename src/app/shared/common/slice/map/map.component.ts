/** Core imports */
import { ChangeDetectionStrategy, Component, ViewChild, Input, SimpleChanges, OnChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';

/** Third party imports */
import { DxVectorMapComponent } from 'devextreme-angular/ui/vector-map';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';

/** Application imports */
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';
import { MapData } from '@app/shared/common/slice/map/map-data.model';
import { ImageFormat } from '@shared/common/export/image-format.enum';
import { ExportService } from '@shared/common/export/export.service';
import { MapService } from '@app/shared/common/slice/map/map.service';
import { MapAreaItem } from '@app/shared/common/slice/map/map-area-item.model';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';

@Component({
    selector: 'slice-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.less'],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnChanges {
    @Input() data: MapData = {};
    @Input() palette: string[] = [ '#ade8ff', '#86ddff', '#5fd2ff', '#38c8ff', '#11bdff', '#00a8ea' ];
    @Input() infoItems: InfoItem[];
    @Input() width: InfoItem[];
    @Input() height: InfoItem[];
    @Input() dataIsLoading;
    @Input() showLegendBorder = false;
    @Input() usaOnly = false;
    @ViewChild(DxVectorMapComponent) vectorMapComponent: DxVectorMapComponent;
    isLendspace: boolean = this.userMananagementService.checkLendSpaceLayout();
    colorGroups: number[] = this.isLendspace
        ? [ 1, 101, 1001, 10001, 50001, 100001, 500001, Number.MAX_SAFE_INTEGER ]
        : [ 1, 101, 501, 1001, 5001, 25001, 50001, Number.MAX_SAFE_INTEGER ];
    pipe: any = new DecimalPipe('en-US');
    mapAreasItems: MapAreaItem[] = this.mapService.mapAreasItems;
    selectedMapAreaItem$: Observable<MapAreaItem> = this.mapService.selectedMapAreaItem$;
    selectedMapAreaZoomFactor$: Observable<MapAreaItem> = this.mapService.selectedMapAreaItem$.pipe(
        pluck('zoomFactor')
    );
    selectedMapAreaBounds$: Observable<MapAreaItem> = this.mapService.selectedMapAreaItem$.pipe(
        pluck('bounds')
    );
    selectedMap$: Observable<any> = this.mapService.selectedMapAreaItem$.pipe(
        pluck('map')
    );

    constructor(
        private loadingService: LoadingService,
        private ls: AppLocalizationService,
        private exportService: ExportService,
        private mapService: MapService,
        private userMananagementService: UserManagementService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes.data && !changes.data.firstChange && changes.data.currentValue && this.vectorMapComponent) {
            /** Update widget with new data */
            this.vectorMapComponent.instance.option('layers[0].dataSource', this.mapService.selectedMapAreaItem.value.map);
        }
    }

    customizeTooltip = (arg) => {
        let stateData = this.data[arg.attribute('postal')];
        let total = stateData && stateData.total;
        let totalMarkupString = total ? '<div id="nominal"><b>' + total + '</b> ' + this.ls.l('contacts') + '</div>' : '<div>' + this.ls.l('CRMDashboard_NoData') + '</div>';
        let node = '<div #gdp>' + '<h5>' + arg.attribute('name') + '</h5>' + totalMarkupString + '</div>';
        return {
            html: node
        };
    }

    customizeLayers = (elements) => {
        elements.forEach((element) => {
            let stateData = this.data[element.attribute('postal')];
            element.attribute('total', stateData && stateData.total || 0);
        });
    }

    customizeText = (arg) => {
        let text;
        if (arg.end === Number.MAX_SAFE_INTEGER) {
            text = this.isLendspace ? '> 500001' : '> 50001';
        } else {
            text = this.pipe.transform(arg.start, '1.0-0') + ' to ' + this.pipe.transform(arg.end - 1, '1.0-0');
        }
        return text;
    }

    exportTo(format: ImageFormat, prefix?: string) {
        setTimeout(() => {
            this.vectorMapComponent.instance.exportTo(
                this.exportService.getFileName(null, 'Map', prefix),
                format
            );
        });
    }

    onSelectedMapAreaChanged(e) {
        this.mapService.selectedMapAreaItem.next(e.value);
    }

}
