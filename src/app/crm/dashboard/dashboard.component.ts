/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    AfterViewInit,
    ViewChild,
    OnInit,
    ChangeDetectorRef
} from '@angular/core';
import { RouteReuseStrategy, ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { CacheService } from 'ng2-cache-service';
import { Observable, ReplaySubject } from 'rxjs';
import { filter, first, takeUntil, map } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppService } from '@app/app.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PaymentWizardComponent } from '@app/shared/common/payment-wizard/payment-wizard.component';
import { RootStore, StatesStoreActions } from '@root/store';
import { DashboardServiceProxy, GetCRMStatusOutput, ModuleType, LayoutType } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';
import { TotalsBySourceComponent } from '@shared/crm/dashboard-widgets/totals-by-source/totals-by-source.component';
import { ClientsByRegionComponent } from '@shared/crm/dashboard-widgets/clients-by-region/clients-by-region.component';
import { CrmIntroComponent } from '../shared/crm-intro/crm-intro.component';
import { CustomReuseStrategy } from '@root/root-routing.module';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { Period } from '@app/shared/common/period/period.enum';
import { PeriodService } from '@app/shared/common/period/period.service';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    templateUrl: './dashboard.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./dashboard.component.less'],
    providers: [ DashboardWidgetsService, LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements AfterViewInit, OnInit {
    @ViewChild(ClientsByRegionComponent, { static: false }) clientsByRegion: ClientsByRegionComponent;
    @ViewChild(TotalsBySourceComponent, { static: false }) totalsBySource: TotalsBySourceComponent;

    private showWelcomeSection: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
    showWelcomeSection$: Observable<boolean> = this.showWelcomeSection.asObservable();
    showDefaultSection$: Observable<boolean> = this.showWelcomeSection$.pipe(
        map((showWelcomeSection: boolean) => showWelcomeSection === false)
    );
    showLoadingSpinner = true;
    private introAcceptedCacheKey: string = this.cacheHelper.getCacheKey('CRMIntro', 'IntroAccepted');
    dialogConfig = new MatDialogConfig();
    isGrantedCustomers = this.permission.isGranted(AppPermissions.CRMCustomers);
    isGrantedOrders = this.permission.isGranted(AppPermissions.CRMOrders);
    hasCustomersPermission: boolean = this.permission.isGranted(AppPermissions.CRMCustomers);
    hasOrdersPermission: boolean = this.permission.isGranted(AppPermissions.CRMOrders);
    hasPermissionToAddClient: boolean = this.permission.isGranted(AppPermissions.CRMCustomersManage);
    localization = AppConsts.localization.CRMLocalizationSourceName;

    constructor(
        private router: Router,
        private appService: AppService,
        private appSessionService: AppSessionService,
        private dashboardWidgetsService: DashboardWidgetsService,
        private changeDetectorRef: ChangeDetectorRef,
        private periodService: PeriodService,
        private store$: Store<RootStore.State>,
        private reuseService: RouteReuseStrategy,
        private cacheService: CacheService,
        private lifeCycleSubject: LifecycleSubjectsService,
        private dashboardServiceProxy: DashboardServiceProxy,
        private activatedRoute: ActivatedRoute,
        public ui: AppUiCustomizationService,
        public permission: AppPermissionService,
        public cacheHelper: CacheHelper,
        public ls: AppLocalizationService,
        public dialog: MatDialog
    ) {
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
        this.router.navigate(['app/crm/clients'], { queryParams: { action: 'addNew' } });
    }

    private loadStatus() {
        this.dashboardServiceProxy.getStatus().subscribe((status: GetCRMStatusOutput) => {
            this.showWelcomeSection.next(!status.hasData);
            this.showLoadingSpinner = false;
        });
    }

    openDialog() {
        let tenant = this.appSessionService.tenant;
        if (!tenant || !tenant.customLayoutType || tenant.customLayoutType == LayoutType.Default) {
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
                title: this.ls.ls(
                    AppConsts.localization.defaultLocalizationSourceName,
                    'UpgradeYourSubscription',
                    this.appService.getSubscriptionName(ModuleType.CRM)
                )
            }
        });
    }

    activate() {
        this.loadStatus();
        this.lifeCycleSubject.activate.next();
        this.subscribeToRefreshParam();

        if (this.clientsByRegion && this.clientsByRegion.mapComponent)
            this.clientsByRegion.mapComponent.vectorMapComponent.instance.render();
        if (this.totalsBySource && this.totalsBySource.chartComponent)
            this.totalsBySource.chartComponent.instance.refresh();
        this.changeDetectorRef.detectChanges();
    }

    subscribeToRefreshParam() {
        this.activatedRoute.queryParams
            .pipe(
                takeUntil(this.lifeCycleSubject.deactivate$),
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
        this.lifeCycleSubject.deactivate.next();
    }
}