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
    pipeline: PipelineDto;
    pipelineItems: any;
    pipelineId = 1; // TODO: send actual pipelineId

    constructor(injector: Injector,
                private _pipelineService: PipelineServiceProxy) {
        super(injector);
    }

    ngOnInit(): void {
        this.getPipelineDefinition();
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

    getPipelineDefinition(): void {
        this._pipelineService
            .getPipelineDefinition(this.pipelineId)
            .subscribe(result => {
                this.pipeline = result;
            });
    }
}
