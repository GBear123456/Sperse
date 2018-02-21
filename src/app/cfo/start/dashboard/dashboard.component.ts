import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import { Component, OnInit, AfterViewInit, OnDestroy, Injector } from '@angular/core';
import { AppConsts } from 'shared/AppConsts';
import { appModuleAnimation } from 'shared/animations/routerTransition';
import { Router } from '@angular/router';
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
        CFOComponentBase.zendeskWebwidgetShow(this._ngxZendeskWebwidgetService);
    }

    ngOnDestroy(): void {
        this.rootComponent.overflowHidden();
        CFOComponentBase.zendeskWebwidgetHide(this._ngxZendeskWebwidgetService);
    }

    navigateTo() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']);
    }
}
