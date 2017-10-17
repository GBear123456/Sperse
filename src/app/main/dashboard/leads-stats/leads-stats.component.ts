import { Component, Injector, Input, OnInit, AfterViewInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserModule } from '@angular/platform-browser';
import { DxPivotGridModule } from 'devextreme-angular';


import {LeadServiceProxy } from '@shared/service-proxies/service-proxies';

import DataSource from 'devextreme/data/data_source';

@Component({
    selector: 'leads-stats',
    templateUrl: './leads-stats.component.html',
    providers: [LeadServiceProxy]
})
export class LeadsStatsComponent extends AppComponentBase {
    sales: any;

    constructor(injector: Injector,
        private _leadService: LeadServiceProxy) {
        super(injector);
    }

    ngOnInit(): void {
        this._leadService.getLeadStats().subscribe(result => {
            this.dataSource = {
                fields: [{
                    caption: 'pipeline',
                    width: 120,
                    dataField: 'pipelineId',
                    area: 'row',
                    selector: this.pipelineSelector
                }, {
                    caption: 'Stage',
                    dataField: 'stageId',
                    width: 150,
                    area: 'row',
                    selector: this.stageSelector
                }, {
                    dataField: 'typeId',
                    area: 'column',
                    selector: this.typeSelector
                }, {
                    caption: 'Sales',
                    dataField: 'count',
                    dataType: 'number',
                    summaryType: 'sum',
                    area: 'data'
                }],
                store: result
            }
        });
    }
    onPivotCellClick(e) {
        if (e.area == "data") {
            var rowPathLength = e.cell.rowPath.length,
                rowPathName = e.cell.rowPath[rowPathLength - 1];
        }
    }
    pipelineSelector(data) {
        return data.pipelineName;
    }
    stageSelector(data) {
        return data.stageName;
    }
    typeSelector(data) {
        return data.typeName;
    }
}
