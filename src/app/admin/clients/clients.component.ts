import { Component, OnInit, AfterViewInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';

import { /* ClientServiceProxy, */ CommonLookupServiceProxy } from '@shared/service-proxies/service-proxies';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { DxDataGridComponent } from 'devextreme-angular';

import 'devextreme/data/odata/store';

import * as moment from "moment";

@Component({
    templateUrl: "./clients.component.html",
    styleUrls: ["./clients.component.less"],
    animations: [appModuleAnimation()]
})
export class ClientsComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
	
    constructor(
        injector: Injector,
        //private _clientService: ClientServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _commonLookupService: CommonLookupServiceProxy,
        private _impersonationService: ImpersonationService
    ) {
        super(injector);

		this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataURL('Clients')
            },
            select: [
			//"id": 0,
			//"tenantId": 0,
			//"deleterUserId": 0,
    		//"lastModifierUserId": 0,
		    //"creatorUserId": 0
				'Name',
		    	'IsDeleted',
				'DeletionTime',
				'LastModificationTime',
				'CreationTime'
            ] //,
            //filter: []
        }
    }

    ngOnInit(): void {
		this.toolbarItems = [{
    		widget: 'dxButton',
	        options: {
    	    	type: 'back',
        	    text: 'Back'
	        },
    	    location: 'before'
	    }];

		this.filterTabs = [
			'all', 'active', 'archived'
		];
    }

    ngAfterViewInit(): void {
    }
}