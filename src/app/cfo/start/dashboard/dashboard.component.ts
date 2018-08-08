/** Core imports */
import { Component, OnInit, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { Subscription, Subject } from 'rxjs';
import { first, finalize, skipWhile, delayWhen, distinctUntilChanged, last, withLatestFrom, filter, switchMap } from 'rxjs/operators';

/** Application imports */
import { SynchProgressComponent } from '@app/cfo/shared/common/synch-progress/synch-progress.component';
import { BankAccountsSelectComponent } from 'app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import { BankAccountsService } from '@app/cfo/shared/helpers/bank-accounts.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from 'shared/animations/routerTransition';
import { AccountsComponent } from '@shared/cfo/dashboard-widgets/accounts/accounts.component';
import { CategorizationStatusComponent } from '@shared/cfo/dashboard-widgets/categorization-status/categorization-status.component';
import { TotalsByPeriodComponent } from '@shared/cfo/dashboard-widgets/totals-by-period/totals-by-period.component';
import { TrendByPeriodComponent } from '@shared/cfo/dashboard-widgets/trend-by-period/trend-by-period.component';
import { DashboardService } from '@shared/cfo/dashboard-widgets/dashboard.service';
import { CfoIntroComponent } from '../../shared/cfo-intro/cfo-intro.component';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';

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
    updateAfterActivation: boolean;
    linksTo = [
        {name: 'View_Cash_Flow_Report', route: '../cashflow'},
        {name: 'View_Transaction_Details', route: '../transactions'},
        {name: 'View_Financial_Statistics', route: '../stats'},
    ];

    private _componentActivated: Subject<null> = new Subject();
    private componentActivated$ = this._componentActivated.asObservable();
    selectedAccountsSubscription: Subscription;

    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        private _ngxZendeskWebwidgetService: ngxZendeskWebwidgetService,
        private bankAccountsService: BankAccountsService,
        public dialog: MatDialog,
        private _router: Router
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
        /** Load sync accounts */
        this.bankAccountsService.loadSyncAccounts();

        /** After selected accounts change */
        this.bankAccountsService.selectedBankAccountsIds$.subscribe(() => {
            /** filter all widgets by new data if change is on this component */
            if (this._route['_routerState'].snapshot.url === this._router.url) {
                this.filterByBankAccounts(this.bankAccountsService.cachedData);
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
        CFOComponentBase.zendeskWebwidgetShow(this._ngxZendeskWebwidgetService);
    }

    ngOnDestroy(): void {
        CFOComponentBase.zendeskWebwidgetHide(this._ngxZendeskWebwidgetService);
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
        const element = this.getElementRef().nativeElement.querySelector('.dx-scrollable');
        abp.ui.setBusy(element);
        this.bankAccountsService.loadSyncAccounts().pipe(
            first(),
            finalize(() => abp.ui.clearBusy(element))
        ).subscribe(() => {
            this.bankAccountsService.applyFilter();
        });
    }

    periodChanged($event) {
        this._dashboardService.periodChanged($event);
    }

    activate() {
        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        this.bankAccountsService.loadSyncAccounts();

        /** If selected accounts changed in another component - update widgets */
        if (this.updateAfterActivation) {
            this.filterByBankAccounts(this.bankAccountsService.cachedData);
            this.updateAfterActivation = false;
        }

        this.synchProgressComponent.requestSyncAjax();
    }

    deactivate() {
        if (this.selectedAccountsSubscription)
            this.selectedAccountsSubscription.unsubscribe();
    }

    openDialog() {
        this.dialogConfig.height = '655px';
        this.dialogConfig.width = '880px';
        this.dialogConfig.id = this.dialogConfig.backdropClass = 'cfo-intro';
        this.dialogConfig.panelClass = ['cfo-intro', 'dashboard'];
        this.dialogConfig.data = { alreadyStarted: true };
        this.dialog.open(CfoIntroComponent, this.dialogConfig);
    }
}
