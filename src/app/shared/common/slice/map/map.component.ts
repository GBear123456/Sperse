/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostBinding,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { DecimalPipe, I18nPluralPipe } from '@angular/common';
import { Params } from '@angular/router';

/** Third party imports */
import { DxVectorMapComponent } from 'devextreme-angular/ui/vector-map';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
import pluralize from 'pluralize';

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
import { Country } from '@shared/AppEnums';
import { MapArea } from './map-area.enum';

@Component({
    selector: 'slice-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.less'],
    providers: [ LifecycleSubjectsService, I18nPluralPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnChanges {
    @Input() data: MapData;
    @Input() dataIsGrouped = true;
    @Input() palette: string[] = [ '#ade8ff', '#86ddff', '#5fd2ff', '#38c8ff', '#11bdff', '#00a8ea' ];
    @Input() infoItems: InfoItem[];
    @Input() width: number;
    @Input() height: number;
    @Input() dataIsLoading;
    @Input() showLegendBorder = false;
    @Input() usaOnly = false;
    @Input() contactGroupText = '';
    @Input() areaClickLink = 'app/crm/leads';
    @Output() onMapItemClick: EventEmitter<Params> = new EventEmitter<Params>();
    @ViewChild(DxVectorMapComponent) vectorMapComponent: DxVectorMapComponent;
    @HostBinding('style.height') get componentHeight() {
        return this.height + 'px';
    }
    isLendspace: boolean = this.userManagementService.checkLendSpaceLayout();
    colorGroups: number[] = this.isLendspace
        ? [ 1, 101, 1001, 10001, 50001, 100001, 500001, Number.MAX_SAFE_INTEGER ]
        : [ 1, 101, 501, 1001, 5001, 25001, 50001, Number.MAX_SAFE_INTEGER ];
    decimalPipe: any = new DecimalPipe('en-US');
    mapAreasItems: MapAreaItem[] = this.mapService.mapAreasItems;
    selectedMapAreaItem$: Observable<MapAreaItem> = this.mapService.selectedMapAreaItem$;
    selectedMapAreaZoomFactor$: Observable<number> = this.mapService.selectedMapAreaItem$.pipe(
        pluck('zoomFactor')
    );
    selectedMapAreaBounds$: Observable<number[]> = this.mapService.selectedMapAreaItem$.pipe(
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
        private userManagementService: UserManagementService,
        private pluralPipe: I18nPluralPipe
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes.data && !changes.data.firstChange && changes.data.currentValue && this.vectorMapComponent) {
            /** Update widget with new data */
            this.vectorMapComponent.instance.option('layers[0].dataSource', this.mapService.selectedMapAreaItem.value.map);
        }
    }

    customizeTooltip = (arg) => {
        let total = this.getElementTotal(arg);
        let totalMarkupString = total
            ? `<div id="nominal"><b>${total}</b>
              ${this.pluralPipe.transform(
                  total,
                  {
                      '=0': pluralize(this.contactGroupText, 0),
                      '=1': pluralize.singular(this.contactGroupText),
                      'other': pluralize.plural(this.contactGroupText)
                  })}
            </div>`
            : `<div>${this.ls.l('CRMDashboard_NoData')}</div>`;
        let node = `<div #gdp><h5>${arg.attribute('name')}</h5>${totalMarkupString}</div>`;
        return { html: node };
    }

    customizeLayers = (elements) => {
        elements.forEach((element) => {
            element.attribute('total', this.getElementTotal(element));
        });
    }

    private getElementTotal(element): number {
        let total = 0;
        if (!this.dataIsGrouped && this.mapService.selectedMapAreaItem.getValue().key === MapArea.World) {
            const countryData = this.data[element.attribute('iso_a2')];
            for (let stateCode in countryData) {
                total += +(countryData[stateCode] && countryData[stateCode].total);
            }
        } else {
            let stateData = this.dataIsGrouped
                ? (this.mapService.selectedMapAreaItem.value.key === MapArea.World
                    ? this.data[element.attribute('iso_a2')]
                    : this.data[element.attribute('postal')]
                  )
                : this.data[element.attribute('iso_a2')]
                  && this.data[element.attribute('iso_a2')][element.attribute('postal')]
            total = +(stateData && stateData.total);
        }
        return total;
    }

    customizeText = (arg) => {
        let text;
        if (arg.end === Number.MAX_SAFE_INTEGER) {
            text = '> ' + this.decimalPipe.transform(this.isLendspace ? '500001' : '50001', '1.0-0');
        } else {
            text = this.decimalPipe.transform(arg.start, '1.0-0') + ' to ' + this.decimalPipe.transform(arg.end - 1, '1.0-0');
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

    mapClick(e) {
        if (e.target) {
            let filter = {};
            if (this.mapService.selectedMapAreaItem.value.key === MapArea.World) {
                filter['countryId'] = e.target.attribute('iso_a2');
            } else {
                filter['stateId'] = e.target.attribute('postal');
                filter['countryId'] = this.mapService.selectedMapAreaItem.value.key === MapArea.Canada ? Country.Canada : Country.USA;
            }
            this.onMapItemClick.emit(filter);
        }
    }

}
