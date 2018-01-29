import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { AppConsts } from 'shared/AppConsts';
import { appModuleAnimation } from 'shared/animations/routerTransition';
import { Router } from '@angular/router';


@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
    animations: [appModuleAnimation()]
})
export class DashboardComponent extends CFOComponentBase implements OnInit, OnDestroy {
    public headlineConfig;
    private rootComponent: any;

    constructor(
        injector: Injector,
        private _router: Router
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;

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

    ngOnDestroy(): void {
        this.rootComponent.overflowHidden();
    }

    navigateTo() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']);
    }
}
