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
import { RouteReuseStrategy } from '@angular/router';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { CacheService } from 'ng2-cache-service';
import { Observable, ReplaySubject } from 'rxjs';
import { filter, first, takeUntil, map } from 'rxjs/operators';

/** Application imports */
import { AppService } from '@app/app.service';
import { PaymentWizardComponent } from '@app/shared/common/payment-wizard/payment-wizard.component';
import { PeriodComponent } from '@app/shared/common/period/period.component';
import { RootStore, StatesStoreActions } from '@root/store';
import { DashboardServiceProxy, GetCRMStatusOutput, ModuleType } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';
import { RecentClientsComponent } from '@shared/crm/dashboard-widgets/recent-clients/recent-clients.component';
import { TotalsByPeriodComponent } from '@shared/crm/dashboard-widgets/totals-by-period/totals-by-period.component';
import { TotalsBySourceComponent } from '@shared/crm/dashboard-widgets/totals-by-source/totals-by-source.component';
import { ClientsByRegionComponent } from '@shared/crm/dashboard-widgets/clients-by-region/clients-by-region.component';
import { CrmIntroComponent } from '../shared/crm-intro/crm-intro.component';
import { CustomReuseStrategy } from '@root/root-routing.module';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { Period } from '@app/shared/common/period/period.enum';
import { PeriodService } from '@app/shared/common/period/period.service';

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
                label: '',
                class: 'toggle dx-button'
            }
        ]
    };
    private showWelcomeSection: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
    showWelcomeSection$: Observable<boolean> = this.showWelcomeSection.asObservable();
    showDefaultSection$: Observable<boolean> = this.showWelcomeSection$.pipe(
        map((showWelcomeSection: boolean) => showWelcomeSection === false)
    );
    showLoadingSpinner = true;
    private introAcceptedCacheKey: string = this.cacheHelper.getCacheKey('CRMIntro', 'IntroAccepted');
    dialogConfig = new MatDialogConfig();
    leftMenuHidden = true;
    constructor(
        injector: Injector,
        private appService: AppService,
        private dashboardWidgetsService: DashboardWidgetsService,
        private changeDetectorRef: ChangeDetectorRef,
        private periodService: PeriodService,
        private store$: Store<RootStore.State>,
        private reuseService: RouteReuseStrategy,
        private cacheService: CacheService,
        private lifeCycleSubject: LifecycleSubjectsService,
        private dashboardServiceProxy: DashboardServiceProxy,
        public dialog: MatDialog
    ) {
        super(injector);
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction('US'));
    }

    ngOnInit() {
        this.loadStatus();
        const introAcceptedCache = this.cacheService.get(this.introAcceptedCacheKey);
        /** Show crm wizard if there is no cache for it */
        if (!introAcceptedCache || introAcceptedCache === 'false') {
            this.cacheService.set(this.introAcceptedCacheKey, 'false');
            this.openDialog();
        }
    }

    ngAfterViewInit(): void {
        this.activate();
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    refresh(refreshLeadsAndClients = true) {
        this.dashboardWidgetsService.refresh();
        /** Reload status after refresh if it's showing welcome page */
        this.showWelcomeSection$.pipe(
            first(),
            filter(Boolean)
        ).subscribe(() => {
            this.loadStatus();
        });
        if (refreshLeadsAndClients) {
            /** Invalidate leads and clients */
            (this.reuseService as CustomReuseStrategy).invalidate('leads');
            (this.reuseService as CustomReuseStrategy).invalidate('clients');
        }
    }

    addClient() {
        this._router.navigate(['app/crm/clients'], { queryParams: { action: 'addNew' } });
    }

    private loadStatus() {
        this.dashboardServiceProxy.getStatus().subscribe((status: GetCRMStatusOutput) => {
            this.showWelcomeSection.next(!status.hasData);
            this.showLoadingSpinner = false;
        });
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
        this.dialog.open(CrmIntroComponent, this.dialogConfig).afterClosed().subscribe(() => {
            /** Mark accepted cache with true when user closed intro and don't want to see it anymore) */
            this.cacheService.set(this.introAcceptedCacheKey, 'true');
        });
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
        this.loadStatus();
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
