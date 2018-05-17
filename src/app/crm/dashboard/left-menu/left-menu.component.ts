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
        { caption: 'ManageClients', component: '/clients', showPlus: true },
        { caption: 'ManageLeads', component: '/leads', showPlus: true },
        { caption: 'ImportYourList', component: '/import-leads', disabled: false },
        { caption: 'CustomizeSettings', component: '/editions', disabled: true }
    ];

    constructor(injector: Injector,
        private _router: Router
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    onClick(event, elem, i) {
        if (elem.disabled)
            return ;

        if (event.clientX < 260)
            elem.component && this._router.navigate(
                ['/app/crm' + elem.component]);
        else if (event.target.classList.contains('add-button'))
            this._router.navigate(['/app/crm' + elem.component], 
                { queryParams: { action: 'addNew' } });
    }
}