/** Core imports */
import { Component, OnInit, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { BankAccountsSelectComponent } from 'app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import { ZendeskService } from '@app/shared/common/zendesk/zendesk.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from 'shared/animations/routerTransition';
import { AccountsComponent } from '@shared/cfo/dashboard-widgets/accounts/accounts.component';
import { CategorizationStatusComponent } from '@shared/cfo/dashboard-widgets/categorization-status/categorization-status.component';
import { TotalsByPeriodComponent } from '@shared/cfo/dashboard-widgets/totals-by-period/totals-by-period.component';
import { TrendByPeriodComponent } from '@shared/cfo/dashboard-widgets/trend-by-period/trend-by-period.component';
import { DashboardService } from '@shared/cfo/dashboard-widgets/dashboard.service';

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
    updateAfterActivation: boolean;
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
        private zendeskService: ZendeskService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.rootComponent.overflowHidden(true);
        this.headlineConfig = {
            names: [this.l('Dashboard_Title')],
            iconSrc: './assets/common/icons/pie-chart.svg',
            onRefresh: this.refreshWidgets.bind(this),
            buttons: []
        };
        /** Load sync accounts */
        this.bankAccountsService.load();

        /** After selected accounts change */
        this.bankAccountsService.selectedBankAccountsIds$.subscribe(() => {
            /** filter all widgets by new data if change is on this component */
            if (this.componentIsActivated) {
                this.filterByBankAccounts(this.bankAccountsService.state);
            /** if change is on another component - mark this for future update */
            } else {
                this.updateAfterActivation = true;
            }
        });

        this.rootComponent.overflowHidden(true);
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    ngAfterViewInit(): void {
        this.zendeskService.showWidget();
    }

    ngOnDestroy(): void {
        this.zendeskService.hideWidget();
        this._dashboardService.unsubscribe();
        this.rootComponent.removeScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.removeScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
        this.rootComponent.overflowHidden();
    }

    filterByBankAccounts(data) {
        this.accountsComponent.filterByBankAccounts(data);
        this.categorizationStatusComponent.filterByBankAccounts(data);
        this.totalsByPeriodComponent.filterByBankAccounts(data.selectedBankAccountIds);
        this.trendByPeriodComponent.filterByBankAccounts(data.selectedBankAccountIds);
    }

    refreshWidgets() {
        const element = this.getElementRef().nativeElement.querySelector('.content .right');
        abp.ui.setBusy(element);
        this.loadAllWidgetsData();
        /** @todo check requests */
        this.bankAccountsService.load().pipe(
            finalize(() => abp.ui.clearBusy(element))
        ).subscribe();
    }

    loadAllWidgetsData() {
        this.accountsComponent.getAccountTotals();
        this.accountsComponent.getDailyStats();
        this.totalsByPeriodComponent.loadStatsData();
        this.trendByPeriodComponent.loadStatsData();
        this.categorizationStatusComponent.getCategorizationStatus();
    }

    periodChanged($event) {
        this._dashboardService.periodChanged($event);
    }

    activate() {
        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        this.bankAccountsService.load();

        /** If selected accounts changed in another component - update widgets */
        if (this.updateAfterActivation) {
            this.filterByBankAccounts(this.bankAccountsService.state);
            this.updateAfterActivation = false;
        }

        this.synchProgressComponent.activate();
        this.rootComponent.overflowHidden(true);

        this.renderWidgets();
    }

    renderWidgets() {
        setTimeout(() => {
            this.totalsByPeriodComponent.render();
        }, 300);
    }

    deactivate() {
        this.rootComponent.overflowHidden();
        this.synchProgressComponent.deactivate();
    }
}
