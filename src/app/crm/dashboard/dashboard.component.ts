/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    AfterViewInit,
    ViewChild,
    Injector,
    OnInit,
    OnDestroy,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { filter, first, takeUntil } from 'rxjs/operators';

/** Application imports */
import { AppService } from '@app/app.service';
import { PaymentWizardComponent } from '@app/shared/common/payment-wizard/payment-wizard.component';
import { PeriodComponent } from '@app/shared/common/period/period.component';
import { RootStore, StatesStoreActions } from '@root/store';
import { ModuleType } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';
import { RecentClientsComponent } from '@shared/crm/dashboard-widgets/recent-clients/recent-clients.component';
import { TotalsByPeriodComponent } from '@shared/crm/dashboard-widgets/totals-by-period/totals-by-period.component';
import { TotalsBySourceComponent } from '@shared/crm/dashboard-widgets/totals-by-source/totals-by-source.component';
import { ClientsByRegionComponent } from '@shared/crm/dashboard-widgets/clients-by-region/clients-by-region.component';
import { CrmIntroComponent } from '../shared/crm-intro/crm-intro.component';
import { CustomReuseStrategy } from '@root/root-routing.module';
import { RouteReuseStrategy } from '@angular/router';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { Period } from '@app/shared/common/period/period.enum';

@Component({
    templateUrl: './dashboard.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./dashboard.component.less'],
    providers: [ DashboardWidgetsService, LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent extends AppComponentBase implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild(ClientsByRegionComponent) clientsByRegion: ClientsByRegionComponent;
    @ViewChild(RecentClientsComponent) recentClientsComponent: RecentClientsComponent;
    @ViewChild(TotalsByPeriodComponent) totalsByPeriod: TotalsByPeriodComponent;
    @ViewChild(TotalsBySourceComponent) totalsBySource: TotalsBySourceComponent;
    @ViewChild(PeriodComponent) periodComponent: PeriodComponent;
    private rootComponent: any;
    public headlineConfig = {
        names: [this.l('Dashboard')],
        onRefresh: (refreshLeadsAndClients = true) => {
            this.refresh(refreshLeadsAndClients);
        },
        text: this.l('statistics and reports'),
        icon: 'globe',
        buttons: [
            {
                enabled: true,
                action: () => this.leftMenuHidden = !this.leftMenuHidden,
                lable: '',
                class: 'toggle dx-button'
            }
        ]
    };
    dataEmpty = false;
    totalsData$ = this.dashboardWidgetsService.totalsData$;
    dataAvailable$ = this.dashboardWidgetsService.totalsDataAvailable$;
    dialogConfig = new MatDialogConfig();
    leftMenuHidden = true;
    constructor(
        injector: Injector,
        private appService: AppService,
        private dashboardWidgetsService: DashboardWidgetsService,
        private changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        private store$: Store<RootStore.State>,
        private reuseService: RouteReuseStrategy,
        private lifeCycleSubject: LifecycleSubjectsService
    ) {
        super(injector);
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction('US'));
    }

    ngOnInit() {
        this.dashboardWidgetsService.totalsDataAvailable$.pipe(
            takeUntil(this.destroy$),
            first(),
            filter((dataAvailable: boolean) => this.componentIsActivated && !dataAvailable && this.appService.hasModuleSubscription()),
        ).subscribe(() => {
            this.openDialog();
        });
        this.dashboardWidgetsService.totalsDataAvailable$.subscribe((totalsDataAvailable: boolean) => {
            this.dataEmpty = !totalsDataAvailable;
            this.changeDetectorRef.detectChanges();
        });
    }

    ngAfterViewInit(): void {
        this.activate();
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    refresh(refreshLeadsAndClients = true) {
        this.dashboardWidgetsService.refresh();
        if (refreshLeadsAndClients) {
            /** Invalidate leads and clients */
            (this.reuseService as CustomReuseStrategy).invalidate('leads');
            (this.reuseService as CustomReuseStrategy).invalidate('clients');
        }
    }

    addClient() {
        this._router.navigate(['app/crm/clients'], { queryParams: { action: 'addNew' } });
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
        this.dialog.open(CrmIntroComponent, this.dialogConfig);
    }

    periodChanged(period: Period) {
        this.dashboardWidgetsService.periodChanged(period);
    }

    openPaymentWizardDialog() {
        this.dialog.open(PaymentWizardComponent, {
            height: '800px',
            width: '1200px',
            id: 'payment-wizard',
            panelClass: ['payment-wizard', 'setup'],
            data: {
                module: this.appService.getModuleSubscription(ModuleType.CRM).module,
                title: this.ls(
                    'Platform',
                    'UpgradeYourSubscription',
                    this.appService.getSubscriptionName(ModuleType.CRM)
                )
            }
        });
    }

    activate() {
        super.activate();
        this.lifeCycleSubject.activate.next();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.subscribeToRefreshParam();
        this.appService.updateToolbar(null);
        this.showHostElement(() => {
            if (this.clientsByRegion && this.clientsByRegion.mapComponent)
                this.clientsByRegion.mapComponent.vectorMapComponent.instance.render();
            if (this.totalsBySource && this.totalsBySource.chartComponent)
                this.totalsBySource.chartComponent.instance.render();
            this.changeDetectorRef.detectChanges();
        });
    }

    subscribeToRefreshParam() {
        this._activatedRoute.queryParams
            .pipe(
                takeUntil(this.deactivate$),
                filter(params => !!params['refresh'])
            )
            .subscribe(() => this.refresh() );
    }

    invalidate() {
        this.lifeCycleSubject.activate$.pipe(first()).subscribe(() => {
            this.refresh(false);
        });
    }

    deactivate() {
        super.deactivate();
        this.rootComponent.overflowHidden();
        this.hideHostElement();
    }
}
