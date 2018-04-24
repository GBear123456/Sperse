import {Component, Injector, Input, OnInit, AfterViewInit} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';
import { PipelineDto, PipelineServiceProxy, PipelineData } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

import DataSource from 'devextreme/data/data_source';

@Component({
    selector: 'app-pipeline',
    templateUrl: './pipeline.component.html',
    styleUrls: ['./pipeline.component.less'],
    providers: [PipelineServiceProxy]
})
export class PipelineComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @Input() dataSource: DataSource;
    @Input() pipelinePurposeId: string;
    pipeline: PipelineDto;
    stages: any = [];

    constructor(injector: Injector,
        private _pipelineService: PipelineServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit(): void {
        this.startLoading(true);
        this._pipelineService
            .getPipelinesData(this.pipelinePurposeId)
            .subscribe((result: PipelineData[]) => {
                if (result.length > 0)
                {
                    this.getPipelineDefinition(result[0].id);
                }
        });
    }

    ngAfterViewInit(): void {
    }

    getPipelineDefinition(pipelineId: number): void {        
        this._pipelineService
            .getPipelineDefinition(pipelineId)
            .subscribe(result => {
                result.stages.sort((a, b) => {
                    return a.sortOrder > b.sortOrder ? 1: -1;
                }).forEach((item) => {
                    item['index'] = Math.abs(item.sortOrder);
                });
                this.pipeline = result;
                this.loadStagesLeads(0);
            });
    }

    loadStagesLeads(index) {
        this.dataSource.pageSize(5);
        this.dataSource.filter(['Stage', '=', this.pipeline.stages[index].name]);
        this.dataSource.sort({getter: 'CreationTime', desc: true});
        this.dataSource.load().then((leads) => {
            if (leads.length) {
                this.pipeline.stages[index]['leads'] = leads.splice(0);
                this.pipeline.stages[index]['total'] = 
                    this.dataSource.totalCount();
            }
            if (this.pipeline.stages[++index])
                this.loadStagesLeads(index);
            else {
                this.stages = this.pipeline.stages;
                this.finishLoading(true);
            }
        });

    }
}