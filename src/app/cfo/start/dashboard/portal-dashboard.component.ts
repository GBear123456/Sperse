/** Core imports */
import { Component, OnInit, OnDestroy, Injector, ViewChild, HostBinding } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { BankAccountsSelectDialogComponent } from 'app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog.component';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from 'shared/animations/routerTransition';
import { AccountsComponent } from '@shared/cfo/dashboard-widgets/accounts/accounts.component';
import { TotalsByPeriodComponent } from '@shared/cfo/dashboard-widgets/totals-by-period/totals-by-period.component';
import { TrendByPeriodComponent } from '@shared/cfo/dashboard-widgets/trend-by-period/trend-by-period.component';
import { DashboardService } from '@shared/cfo/dashboard-widgets/dashboard.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { TopSpendingCategoriesComponent } from '@shared/cfo/dashboard-widgets/top-spending-categories/top-spending-categories.component';

@Component({
    selector: 'portal-dashboard',
    templateUrl: './portal-dashboard.component.html',
    styleUrls: ['./portal-dashboard.component.less'],
    animations: [appModuleAnimation()]
})
export class PortalDashboardComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild(AccountsComponent) accountsComponent: AccountsComponent;
    @ViewChild(TotalsByPeriodComponent) totalsByPeriodComponent: TotalsByPeriodComponent;
    @ViewChild(TrendByPeriodComponent) trendByPeriodComponent: TrendByPeriodComponent;
    @ViewChild(TopSpendingCategoriesComponent) topSpendingCategoriesComponent: TopSpendingCategoriesComponent;
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;
    @HostBinding('class.wide') isWideMode = true;

    private rootComponent: any;

    headlineConfig;
    linksTo: any = [
        {name: 'View_Cash_Flow_Report', route: '../cashflow'},
        {name: 'View_Transaction_Details', route: '../transactions'},
        {name: 'Last Quarter and Month Report', route: '../reports'}
    ];

    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        public bankAccountsService: BankAccountsService,
        public dialog: MatDialog,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    ngOnInit(): void {
        this.rootComponent.overflowHidden(true);
        this.headlineConfig = {
            names: [ this.l('Dashboard_Title') ],
            iconSrc: './assets/common/icons/pie-chart.svg',
            onRefresh: this._cfoService.hasStaticInstance ? undefined : this.invalidate.bind(this),
            buttons: []
        };
        /** Load sync accounts */
        this.bankAccountsService.load();
        this.rootComponent.overflowHidden(true);
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    toggleLeftMenu() {
        this.isWideMode = !this.isWideMode;
        setTimeout(() => {
            this.trendByPeriodComponent.chartComponent.instance.render();
            this.topSpendingCategoriesComponent.pieChart.instance.render();
        }, 300);
    }

    invalidate() {
        this._dashboardService.refresh();
        this.refreshWidgets();
    }

    ngOnDestroy(): void {
        this.rootComponent.removeScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.removeScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
        this.rootComponent.overflowHidden();
    }

    refreshWidgets() {
        /** @todo check requests */
        this.bankAccountsService.load(true, false).subscribe();
    }

    periodChanged(period: string) {
        this._dashboardService.periodChanged(period);
    }

    activate() {
        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        this.bankAccountsService.load();
        this.totalsByPeriodComponent.activate();
        this.trendByPeriodComponent.activate();
        this.synchProgressComponent.activate();
        if (this.accountsComponent)
            this.accountsComponent.activate();
        this.rootComponent.overflowHidden(true);
    }

    openBankAccountsSelectDialog() {
        this.dialog.open(BankAccountsSelectDialogComponent, {
            panelClass: 'slider',
        });
    }

    deactivate() {
        this.rootComponent.overflowHidden();
        this.synchProgressComponent.deactivate();
    }
}
