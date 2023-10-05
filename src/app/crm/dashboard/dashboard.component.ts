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
import { select, Store } from '@ngrx/store';
import { CacheService } from 'ng2-cache-service';
import { Observable, Subject, ReplaySubject, combineLatest } from 'rxjs';
import { filter, first, takeUntil, map, delay } from 'rxjs/operators';

/** Application imports */
import { AppStore } from '@app/store';
import { AppConsts } from '@shared/AppConsts';
import { AppService } from '@app/app.service';
import {
    OrganizationUnitsStoreActions,
    OrganizationUnitsStoreSelectors
} from '@app/crm/store';
import { ContactGroup } from '@shared/AppEnums';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { RootStore, StatesStoreActions } from '@root/store';
import { DashboardServiceProxy, GetCRMStatusOutput, ModuleType, LayoutType } from '@shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterSourceComponent } from '../shared/filters/source-filter/source-filter.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { FilterRadioGroupComponent } from '@shared/filters/radio-group/filter-radio-group.component';
import { FilterRadioGroupModel } from '@shared/filters/radio-group/filter-radio-group.model';
import { SourceContactFilterModel } from '../shared/filters/source-filter/source-filter.model';
import { TotalsBySourceComponent } from '@shared/crm/dashboard-widgets/totals-by-source/totals-by-source.component';
import { ClientsByRegionComponent } from '@shared/crm/dashboard-widgets/clients-by-region/clients-by-region.component';
import { CrmIntroComponent } from '../shared/crm-intro/crm-intro.component';
import { CustomReuseStrategy } from '@shared/common/custom-reuse-strategy/custom-reuse-strategy.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { PeriodService } from '@app/shared/common/period/period.service';
import { AppPermissions } from '@shared/AppPermissions';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';
import { LeftMenuComponent } from '../shared/common/left-menu/left-menu.component';
import { LayoutService } from '@app/shared/layout/layout.service';

