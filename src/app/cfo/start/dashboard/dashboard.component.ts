import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import { Component, OnInit, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { AppConsts } from 'shared/AppConsts';
import { appModuleAnimation } from 'shared/animations/routerTransition';
import { Router } from '@angular/router';
import { BankAccountsSelectComponent } from 'app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { AccountsComponent } from 'shared/dashboard-widgets/accounts/accounts.component';
import { CategorizationStatusComponent } from 'shared/dashboard-widgets/categorization-status/categorization-status.component';
import { TotalsByPeriodComponent } from 'shared/dashboard-widgets/totals-by-period/totals-by-period.component';
import { TrendByPeriodComponent } from 'shared/dashboard-widgets/trend-by-period/trend-by-period.component';
import { DashboardService } from 'shared/dashboard-widgets/dashboard.service';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
    animations: [appModuleAnimation()]
})
export class DashboardComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(BankAccountsSelectComponent) bankAccountSelector: BankAccountsSelectComponent;
    @ViewChild(AccountsComponent) accountsComponent: AccountsComponent;
    @ViewChild(CategorizationStatusComponent) categorizationStatusComponent: CategorizationStatusComponent;
    @ViewChild(TotalsByPeriodComponent) totalsByPeriodComponent: TotalsByPeriodComponent;
    @ViewChild(TrendByPeriodComponent) trendByPeriodComponent: TrendByPeriodComponent;
    
    availablePeriods = [
        this.l('Today'),
        this.l('Yesterday'),
        this.l('This_Week'),
        this.l('This_Month'),
        this.l('Last_Month'),
        this.l('This_Year'),
        this.l('Last_Year'),
        this.l('All_Periods')
    ];

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
        private _dashboardService: DashboardService,
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

    filterByBankAccounts(data) {
        this.accountsComponent.filterByBankAccounts(data.bankAccountIds);
        this.categorizationStatusComponent.filterByBankAccounts(data);
        this.totalsByPeriodComponent.filterByBankAccounts(data.bankAccountIds);
        this.trendByPeriodComponent.filterByBankAccounts(data.bankAccountIds);
    }

    onPeriodChanged($event) {
        this._dashboardService.periodChanged($event.value);
    }
}
