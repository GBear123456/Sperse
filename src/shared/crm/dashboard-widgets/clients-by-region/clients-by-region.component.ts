import { Component, Injector, ViewChild, AfterViewChecked } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { DxVectorMapComponent } from 'devextreme-angular/ui/vector-map';
import { AppConsts } from '@shared/AppConsts';
import { DecimalPipe } from '@angular/common';
import * as mapsData from 'devextreme/dist/js/vectormap-data/usa.js';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'clients-by-region',
    templateUrl: './clients-by-region.component.html',
    styleUrls: ['./clients-by-region.component.less'],
    providers: []
})
export class ClientsByReginComponent extends AppComponentBase implements AfterViewChecked {
    @ViewChild(DxVectorMapComponent) mapComponent: DxVectorMapComponent;

    usaMap: any = mapsData.usa;
    gdpData: any = {};

    toolTipData: Object;
    pipe: any = new DecimalPipe('en-US');

    constructor(
        injector: Injector,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private _dashboardServiceProxy: DashboardServiceProxy
    ) {
        super(injector);

        _dashboardWidgetsService.subscribePeriodChange((period) => {
            this.startLoading();
            _dashboardServiceProxy.getContactsByRegion(
                period && period.from, period && period.to)
                    .pipe(finalize(() => {this.finishLoading();})).subscribe((result) => {
                        this.gdpData = {};
                        result.forEach((val, index) => {
                            this.gdpData[val.stateId] = {
                                name: val.stateId  || 'Other',
                                total: val.count
                            };
                        });
                        this.mapComponent.instance.getLayerByName('areas').getDataSource().reload();
                    }
            );
        });
    }

    ngAfterViewChecked() {
        this.mapComponent.instance.render();
    }

    customizeTooltip = (arg) => {
        let stateData = this.gdpData[arg.attribute('postal')];
        let total = stateData && stateData.total;
        let totalMarkupString = total ? "<div id='nominal'><b>" + total + '</b> ' + this.l('contacts') + "</div>" : "<div>" + this.l('CRMDashboard_NoData') + "</div>";
        let node = "<div #gdp>" + "<h5>" + arg.attribute('name') + "</h5>" + totalMarkupString + "</div>";
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

    customizeText = (arg) => this.pipe.transform(arg.start, "1.0-0") +
        " to " + this.pipe.transform(arg.end, "1.0-0");
}
