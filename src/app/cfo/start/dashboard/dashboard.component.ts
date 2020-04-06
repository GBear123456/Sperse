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
import { Period } from '@app/shared/common/period/period.enum';
import { LeftMenuComponent } from '../../shared/common/left-menu/left-menu.component';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
    animations: [appModuleAnimation()]
})
export class DashboardComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild(AccountsComponent, { static: false }) accountsComponent: AccountsComponent;
    @ViewChild(CategorizationStatusComponent, { static: false }) categorizationStatusComponent: CategorizationStatusComponent;
    @ViewChild(TotalsByPeriodComponent, { static: false }) totalsByPeriodComponent: TotalsByPeriodComponent;
    @ViewChild(TrendByPeriodComponent, { static: false }) trendByPeriodComponent: TrendByPeriodComponent;
    @ViewChild(SynchProgressComponent, { static: false }) synchProgressComponent: SynchProgressComponent;
    @ViewChild('leftMenu', { static: false }) leftMenu: LeftMenuComponent;

    private rootComponent: any;
    accessAllDepartments = this._cfoService.accessAllDepartments;
    linksTo = [
        { name: 'View_Cash_Flow_Report', route: '../cashflow' },
        { name: 'View_Transaction_Details', route: '../transactions' },
        { name: 'View_Financial_Statistics', route: '../stats' },
    ];

    constructor(
        injector: Injector,
        private dashboardService: DashboardService,
        public bankAccountsService: BankAccountsService,
        public dialog: MatDialog,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    ngOnInit(): void {
        this.rootComponent.overflowHidden(true);
        /** Load sync accounts */
        this.bankAccountsService.load();
        this.rootComponent.overflowHidden(true);
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    reload() {
        this.invalidate();
    }

    invalidate() {
        this.dashboardService.refresh();
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

    rerenderWidgets() {
        setTimeout(() => this.trendByPeriodComponent.updateWidth());
    }

    activate() {
        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        if (this.accessAllDepartments) {
            this.bankAccountsService.load();
            this.totalsByPeriodComponent.activate();
            this.trendByPeriodComponent.updateChartWidthAfterActivation = true;
            this.trendByPeriodComponent.activate();
            this.categorizationStatusComponent.activate();
            this.accountsComponent.activate();
        }
        this.synchProgressComponent.activate();
        this.rootComponent.overflowHidden(true);
    }

    openBankAccountsSelectDialog() {
        this.dialog.open(BankAccountsSelectDialogComponent, {
            panelClass: 'slider',
        });
    }

    deactivate() {
        this.rootComponent.overflowHidden();
        this.dialog.closeAll();
        this.synchProgressComponent.deactivate();
    }
}
