import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { Component, OnInit, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from 'shared/animations/routerTransition';
import { BankAccountsSelectComponent } from 'app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { AccountsComponent } from '@shared/cfo/dashboard-widgets/accounts/accounts.component';
import { CategorizationStatusComponent } from '@shared/cfo/dashboard-widgets/categorization-status/categorization-status.component';
import { TotalsByPeriodComponent } from '@shared/cfo/dashboard-widgets/totals-by-period/totals-by-period.component';
import { TrendByPeriodComponent } from '@shared/cfo/dashboard-widgets/trend-by-period/trend-by-period.component';
import { DashboardService } from '@shared/cfo/dashboard-widgets/dashboard.service';
import { SynchProgressComponent } from '@app/cfo/shared/common/synch-progress/synch-progress.component';

import { MatDialog, MatDialogConfig } from '@angular/material';
import { CfoIntroComponent } from '../../shared/cfo-intro/cfo-intro.component';

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
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;

    private rootComponent: any;

    headlineConfig;
    dialogConfig = new MatDialogConfig();

    linksTo = [
        {name: 'View_Cash_Flow_Report', route: '../cashflow'},
        {name: 'View_Transaction_Details', route: '../transactions'},
        {name: 'View_Financial_Statistics', route: '../stats'},
    ];

    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        private _ngxZendeskWebwidgetService: ngxZendeskWebwidgetService,
        public dialog: MatDialog
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

        this.rootComponent.overflowHidden(true);
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    ngAfterViewInit(): void {
        CFOComponentBase.zendeskWebwidgetShow(this._ngxZendeskWebwidgetService);
    }

    ngOnDestroy(): void {
        this.rootComponent.overflowHidden();
        CFOComponentBase.zendeskWebwidgetHide(this._ngxZendeskWebwidgetService);
        this._dashboardService.unsubscribe();

        this.rootComponent.removeScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.removeScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
        this.rootComponent.overflowHidden();
    }

    filterByBankAccounts(data) {
        this.accountsComponent.filterByBankAccounts(data);
        this.categorizationStatusComponent.filterByBankAccounts(data);
        this.totalsByPeriodComponent.filterByBankAccounts(data.bankAccountIds);
        this.trendByPeriodComponent.filterByBankAccounts(data.bankAccountIds);
    }

    refreshWidgets() {
        this.bankAccountSelector.getBankAccounts(true);
    }

    periodChanged($event) {
        this._dashboardService.periodChanged($event);
    }

    activate() {
        this.bankAccountSelector.handleSelectedBankAccounts();
        this.synchProgressComponent.requestSyncAjax();
    }

    openDialog() {
        this.dialogConfig.height = '655px';
        this.dialogConfig.width = '880px';
        this.dialogConfig.id = this.dialogConfig.backdropClass = 'cfo-intro';
        this.dialogConfig.panelClass = ['cfo-intro', 'dashboard'];
        this.dialogConfig.data = { alreadyStarted: true };

        const dialogRef = this.dialog.open(CfoIntroComponent, this.dialogConfig);
        dialogRef.afterClosed().subscribe(result => {
        });
    }
}
