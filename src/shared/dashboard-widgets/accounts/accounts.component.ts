import {Component, Injector, OnInit} from '@angular/core';
import {CFOComponentBase} from 'app/cfo/shared/common/cfo-component-base';
import {DashboardServiceProxy, InstanceType} from 'shared/service-proxies/service-proxies';
import {Router} from '@angular/router';
import {AppConsts} from "@shared/AppConsts";

@Component({
    selector: 'app-accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less'],
    providers: [DashboardServiceProxy]
})
export class AccountsComponent extends CFOComponentBase implements OnInit {
    accountsData: any;

    constructor(
        injector: Injector,
        private _dashboardService: DashboardServiceProxy,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnInit() {
        this.getAccountTotals();
    }

    getAccountTotals(): void {
        this._dashboardService.getAccountTotals(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                this.accountsData = result;
            });
    }

    navigateTo() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']);
    }
}
