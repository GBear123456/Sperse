import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import { Component, OnInit, AfterViewInit, OnDestroy, Injector } from '@angular/core';
import { AppConsts } from 'shared/AppConsts';
import { appModuleAnimation } from 'shared/animations/routerTransition';
import { Router } from '@angular/router';

import { environment } from 'environments/environment';

import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
    animations: [appModuleAnimation()]
})
export class DashboardComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    public headlineConfig;
    private rootComponent: any;
    linksTo = [
        {name: 'View_Cash_Flow_Report', route: '../cashflow'},
        {name: 'View_Transaction_Details', route: '../transactions'},
        {name: 'View_Financial_Statistics', route: '../stats'},
    ];

    constructor(
        injector: Injector,
        private _router: Router,
        private _ngxZendeskWebwidgetService: ngxZendeskWebwidgetService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.rootComponent.overflowHidden(true);
        this.headlineConfig = {
            names: [this.l('Dashboard_Title')],
            iconSrc: 'assets/common/icons/pie-chart.svg',
            buttons: []
        };
    }

    ngAfterViewInit(): void {
/*
        _ngxZendeskWebwidgetService.identify({
           name: 'Alison Vilela',
           email: 'alison.vilela@live.nl'
        });
*/
        if (environment.zenDeskEnabled)
            setTimeout(() => {
                this._ngxZendeskWebwidgetService.show();
            }, 1000);
    }

    ngOnDestroy(): void {
        this.rootComponent.overflowHidden();
        if (environment.zenDeskEnabled)
            this._ngxZendeskWebwidgetService.hide();
    }

    navigateTo() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']);
    }
}
