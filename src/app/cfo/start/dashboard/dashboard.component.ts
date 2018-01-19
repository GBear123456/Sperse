import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import { Component, OnInit, Injector } from '@angular/core';
import { AppConsts } from 'shared/AppConsts';
import { appModuleAnimation } from 'shared/animations/routerTransition';
import { Router } from '@angular/router';


@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
    animations: [appModuleAnimation()]
})
export class DashboardComponent extends CFOComponentBase implements OnInit {
    public headlineConfig;

    constructor(
        injector: Injector,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.headlineConfig = {
            names: [this.l('Dashboard_Title')],
            iconSrc: 'assets/common/icons/pie-chart.svg',
            buttons: []
        };
    }

    navigateTo() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/bank-accounts']);
    }
}
