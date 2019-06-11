/** Core imports */
import { Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { BankAccountsSelectDialogComponent } from 'app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog.component';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from 'shared/animations/routerTransition';
import { AccountsComponent } from '@shared/cfo/dashboard-widgets/accounts/accounts.component';
import { CategorizationStatusComponent } from '@shared/cfo/dashboard-widgets/categorization-status/categorization-status.component';
import { TotalsByPeriodComponent } from '@shared/cfo/dashboard-widgets/totals-by-period/totals-by-period.component';
import { TrendByPeriodComponent } from '@shared/cfo/dashboard-widgets/trend-by-period/trend-by-period.component';
import { DashboardService } from '@shared/cfo/dashboard-widgets/dashboard.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
    animations: [appModuleAnimation()]
})
export class DashboardComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild(AccountsComponent) accountsComponent: AccountsComponent;
    @ViewChild(CategorizationStatusComponent) categorizationStatusComponent: CategorizationStatusComponent;
    @ViewChild(TotalsByPeriodComponent) totalsByPeriodComponent: TotalsByPeriodComponent;
    @ViewChild(TrendByPeriodComponent) trendByPeriodComponent: TrendByPeriodComponent;
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;

    private rootComponent: any;

    headlineConfig;
    linksTo = [
        {name: 'View_Cash_Flow_Report', route: '../cashflow'},
        {name: 'View_Transaction_Details', route: '../transactions'},
        {name: 'View_Financial_Statistics', route: '../stats'},
    ];

    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        private bankAccountsService: BankAccountsService,
        public dialog: MatDialog,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    ngOnInit(): void {
        this.rootComponent.overflowHidden(true);
        this.headlineConfig = {
            names: [this.l('Dashboard_Title')],
            iconSrc: './assets/common/icons/pie-chart.svg',
            onRefresh: () => {
                this._dashboardService.refresh();
                this.refreshWidgets();
            },
            buttons: []
        };
        /** Load sync accounts */
        this.bankAccountsService.load();
        this.rootComponent.overflowHidden(true);
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    ngOnDestroy(): void {
        this.rootComponent.removeScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.removeScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
        this.rootComponent.overflowHidden();
    }

    refreshWidgets() {
        /** @todo check requests */
        this.bankAccountsService.load().subscribe();
    }

    periodChanged(period: string) {
        this._dashboardService.periodChanged(period);
    }

    activate() {
        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        this.bankAccountsService.load();
        this.totalsByPeriodComponent.activate();
        this.trendByPeriodComponent.activate();
        this.categorizationStatusComponent.activate();
        this.synchProgressComponent.activate();
        this.accountsComponent.activate();
        this.rootComponent.overflowHidden(true);
    }

    openBankAccountsSelectDialog() {
        this.dialog.open(BankAccountsSelectDialogComponent, {
            panelClass: ['slider', 'width-45']
        });
    }

    deactivate() {
        this.rootComponent.overflowHidden();
        this.synchProgressComponent.deactivate();
    }
}
