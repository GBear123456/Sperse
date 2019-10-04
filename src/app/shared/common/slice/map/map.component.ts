/** Core imports */
import { ChangeDetectionStrategy, Component, ViewChild, Input, SimpleChanges, OnChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';

/** Third party imports */
import * as mapsData from 'devextreme/dist/js/vectormap-data/usa.js';
import { DxVectorMapComponent } from 'devextreme-angular/ui/vector-map';

/** Application imports */
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';
import { MapData } from '@app/shared/common/slice/map/map-data.model';
import { ImageFormat } from '@shared/common/export/image-format.enum';
import { ExportService } from '@shared/common/export/export.service';

@Component({
    selector: 'slice-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.less'],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnChanges {
    @Input() data: MapData = {};
    @Input() palette: string[] = [ '#d4f3ff', '#c1ecfc', '#8addfd', '#30bef3', '#309ad9' ];
    @Input() colorGroups: number[] = [ 0, 100, 500, 1000, 5000, 9999 ];
    /** Default color */
    @Input() color = '#309ad9';
    @Input() infoItems: InfoItem[];
    @Input() width: InfoItem[];
    @Input() height: InfoItem[];
    @Input() dataIsLoading;
    @Input() showLegendBorder = false;
    @ViewChild(DxVectorMapComponent) vectorMapComponent: DxVectorMapComponent;
    usaMap: any = mapsData.usa;
    pipe: any = new DecimalPipe('en-US');

    constructor(
        private loadingService: LoadingService,
        private ls: AppLocalizationService,
        private exportService: ExportService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes.data && !changes.data.firstChange && changes.data.currentValue && this.vectorMapComponent) {
            /** Update widget with new data */
            this.vectorMapComponent.instance.option('layers[0].dataSource', this.usaMap);
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
        if (arg.end === 9999) {
            text = '> 5000';
        } else {
            text = this.pipe.transform(arg.start, '1.0-0') + ' to ' + this.pipe.transform(arg.end, '1.0-0');
        }
        return text;
    }

    exportTo(format: ImageFormat) {
        setTimeout(() => {
            this.vectorMapComponent.instance.exportTo(
                this.exportService.getFileName(),
                format
            );
        });
    }

}
