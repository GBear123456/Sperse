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

import { CacheService } from 'ng2-cache-service';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
    animations: [appModuleAnimation()],
    providers: [CacheService]
})
export class DashboardComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(BankAccountsSelectComponent) bankAccountSelector: BankAccountsSelectComponent;
    @ViewChild(AccountsComponent) accountsComponent: AccountsComponent;
    @ViewChild(CategorizationStatusComponent) categorizationStatusComponent: CategorizationStatusComponent;
    @ViewChild(TotalsByPeriodComponent) totalsByPeriodComponent: TotalsByPeriodComponent;
    @ViewChild(TrendByPeriodComponent) trendByPeriodComponent: TrendByPeriodComponent;

    private rootComponent: any;
    private readonly PERIOD_CACHE_KEY = 'selected.period';
    private readonly LOCAL_STORAGE = 0;

    headlineConfig;
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
    selectedPeriod;

    linksTo = [
        {name: 'View_Cash_Flow_Report', route: '../cashflow'},
        {name: 'View_Transaction_Details', route: '../transactions'},
        {name: 'View_Financial_Statistics', route: '../stats'},
    ];

    constructor(
        injector: Injector,
        private _router: Router,
        private _cacheService: CacheService,
        private _dashboardService: DashboardService,
        private _ngxZendeskWebwidgetService: ngxZendeskWebwidgetService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this._cacheService = this._cacheService.useStorage(this.LOCAL_STORAGE);
        if (this._cacheService.exists(this.getCacheKey(this.PERIOD_CACHE_KEY)))
            this.selectedPeriod = this._cacheService.get(this.getCacheKey(this.PERIOD_CACHE_KEY));
        else
            this.selectedPeriod = this.availablePeriods[this.availablePeriods.length - 1];
    }

    getCacheKey(key) {
        return this.constructor.name + '_' + key;
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
        this._dashboardService.periodChanged(this.selectedPeriod);
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
        this._cacheService.set(this.getCacheKey(this.PERIOD_CACHE_KEY), $event.value);
    }
}
