import { Component, Injector, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardServiceProxy, GetCustomersByRegionOutput } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { DxVectorMapComponent } from 'devextreme-angular'; 
import { AppConsts } from '@shared/AppConsts';

import { DecimalPipe } from '@angular/common';
import DxChart from 'devextreme/viz/chart';
import * as mapsData from 'devextreme/dist/js/vectormap-data/world.js';

import * as _ from "underscore";

@Component({
    selector: 'clients-by-region',
    templateUrl: './clients-by-region.component.html',
    styleUrls: ['./clients-by-region.component.less'],
    providers: []
})
export class ClientsByReginComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @ViewChild(DxVectorMapComponent) mapComponent: DxVectorMapComponent;

    worldMap: any = mapsData.world;
    gdpData: any = {};
    toolTipData: Object;
    pipe: any = new DecimalPipe("en-US");

    constructor(
        injector: Injector,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private _dashboardServiceProxy: DashboardServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        _dashboardWidgetsService.subscribePeriodChange((period) => {
            _dashboardServiceProxy.getCustomersByRegion(
                period && period.from, period && period.to)
                    .subscribe((result) => {
                        result.forEach((val, index) => {
                            if (this.gdpData.hasOwnProperty(val.countryId))
                                this.gdpData[val.countryId].total += val.customerCount;
                            else
                                this.gdpData[val.countryId] = {
                                    name: val.countryId, 
                                    total: val.customerCount, 
                                    states: []
                                };

                            this.gdpData[val.countryId].states.push({
                                state: val.stateId || 'Other',
                                count: val.customerCount
                            });
                        });
                    }
            )
        });
    }

    ngOnInit() {

    }

    ngAfterViewInit() {
        setTimeout(() => this.mapComponent.instance.render(), 2000);
    }

    customizeTooltip = (arg) => {
        let countryGDPData = this.gdpData[arg.attribute('iso_a2')];
        let total = countryGDPData && countryGDPData.total;
        let totalMarkupString = total ? "<div id='nominal' >" + 
            this.l('CRMDashboard_TotalCount') + ": " + total + "</div>" : "";
        let node = "<div #gdp><h4>" + arg.attribute("name") + "</h4>" +
            totalMarkupString + "<div id='gdp-sectors'></div></div>";

        return {
            html: node
        };
    }

    customizeLayers = (elements) => {
        elements.forEach((element) => {
            let countryGDPData = this.gdpData[element.attribute('iso_a2')];
            element.attribute("total", countryGDPData && countryGDPData.total || 0);
        });
    }

    customizeText = (arg) => this.pipe.transform(arg.start, "1.0-0") + 
        " to " + this.pipe.transform(arg.end, "1.0-0");

    tooltipShown(e) {
        let name = e.target.attribute("iso_a2"),
            data = this.gdpData[name],
            container = (<any> document).getElementById("gdp-sectors");

        if (data && data.total)
            new DxChart(container, this.getChartConfig(data.states));
        else
            container.textContent = this.l("CRMDashboard_NoData");
    }

    getChartConfig(chartData: Object): Object {
        return {
            dataSource: chartData,
            title: {
                text: this.l("CRMDashboard_ClientsByStates"),
                font: {
                    size: 16
                }
            },
            argumentAxis: {
                label: {
                    visible: true
                }
            },
            valueAxis: {
                label: {
                    visible: false
                }
            },
            commonSeriesSettings: {
                argumentField: "state",
                type: "bar",
                hoverMode: "allArgumentPoints",
                selectionMode: "allArgumentPoints",
                label: {
                    visible: true,
                    format: {
                        type: "fixedPoint",
                        precision: 1
                    },
                    customizeText: function (args) {
                        return args.value;
                    }
                },
                valueAxis: {
                    max: 100,
                    min: 0
                }
            },
            series: [{
                valueField: "count",
                name: "count by states"
            }],
            legend: {
                visible: false,
                orientation: "horizontal",
                horizontalAlignment: "center",
                verticalAlignment: "bottom"
            }
        };
    }
}