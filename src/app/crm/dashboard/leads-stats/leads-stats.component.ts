import { Component, Injector, Input, Output, OnInit, EventEmitter, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserModule } from '@angular/platform-browser';
import { DxPivotGridModule } from 'devextreme-angular';

import {LeadServiceProxy } from '@shared/service-proxies/service-proxies';

import DataSource from 'devextreme/data/data_source';

@Component({
    selector: 'leads-stats',
    templateUrl: './leads-stats.component.html',
    styleUrls: ['./leads-stats.component.less'],
    providers: [LeadServiceProxy]
})
export class LeadsStatsComponent extends AppComponentBase implements OnInit {
    types: string[] = new Array<string>();
    pipelines: string[] = new Array<string>();
    stages: string[] = new Array<string>();
    @Output() onDataLoaded = new EventEmitter();

    constructor(injector: Injector,
        private _router: Router,
        private _leadService: LeadServiceProxy) {
        super(injector);
    }

    ngOnInit(): void {
        this._leadService.getLeadStats().subscribe(result => {
            if (result.data.length)
                this.onDataLoaded.emit();
            result.types.forEach((val, i, arr) => this.types[val.key] = val.value);
            result.pipelines.forEach((val, i, arr) => this.pipelines[val.key] = val.value);
            result.stages.forEach((val, i, arr) => this.stages[val.key] = val.value);

            this.dataSource = {
                fields: [{
                    caption: 'pipeline',
                    width: 120,
                    dataField: 'pipelineId',
                    area: 'row',
                    customizeText: (data) => this.pipelines[data.value]
                }, {
                    caption: 'Stage',
                    dataField: 'stageId',
                    width: 150,
                    area: 'row',
                    customizeText: (data) => this.stages[data.value]
                }, {
                    dataField: 'typeId',
                    area: 'column',
                    customizeText: (data) => this.types[data.value]
                }, {
                    caption: 'Sales',
                    dataField: 'count',
                    dataType: 'number',
                    summaryType: 'sum',
                    area: 'data'
                }],
                store: result.data
            };
        });
    }
    onPivotCellClick(e) {
        if (e.area == 'data') {
            let typeId = e.cell.columnPath[0];
            let pipelineId = e.cell.rowPath[0];
            let stageId = e.cell.rowPath[1];

            let pipelinesFilter;
            if (pipelineId)
                pipelinesFilter = { element: [pipelineId + (stageId ? ':' + stageId : '')] };
            let filters = {
                typeId: typeId,
                stages: pipelinesFilter
            };
            this._router.navigate(['app/crm/leads'], { queryParams: { filters: encodeURIComponent(JSON.stringify(filters)) } });
        }
    }

    onCellPrepared(e) {
        if (e.area == 'data')
            e.cellElement.classList.add('leads-reference-link');
    }
}
