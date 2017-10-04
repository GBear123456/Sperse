import {Component, Injector, Input, OnInit, AfterViewInit} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';
import {PipelineDto, PipelineServiceProxy} from '@shared/service-proxies/service-proxies';

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
        .getPipelines(this.pipelinePurposeId)
        .subscribe((result: number[]) => {
            if (result.length > 0)
            {
                this.getPipelineDefinition(result[0]);
            }
        });
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.dataSource.paginate(false);
            this.dataSource.pageSize(100);
            this.dataSource.reload();
            setTimeout(() => {
                this.pipelineItems = this.dataSource.items();
            }, 5000);
        }, 5000);
    }

    getPipelineDefinition(pipelineId: number): void {
        this._pipelineService
            .getPipelineDefinition(pipelineId)
            .subscribe(result => {
                this.pipeline = result;
            });
    }
}
