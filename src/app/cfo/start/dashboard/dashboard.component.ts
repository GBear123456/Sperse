import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { Component, OnInit, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from 'shared/animations/routerTransition';
import { Router } from '@angular/router';
import { BankAccountsSelectComponent } from 'app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { AccountsComponent } from '@shared/cfo/dashboard-widgets/accounts/accounts.component';
import { CategorizationStatusComponent } from '@shared/cfo/dashboard-widgets/categorization-status/categorization-status.component';
import { TotalsByPeriodComponent } from '@shared/cfo/dashboard-widgets/totals-by-period/totals-by-period.component';
import { TrendByPeriodComponent } from '@shared/cfo/dashboard-widgets/trend-by-period/trend-by-period.component';
import { DashboardService } from '@shared/cfo/dashboard-widgets/dashboard.service';
import { InstanceType } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
    animations: [appModuleAnimation()],
})
export class DashboardComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(BankAccountsSelectComponent) bankAccountSelector: BankAccountsSelectComponent;
    @ViewChild(AccountsComponent) accountsComponent: AccountsComponent;
    @ViewChild(CategorizationStatusComponent) categorizationStatusComponent: CategorizationStatusComponent;
    @ViewChild(TotalsByPeriodComponent) totalsByPeriodComponent: TotalsByPeriodComponent;
    @ViewChild(TrendByPeriodComponent) trendByPeriodComponent: TrendByPeriodComponent;

    private rootComponent: any;

    headlineConfig;

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
            onRefresh: this.refreshWidgets.bind(this),
            buttons: []
        };
    }

    ngAfterViewInit(): void {
        CFOComponentBase.zendeskWebwidgetShow(this._ngxZendeskWebwidgetService);
    }

    ngOnDestroy(): void {
        this.rootComponent.overflowHidden();
        CFOComponentBase.zendeskWebwidgetHide(this._ngxZendeskWebwidgetService);
        this._dashboardService.unsubscribe();
    }

    filterByBankAccounts(data) {
        this.accountsComponent.filterByBankAccounts(data.bankAccountIds);
        this.categorizationStatusComponent.filterByBankAccounts(data);
        this.totalsByPeriodComponent.filterByBankAccounts(data.bankAccountIds);
        this.trendByPeriodComponent.filterByBankAccounts(data.bankAccountIds);
    }
    
    refreshWidgets() {
        this.accountsComponent.getAccountTotals();
        this.accountsComponent.getDailyStats();
        this.trendByPeriodComponent.loadStatsData();
        this.totalsByPeriodComponent.loadStatsData();
        this.categorizationStatusComponent.getCategorizationStatus();
    }

    periodChanged($event) {
        this._dashboardService.periodChanged($event);
    }
}
