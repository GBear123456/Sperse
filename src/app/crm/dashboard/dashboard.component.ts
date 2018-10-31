/** Core imports */
import { Component, AfterViewInit, ViewChild, Injector, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Store } from '@ngrx/store';
import { filter, takeUntil } from 'rxjs/operators';

/** Application imports */
import { AppService } from '@app/app.service';
import { PaymentWizardComponent } from '@app/shared/common/payment-wizard/payment-wizard.component';
import { PeriodComponent } from '@app/shared/common/period/period.component';
import { ZendeskService } from '@app/shared/common/zendesk/zendesk.service';
import { RootStore, StatesStoreActions } from '@root/store';
import { Module } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppConsts } from '@shared/AppConsts';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';
import { RecentClientsComponent } from '@shared/crm/dashboard-widgets/recent-clients/recent-clients.component';
import { TotalsByPeriodComponent } from '@shared/crm/dashboard-widgets/totals-by-period/totals-by-period.component';
import { TotalsBySourceComponent } from '@shared/crm/dashboard-widgets/totals-by-source/totals-by-source.component';
import { CrmIntroComponent } from '../shared/crm-intro/crm-intro.component';

@Component({
    templateUrl: './dashboard.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./dashboard.component.less'],
    providers: [ DashboardWidgetsService ]
})
export class DashboardComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(RecentClientsComponent) recentClientsComponent: RecentClientsComponent;
    @ViewChild(TotalsByPeriodComponent) totalsByPeriod: TotalsByPeriodComponent;
    @ViewChild(TotalsBySourceComponent) totalsBySource: TotalsBySourceComponent;
    @ViewChild(PeriodComponent) periodComponent: PeriodComponent;
    private rootComponent: any;
    private selectedPeriod: any;
    private openDialogTimeout: any;
    public dataEmpty: boolean;
    public headlineConfig = {
        names: [this.l('Dashboard')],
        onRefresh: this.refresh.bind(this),
        text: this.l('statistics and reports'),
        icon: 'globe',
        buttons: []
    };
    dialogConfig = new MatDialogConfig();
    componentIsActive = false;

    constructor(
        injector: Injector,
        private _router: Router,
        private _appService: AppService,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private zendeskService: ZendeskService,
        public dialog: MatDialog,
        private store$: Store<RootStore.State>,
        private activatedRoute: ActivatedRoute
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction('US'));
    }

    refresh() {
        this.startLoading();
        this.periodChanged(this.selectedPeriod);
        this.recentClientsComponent.refresh();
    }

    checkDataEmpty(data) {
        this.dataEmpty = !data.length;
        if (this.dataEmpty && this.componentIsActive) {
            clearTimeout(this.openDialogTimeout);
            this.openDialogTimeout = setTimeout(() => {
                if (this._appService.hasModuleSubscription())
                    this.openDialog();
            }, 500);
        }
        this.finishLoading();
    }

    addClient() {
        this._router.navigate(['app/crm/clients'], { queryParams: { action: 'addNew' } });
    }

    periodChanged($event) {
        this._dashboardWidgetsService.periodChanged(
            this.selectedPeriod = $event
        );
    }

    ngAfterViewInit(): void {
        this.startLoading();
        this.activate();
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        this.deactivate();

        this.rootComponent.removeScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.removeScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    openDialog() {
        this.dialogConfig.height = '650px';
        this.dialogConfig.width = '900px';
        this.dialogConfig.id = 'crm-intro';
        this.dialogConfig.panelClass = ['crm-intro', 'setup'];
        this.dialogConfig.data = { alreadyStarted: false };
        const dialogRef = this.dialog.open(CrmIntroComponent, this.dialogConfig);
        dialogRef.afterClosed().subscribe(result => {
            // if (result && result.isGetStartedButtonClicked) this.onStart();
        });
    }

    openPaymentWizardDialog() {
        this.dialog.open(PaymentWizardComponent, {
            height: '655px',
            width: '980px',
            id: 'payment-wizard',
            panelClass: ['payment-wizard', 'setup'],
            data: {
                module: Module.CRM,
                title: this.ls('Platform', 'UpgradeYourSubscription', Module.CRM)
            }
        });
    }

    activate() {
        super.activate();
        this.componentIsActive = true;
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.subscribeToRefreshParam();
        this._appService.updateToolbar(null);
        this.zendeskService.showWidget();

        this.showHostElement();
        this.renderWidgets();
    }

    subscribeToRefreshParam() {
        this.activatedRoute.queryParams
            .pipe(
                takeUntil(this.deactivate$),
                filter(params => !!params['refresh'])
            )
            .subscribe(() => this.invalidate() );
    }

    renderWidgets() {
        setTimeout(() => {
            this.totalsByPeriod.render();
            this.totalsBySource.render();
        }, 300);
    }

    invalidate() {
        this.refresh();
    }

    deactivate() {
        super.deactivate();
        this.componentIsActive = false;

        this.finishLoading();
        this.zendeskService.hideWidget();
        this.rootComponent.overflowHidden();

        this.hideHostElement();
    }
}
