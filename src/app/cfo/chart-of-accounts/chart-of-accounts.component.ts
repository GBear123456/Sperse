import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';
import DsataSource from 'devextreme/data/data_source';
import { CategorizationComponent } from '@app/cfo/transactions/categorization/categorization.component';

@Component({
    selector: 'chart-of-accounts',
    templateUrl: './chart-of-accounts.component.html',
    styleUrls: ['./chart-of-accounts.component.less'],
    animations: [appModuleAnimation()]
})
export class ChartOfAccountsComponent extends CFOComponentBase implements OnInit {
    @ViewChild(CategorizationComponent) categorization: CategorizationComponent;
    headlineConfig: any;
    ActionTitle = 'CUSTOM CHART';

    constructor(injector: Injector,
                private _router: Router) {
        super(injector);
    }

    ngOnInit() {
        super.ngOnInit();

        this.headlineConfig = {
            names: [this.l('Setup_Title'), this.l('SetupStep_Chart')],
            iconSrc: 'assets/common/icons/magic-stick-icon.svg'
        };

        //this.dataSource = {
        //  store: {
        //    type: 'odata',
        //    url: this.getODataURL(this.dataSourceURI),
        //    version: this.getODataVersion(),
        //    beforeSend: function (request) {
        //      request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
        //    }
        //  }
        //};
    }

    locationColumn_calculateCellValue(rowData) {
        return rowData.StateId + ', ' + rowData.CountryId;
    }

    downloadExcel() {
        this.exportToXLS('all');
    }

    refresh() {
        this.categorization.refreshCategories();
    }
}
