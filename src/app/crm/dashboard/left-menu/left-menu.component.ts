import { Component, Injector, Input } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Router } from '@angular/router';

@Component({
    templateUrl: './left-menu.component.html',
    styleUrls: ['./left-menu.component.less'],
    selector: 'left-menu',
})
export class DashboardMenuComponent extends AppComponentBase {

    items = [
        { caption: 'ManageClients', component: '/clients' },
        { caption: 'ManageLeads', component: '/leads' },
        { caption: 'ImportYourList', component: '/clients' },
        { caption: 'CustomizeSettings', component: '/editions' }
    ];

    constructor(injector: Injector,
        private _router: Router
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    onClick(elem) {
        elem.component && this._router.navigate(
            ['/app/crm' + elem.component]);
    }
}
