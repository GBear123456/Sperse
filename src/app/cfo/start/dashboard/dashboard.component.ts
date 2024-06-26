/** Core imports */
import { Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { DomHelper } from '@shared/helpers/DomHelper';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { BankAccountsSelectDialogComponent } from 'app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog.component';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AccountsComponent } from '@shared/cfo/dashboard-widgets/accounts/accounts.component';
import { CategorizationStatusComponent } from '@shared/cfo/dashboard-widgets/categorization-status/categorization-status.component';
import { TotalsByPeriodComponent } from '@shared/cfo/dashboard-widgets/totals-by-period/totals-by-period.component';
import { TrendByPeriodComponent } from '@shared/cfo/dashboard-widgets/trend-by-period/trend-by-period.component';
import { DashboardService } from '@shared/cfo/dashboard-widgets/dashboard.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { LeftMenuComponent } from '../../shared/common/left-menu/left-menu.component';
import { LayoutService } from '@app/shared/layout/layout.service';
import { AppService } from '@app/app.service';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild(AccountsComponent) accountsComponent: AccountsComponent;
    @ViewChild(CategorizationStatusComponent) categorizationStatusComponent: CategorizationStatusComponent;
    @ViewChild(TotalsByPeriodComponent) totalsByPeriodComponent: TotalsByPeriodComponent;
    @ViewChild(TrendByPeriodComponent) trendByPeriodComponent: TrendByPeriodComponent;
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;
    @ViewChild('leftMenu') leftMenu: LeftMenuComponent;

    private rootComponent: any;
    accessAllDepartments = this._cfoService.accessAllDepartments;
    linksTo = [
        { name: 'View_Cash_Flow_Report', route: '../cashflow' },
        { name: 'View_Transaction_Details', route: '../transactions' },
        { name: 'View_Financial_Statistics', route: '../stats' },
    ];

    constructor(
        injector: Injector,
        public appService: AppService,
        private dashboardService: DashboardService,
        public bankAccountsService: BankAccountsService,
        public dialog: MatDialog,
        public layoutService: LayoutService,
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
        DomHelper.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        DomHelper.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    reload() {
        this.invalidate();
    }

    invalidate() {
        this.dashboardService.refresh();
        this.refreshWidgets();
    }

    ngOnDestroy(): void {
        DomHelper.removeScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        DomHelper.removeScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
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
        this.appService.isClientSearchDisabled = true;
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
