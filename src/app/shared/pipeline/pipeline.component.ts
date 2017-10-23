import {Component, Injector, Input, OnInit, AfterViewInit} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';
import { PipelineDto, PipelineServiceProxy, PipelineData } from '@shared/service-proxies/service-proxies';

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
    pipelineItems: any;

    constructor(injector: Injector,
                private _pipelineService: PipelineServiceProxy) {
        super(injector);
    }

    ngOnInit(): void {
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
        abp.ui.setBusy();
        setTimeout(() => {
            this.pipelineItems = this.dataSource.items();
            abp.ui.clearBusy();
        }, 2000);
    }

    getPipelineDefinition(pipelineId: number): void {
        this._pipelineService
            .getPipelineDefinition(pipelineId)
            .subscribe(result => {
                this.pipeline = result;
            });
    }
}
