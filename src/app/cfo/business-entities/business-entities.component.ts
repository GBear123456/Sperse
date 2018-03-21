import { Component, OnInit, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { CFOComponentBase } from '../shared/common/cfo-component-base';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';
import DsataSource from 'devextreme/data/data_source';

@Component({
    selector: 'business-entities',
    templateUrl: './business-entities.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./business-entities.component.less']
})
export class BusinessEntitiesComponent extends CFOComponentBase implements OnInit {

    headlineConfig: any;

    private readonly dataSourceURI = 'BusinessEntity';
    private isAddButtonDisabled = false;

    constructor(injector: Injector,
                private _router: Router) {
        super(injector);
    }

    ngOnInit() {
        super.ngOnInit();

        this.headlineConfig = {
            names: [this.l('Setup_Title'), this.l('SetupStep_BusinessEntities')],
            iconSrc: 'assets/common/icons/magic-stick-icon.svg',
            buttons: [
                {
                    enabled: true,
                    action: this.onNextClick.bind(this),
                    lable: this.l('Next'),
                    class: 'btn-layout next-button'
                }
            ]
        };

        this.dataSource = {
            store: {
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

    onNextClick() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/start']);
    }

    onToolbarPreparing(e) {
        e.toolbarOptions.items.unshift(
            {
                location: 'before',
                template: 'title'
            },
            {
                location: 'after',
                widget: 'dxButton',
                options: {
                    text: this.l('AddEntity'),
                    onClick: this.addEntity.bind(this),
                    bindingOptions: {'disabled': 'isAddButtonDisabled'},
                    elementAttr: {'class': 'link'}
                }
            }
        );
    }

    onCellPrepared($event) {
        if ($event.rowType === 'data') {
            if ($event.column.dataField == 'Status' && $event.data.Status === 'Inactive') {
                $event.cellElement.parentElement.classList.add('inactive');
            }
        }
    }

    addEntity(e) {
    }

    locationColumn_calculateCellValue(rowData) {
        return rowData.StateId + ', ' + rowData.CountryId;
    }
}
