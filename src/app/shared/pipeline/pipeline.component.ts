import {Component, Injector, Input, OnInit, AfterViewInit} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';
import {PipelineDto, PipelineServiceProxy} from '@shared/service-proxies/service-proxies';

import DataSource from 'devextreme/data/data_source';
import DevExpress from 'devextreme/bundles/modules/core';


@Component({
    selector: 'app-pipeline',
    templateUrl: './pipeline.component.html',
    styleUrls: ['./pipeline.component.less'],
    providers: [PipelineServiceProxy]
})
export class PipelineComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @Input() dataSource;
    pipeline: PipelineDto;
    items: any;
    // newDataSource: any = {};
    pipelineId = 1; // TODO: send actual pipelineId
    cards = [
        {
            title: 'Lacross',
            imgUrl: '/assets/common/images/sampleProfilePics/sample-profile-05.jpg',
            amount: '$2500',
            currentNumber: '1',
            totalNumber: '3',
            noteCount: '2',
            documentCount: '3'
        },
        {
            title: 'Contact',
            imgUrl: '/assets/common/images/sampleProfilePics/sample-profile-01.jpg',
            amount: '$4500',
            currentNumber: '1',
            totalNumber: '2',
            noteCount: '2',
            documentCount: '3'
        },
        {
            title: 'Windows',
            imgUrl: '/assets/common/images/sampleProfilePics/sample-profile-03.jpg',
            amount: '$8866',
            currentNumber: '1',
            totalNumber: '3',
            noteCount: '2',
            documentCount: '3'
        },
        {
            title: 'Apple',
            imgUrl: '/assets/common/images/sampleProfilePics/sample-profile-10.jpg',
            amount: '$3700',
            currentNumber: '1',
            totalNumber: '3',
            noteCount: '2',
            documentCount: '3'
        }
    ];

    constructor(
        injector: Injector,
        private _pipelineService: PipelineServiceProxy
    ) {
        super(injector);
        // this.newDataSource = this.dataSource.reload();

        // this.newData = this.dataSource.getDataSource().items();
        // this.newData = new DataSource({
        //     store: {
        //         type: 'odata',
        //         url: this.getODataURL('Lead'),
        //         version: 4,
        //         beforeSend: function (request) {
        //             request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
        //             request.headers['Abp.TenantId'] = abp.multiTenancy.getTenantIdCookie();
        //         }
        //     }
        // });
        /*this.newDataSource = this.dataSource.load()
            .done(function(result) {});*/
        // this.newDataSource = this.dataSource.load;
        // this.newDataSource = this.dataSource.store().load();

        //console.log(this.dataSource);
        // this.dataSource.on('changed', (event)=>{
        //     console.log(event);
        // });

    }

    ngOnInit(): void {
        this.getPipelineDefinition();
        // console.log(this.newDataSource);
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            console.log(this.dataSource);
            this.items = this.dataSource;
            console.log(this.items);
        }, 0);

    }

    getPipelineDefinition(): void {
        this._pipelineService
            .getPipelineDefinition(this.pipelineId)
            .subscribe(result => {
                this.pipeline = result;
            });
    }
}
