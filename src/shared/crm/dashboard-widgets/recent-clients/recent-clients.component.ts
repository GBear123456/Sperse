import { Component, OnInit, Injector, ViewChild, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CustomersServiceProxy } from '@shared/service-proxies/service-proxies';
import { DxDataGridComponent } from 'devextreme-angular';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'recent-clients',
    templateUrl: './recent-clients.component.html',
    styleUrls: ['./recent-clients.component.less'],
    providers: [ CustomersServiceProxy ]
})
export class RecentClientsComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    @Output() onReady = new EventEmitter();

    private formatting = AppConsts.formatting;
    private readonly dataSourceURI = 'Customer';

    constructor(injector: Injector,
        private _customersServiceProxy: CustomersServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.dataSource = {
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.headers['Abp.TenantId'] = abp.multiTenancy.getTenantIdCookie();
                }
            }
        };
    }

    ngOnInit() {
    }

    onContentReady($event) {        
        this.onReady.emit($event.component.getVisibleRows());
    }
}
