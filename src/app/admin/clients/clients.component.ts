import { Component, OnInit, AfterViewInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';

import { /* ClientServiceProxy, */ CommonLookupServiceProxy } from '@shared/service-proxies/service-proxies';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import 'devextreme/data/odata/store';

import * as moment from "moment";

@Component({
    templateUrl: "./clients.component.html",
    styleUrls: ["./clients.component.less"],
    animations: [appModuleAnimation()]
})
export class ClientsComponent extends AppComponentBase implements OnInit, AfterViewInit {
	dataSource: any;
	tabSelected: Number = 0;
	filterTabs: String[] = ['all', 'active', 'archived'];

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
                url: ''
            },
            select: [
                'Name',
                'Status',
                'Amount',
                'Percent',
                'Creation'
            ],
            filter: []
        }
    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        let self = this;
    }
}