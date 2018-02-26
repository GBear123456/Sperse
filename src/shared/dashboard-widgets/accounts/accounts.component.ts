import { Component, Injector, OnInit, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CFOComponentBase} from 'app/cfo/shared/common/cfo-component-base';
import {DashboardServiceProxy, InstanceType} from 'shared/service-proxies/service-proxies';
import {Router} from '@angular/router';

@Component({
    selector: 'app-accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less'],
    providers: [DashboardServiceProxy]
})
export class AccountsComponent extends CFOComponentBase implements OnInit {
    @Output() onTotalAccountsMouseenter: EventEmitter<any> = new EventEmitter();

    accountsData: any;
    bankAccountIds: number[] = [];
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
        this._dashboardService.getAccountTotals(InstanceType[this.instanceType], this.instanceId, this.bankAccountIds)
            .subscribe((result) => {
                this.accountsData = result;
            });
    }

    navigateTo() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']);
    }

    filterByBankAccounts(bankAccountIds: number[]) {
        this.bankAccountIds = bankAccountIds;
        this.getAccountTotals();
    }

    totalAccountsMouseenter() {
        this.onTotalAccountsMouseenter.emit();
    }
}
