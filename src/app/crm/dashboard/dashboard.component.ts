/** Core imports */
import { Component, AfterViewInit, ViewChild, Injector, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { filter, first, takeUntil } from 'rxjs/operators';

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
import { CustomReuseStrategy } from '@root/root-routing.module';
import { RouteReuseStrategy } from '@angular/router';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    templateUrl: './dashboard.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./dashboard.component.less'],
    providers: [ DashboardWidgetsService, LifecycleSubjectsService ]
})
export class DashboardComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(RecentClientsComponent) recentClientsComponent: RecentClientsComponent;
    @ViewChild(TotalsByPeriodComponent) totalsByPeriod: TotalsByPeriodComponent;
    @ViewChild(TotalsBySourceComponent) totalsBySource: TotalsBySourceComponent;
    @ViewChild(PeriodComponent) periodComponent: PeriodComponent;
    private rootComponent: any;
    private selectedPeriod: any;
    private openDialogTimeout: any;
    private loadingContainer: any;
    public dataEmpty: boolean;
    public headlineConfig = {
        names: [this.l('Dashboard')],
        onRefresh: this.refresh.bind(this),
        text: this.l('statistics and reports'),
        icon: 'globe',
        buttons: [
            {
                enabled: true,
                action: () => this.leftMenuHidden = !this.leftMenuHidden,
                lable: '',
                'class': 'toggle dx-button'
            }
        ]
    };
    dialogConfig = new MatDialogConfig();
    leftMenuHidden = true;
    constructor(
        injector: Injector,
        private _appService: AppService,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private zendeskService: ZendeskService,
        public dialog: MatDialog,
        private store$: Store<RootStore.State>,
        private reuseService: RouteReuseStrategy,
        private lifeCycleSubject: LifecycleSubjectsService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this._appService.localizationSourceName = this.localizationSourceName;
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction('US'));
    }

    refresh(refreshLeadsAndClients = true) {
        this.startLoading(false, this.loadingContainer);
        this.periodChanged(this.selectedPeriod);
        this.recentClientsComponent.refresh();
        if (refreshLeadsAndClients) {
            /** Invalidate leads and clients */
            (this.reuseService as CustomReuseStrategy).invalidate('leads');
            (this.reuseService as CustomReuseStrategy).invalidate('clients');
        }
    }

    checkDataEmpty(data) {
        this.dataEmpty = !data.length;
        if (this.dataEmpty && this.componentIsActivated) {
            clearTimeout(this.openDialogTimeout);
            this.openDialogTimeout = setTimeout(() => {
                if (this._appService.hasModuleSubscription())
                    this.openDialog();
            }, 500);
        }
        this.finishLoading(false, this.loadingContainer);
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
        this.loadingContainer = this.getElementRef().nativeElement.getElementsByClassName('widgets-wrapper')[0];
        this.startLoading(false, this.loadingContainer);

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
        this.lifeCycleSubject.activate.next();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.subscribeToRefreshParam();
        this._appService.updateToolbar(null);
        this.zendeskService.showWidget();

        this.showHostElement();
        this.renderWidgets();
    }

    subscribeToRefreshParam() {
        this._activatedRoute.queryParams
            .pipe(
                takeUntil(this.deactivate$),
                filter(params => !!params['refresh'])
            )
            .subscribe(() => this.refresh() );
    }

    renderWidgets() {
        setTimeout(() => {
            this.totalsByPeriod.render();
            this.totalsBySource.render();
        }, 300);
    }

    invalidate() {
        this.lifeCycleSubject.activate$.pipe(first()).subscribe(() => {
            this.refresh(false);
        });
    }

    deactivate() {
        super.deactivate();

        this.finishLoading(false, this.loadingContainer);
        this.zendeskService.hideWidget();
        this.rootComponent.overflowHidden();

        this.hideHostElement();
    }
}