@Component({
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
    providers: [ DashboardWidgetsService, LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements AfterViewInit, OnInit {
    @ViewChild(ClientsByRegionComponent) clientsByRegion: ClientsByRegionComponent;
    @ViewChild(TotalsBySourceComponent) totalsBySource: TotalsBySourceComponent;
    @ViewChild(LeftMenuComponent) leftMenu: LeftMenuComponent;

    private showWelcomeSection: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
    showWelcomeSection$: Observable<boolean> = this.showWelcomeSection.asObservable();
    showDefaultSection$: Observable<boolean> = this.showWelcomeSection$.pipe(
        map((showWelcomeSection: boolean) => showWelcomeSection === false)
    );
    showLoadingSpinner = true;
    private introAcceptedCacheKey: string = this.cacheHelper.getCacheKey('CRMIntro', 'IntroAccepted');
    dialogConfig = new MatDialogConfig();
    isGrantedOrders = this.permission.isGranted(AppPermissions.CRMOrders);
    hasAnyCGPermission: boolean = !!this.permission.getFirstAvailableCG();
    hasCustomersPermission: boolean = this.permission.isGranted(AppPermissions.CRMCustomers);
    hasOrdersPermission: boolean = this.permission.isGranted(AppPermissions.CRMOrders);
    hasPermissionToAddClient: boolean = this.permission.isGranted(AppPermissions.CRMCustomersManage);
    localization = AppConsts.localization.CRMLocalizationSourceName;
    leftMenuCollapsed$: Observable<boolean> = this.leftMenuService.collapsed$;

    clientsByRegionLoad: Subject<any> = new Subject<any>();
    totalsByPeriodLoad: Subject<any> = new Subject<any>();
    totalsBySourceLoad: Subject<any> = new Subject<any>();
    recentClientsLoad: Subject<any> = new Subject<any>();

    accessilbeContactGroups = Object.keys(ContactGroup).map(item => {
        if (this.permission.checkCGPermission([ContactGroup[item]], ''))
            return {
                id: ContactGroup[item],
                name: this.ls.l('ContactGroup_' + item)
            };
    }).filter(Boolean);
    hasAccessibleCG = this.accessilbeContactGroups.length !== 0;

    filterModelContactGroup = new FilterModel({
        caption: 'ContactGroup',
        component: FilterRadioGroupComponent,
        items: {
            element: new FilterRadioGroupModel({
                showFirstAsDefault: true,
                value: this.permission.getFirstAvailableCG(),
                list: this.accessilbeContactGroups
            })
        }
    });
    filterModelOrgUnit: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'SourceOrganizationUnitId',
        hidden: this.appSessionService.hideUserSourceFilters,
        field: 'SourceOrganizationUnitId',
        items: {
            element: new FilterCheckBoxesModel(
                {
                    dataSource$: this.appStore$.pipe(select(OrganizationUnitsStoreSelectors.getOrganizationUnits)),
                    nameField: 'displayName',
                    keyExpr: 'id'
                })
        }
    });
    filterModelSource: FilterModel = new FilterModel({
        component: FilterSourceComponent,
        caption: 'Source',
        hidden: this.appSessionService.hideUserSourceFilters,
        items: {
            element: new SourceContactFilterModel({
                ls: this.ls
            })
        }
    });

    private filters: FilterModel[] = this.getFilters();

    constructor(
        private router: Router,
        private appService: AppService,
        private appSessionService: AppSessionService,
        public dashboardWidgetsService: DashboardWidgetsService,
        private changeDetectorRef: ChangeDetectorRef,
        private periodService: PeriodService,
        private store$: Store<RootStore.State>,
        private appStore$: Store<AppStore.State>,
        private reuseService: RouteReuseStrategy,
        private cacheService: CacheService,
        private lifeCycleSubject: LifecycleSubjectsService,
        private dashboardServiceProxy: DashboardServiceProxy,
        private activatedRoute: ActivatedRoute,
        private leftMenuService: LeftMenuService,
        private filtersService: FiltersService,
        public layoutService: LayoutService,
        public ui: AppUiCustomizationService,
        public permission: AppPermissionService,
        public cacheHelper: CacheHelper,
        public ls: AppLocalizationService,
        public dialog: MatDialog
    ) {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(AppConsts.defaultCountryCode));
        this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(false));
    }

    ngOnInit() {
        if (this.hasAccessibleCG) {
            this.loadStatus();
        }

        const introAcceptedCache = this.cacheService.get(this.introAcceptedCacheKey);
        /** Show crm wizard if there is no cache for it */
        if (!introAcceptedCache || introAcceptedCache === 'false') {
            this.cacheService.set(this.introAcceptedCacheKey, 'false');
            this.openDialog();
        }
    }

    ngAfterViewInit(): void {
        if (this.hasAccessibleCG) {
            combineLatest(
                this.dashboardWidgetsService.period$,
                this.dashboardWidgetsService.contactId$,
                this.dashboardWidgetsService.totalsData$,
                this.dashboardWidgetsService.contactGroupId$,
                this.dashboardWidgetsService.sourceOrgUnitIds$,
                this.dashboardWidgetsService.refresh$
            ).pipe(
                delay(300), first()
            ).subscribe(() => {
                this.clientsByRegionLoad.next();
            });
        }

        this.activate();
    }

    private getFilters() {
        return [
            this.filterModelContactGroup,
            this.filterModelOrgUnit,
            this.filterModelSource
        ];
    }

    initFilterConfig() {
        if (this.filters) {
            this.filtersService.setup(this.filters);
            this.filtersService.checkIfAnySelected();
        } else {
            this.filtersService.setup(
                this.filters = this.getFilters()
            );
        }

        this.filtersService.apply(filters => {
            filters && filters.forEach(filter => {
                if (filter.caption == 'Source')
                    this.dashboardWidgetsService.setContactIdForTotals(
                        filter.items.element.value[0].value || undefined);
                else if (filter.field == 'SourceOrganizationUnitId')
                    this.dashboardWidgetsService.setOrgUnitIdsForTotals(
                        filter.items.element.value);
                else if (filter.caption == 'ContactGroup') 
                    this.dashboardWidgetsService.setGroupIdForTotals(
                        filter.items.element.value || ContactGroup.Client);
            });

            if (this.leftMenu) {
                this.leftMenu.initMenuItems();
            }
        });
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
        if (this.filterModelContactGroup.items.element.value) {
            this.dashboardServiceProxy.getStatus(this.filterModelContactGroup.items.element.value.toString(), undefined).subscribe((status: GetCRMStatusOutput) => {
                this.showWelcomeSection.next(!status.hasData);
                this.showLoadingSpinner = false;
                this.changeDetectorRef.detectChanges();
            });
        }
    }

    openDialog() {
        if (this.appService.isHostTenant)
            return;

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

    activate() {
        this.lifeCycleSubject.activate.next();

        if (this.hasAccessibleCG) {
            this.loadStatus();
            this.subscribeToRefreshParam();
            this.refreshClientsByRegion();
            this.refreshTotalsBySource();
            this.initFilterConfig();
        }
        else {
            this.showLoadingSpinner = false;
        }
        this.ui.overflowHidden(true);
        this.appService.isClientSearchDisabled = true;
        this.appService.toolbarIsHidden.next(true);
        this.changeDetectorRef.markForCheck()
    }

    subscribeToRefreshParam() {
        this.activatedRoute.queryParams
            .pipe(
                takeUntil(this.lifeCycleSubject.deactivate$),
                filter(params => !!params['refresh'])
            )
            .subscribe(() => this.refresh() );
    }

    repaint() {
        this.refreshClientsByRegion();
        this.refreshTotalsBySource();
    }

    private refreshClientsByRegion() {
        if (this.clientsByRegion && this.clientsByRegion.mapComponent)
            setTimeout(() => this.clientsByRegion.mapComponent.vectorMapComponent.instance.render());
    }

    private refreshTotalsBySource() {
        if (this.totalsBySource && this.totalsBySource.chartComponent)
            setTimeout(() => this.totalsBySource.chartComponent.instance.refresh());
    }

    invalidate() {
        this.lifeCycleSubject.activate$.pipe(first()).subscribe(() => {
            this.refresh(false);
        });
    }

    deactivate() {
        this.ui.overflowHidden();        
        this.appService.toolbarIsHidden.next(false);
        this.lifeCycleSubject.deactivate.next();
        this.filtersService.unsubscribe();
        this.dialog.closeAll();
    }
}