import { Component, OnInit, AfterViewInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';

import { /* ClientServiceProxy, */ CommonLookupServiceProxy } from '@shared/service-proxies/service-proxies';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { DxDataGridComponent } from 'devextreme-angular';
import query from 'devextreme/data/query';

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

	onToolbarPrepare(event) {
		event.toolbarOptions.items.unshift({
                location: 'center',
                widget: 'dxButton',
                options: {
                    hint: 'Back',
                    icon: 'back',
                    onClick: Function
                }
            }, {
                location: 'center',
                widget: 'dxButton',
                options: {
                    text: 'Assign',
                    icon: 'fa fa-user-o',
                    onClick: Function()
                }
            },{
                location: 'center',
                widget: 'dxButton',
                options: {
                    text: 'Status',
                    icon: 'fa fa-flag-o',
                    onClick: Function()
                }
            },{
                location: 'center',
                widget: 'dxButton',
                options: {
                    text: 'Delete',
                    icon: 'fa fa-trash-o',
                    onClick: Function()
                }
            },{
                location: 'after',
                widget: 'dxButton',
                options: {
					hint: 'Refresh',
                    icon: 'refresh',
                    onClick: this.refreshDataGrid.bind(this)
                }
            });
	}

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    ngOnInit(): void {
		this.filterTabs = [
			'all', 'active', 'archived'
		];
    }

    ngAfterViewInit(): void {
    }
}