import { Component, OnInit, Injector, ViewChild, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardServiceProxy } from '@shared/service-proxies/service-proxies';
import { DxDataGridComponent } from 'devextreme-angular';
import { AppConsts } from '@shared/AppConsts';
import { Router } from '@angular/router';

@Component({
    selector: 'recent-clients',
    templateUrl: './recent-clients.component.html',
    styleUrls: ['./recent-clients.component.less'],
    providers: [ DashboardServiceProxy ]
})
export class RecentClientsComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    @Output() onReady = new EventEmitter();

    recordsCount = 10;

    private formatting = AppConsts.formatting;
    private readonly dataSourceURI = 'Customer';

    constructor(injector: Injector,
        private _router: Router,
        private _dashboardServiceProxy: DashboardServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.dataSource = {};
    }

    ngOnInit() {
        this.refresh();
    }

    refresh() {
        this._dashboardServiceProxy.getRecentlyCreatedCustomers(
            this.recordsCount).subscribe(result => {
                this.dataSource = result;
            }
        );
    }

    onCellClick($event) {
        $event.row && this._router.navigate(
            ['app/crm/client', $event.row.data.id], 
                {queryParams: {referrer: this._router.url}});
    }
}