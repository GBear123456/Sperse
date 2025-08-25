/** Core imports */
import {
  ChangeDetectionStrategy,
  Component,
  AfterViewInit,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { RouteReuseStrategy, ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { CacheService } from 'ng2-cache-service';
import { Observable, Subject, ReplaySubject, combineLatest } from 'rxjs';
import { filter, first, takeUntil, map, delay, tap } from 'rxjs/operators';

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
import { CurrencyCRMService } from 'store/currencies-crm-store/currency.service';
import { SettingsHelper } from '../../../shared/common/settings/settings.helper';
import { KpiCardData } from './kpi-card';
import { CurrencyDialogComponent, CurrencyDialogData } from './currency-dialog/currency-dialog.component';

// Chart data interfaces

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
    showWelcomeSection$: Observable<boolean> = this.showWelcomeSection.asObservable().pipe(
        tap((showWelcomeSection: boolean) => !this.appService.isHostTenant && showWelcomeSection 
            ? this.router.navigate(['app/crm/' + this.layoutService.getWelcomePageUri()], {skipLocationChange: true}) : undefined
        )
    );
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
        list: this.accessilbeContactGroups,
      }),
    },
  });
  filterModelOrgUnit: FilterModel = new FilterModel({
    component: FilterCheckBoxesComponent,
    caption: 'SourceOrganizationUnitId',
    hidden: this.appSessionService.hideUserSourceFilters,
    field: 'SourceOrganizationUnitId',
    items: {
      element: new FilterCheckBoxesModel({
        dataSource$: this.appStore$.pipe(
          select(OrganizationUnitsStoreSelectors.getOrganizationUnits)
        ),
        nameField: 'displayName',
        keyExpr: 'id',
      }),
    },
  });
  filterModelSource: FilterModel = new FilterModel({
    component: FilterSourceComponent,
    caption: 'Source',
    hidden: this.appSessionService.hideUserSourceFilters,
    items: {
      element: new SourceContactFilterModel({
        ls: this.ls,
      }),
    },
  });
  filterCurrency = this.currencyService.getCurrencyFilter(
    SettingsHelper.getCurrency(),
    false,
    true
  );

  private filters: FilterModel[] = this.getFilters();

  menuSide: 'left' | 'right' = 'left';

  // KPI Cards Data
  grossEarnings = 148491.48;
  totalCustomers = 11844;
  activeSubscriptions = 850;
  pendingCancels = 240;
  selectedCurrency: any = null;
  availableCurrencies: any[] = [];
  currencySearchTerm = '';
  filteredCurrencies: any[] = [];

  // KPI Cards Configuration
  kpiCards: KpiCardData[] = [
    {
      title: 'GROSS EARNINGS',
      value: this.grossEarnings,
      icon: 'fa fa-dollar',
      cardType: 'gross-earnings',
      showCurrencySelector: true,
      currencyText: 'USD - US Dollar',
      statusBadge: 'Active',
      selectedCurrency: this.selectedCurrency,
      availableCurrencies: this.availableCurrencies,
      convertedValue: this.grossEarnings
    },
    {
      title: 'CUSTOMERS',
      value: this.totalCustomers,
      icon: 'fa fa-users',
      cardType: 'customers'
    },
    {
      title: 'ACTIVE SUBSCRIPTIONS',
      value: this.activeSubscriptions,
      icon: 'fa fa-desktop',
      cardType: 'subscriptions'
    },
    {
      title: 'PENDING CANCELS',
      value: this.pendingCancels,
      icon: 'fa fa-bolt',
      cardType: 'cancels'
    }
  ];

  // Date range for charts
  chartStartDate = new Date('2025-07-22');
  chartEndDate = new Date('2025-08-21');
  chartComparisonStartDate = new Date('2025-06-21');
  chartComparisonEndDate = new Date('2025-07-21');

 

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
        private currencyService: CurrencyCRMService,
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
      this.loadStatus(true);
    }

    // Load currencies
    this.loadCurrencies();

    const introAcceptedCache = this.cacheService.get(this.introAcceptedCacheKey);
    /** Show crm wizard if there is no cache for it */
    if (!introAcceptedCache || introAcceptedCache === 'false') {
      this.cacheService.set(this.introAcceptedCacheKey, 'false');
      this.openDialog();
    }
  }

  /**
   * Loads available currencies from the currency service
   * Sets the default currency and updates the KPI cards
   */
  private loadCurrencies(): void {
    this.currencyService.currencies$.subscribe(currencies => {
      if (currencies && currencies.length > 0) {
        console.log('Currencies loaded:', currencies);
        this.availableCurrencies = currencies;
        this.filteredCurrencies = [...currencies]; // Initialize filtered currencies
        // Set default currency (USD if available, otherwise first currency)
        const defaultCurrency = currencies.find(c => c.id === 'USD') || currencies[0];
        this.selectedCurrency = defaultCurrency;
        console.log('Default currency set to:', this.selectedCurrency);
        this.updateGrossEarningsForCurrency();
        this.updateKpiCards();
      } else {
        console.warn('No currencies available');
        // Set fallback values
        this.availableCurrencies = [];
        this.filteredCurrencies = [];
        this.selectedCurrency = null;
        this.updateKpiCards();
      }
    }, error => {
      console.error('Error loading currencies:', error);
      // Set fallback values on error
      this.availableCurrencies = [];
      this.filteredCurrencies = [];
      this.selectedCurrency = null;
      this.updateKpiCards();
    });
  }

  /**
   * Filters currencies based on search term
   */
  filterCurrencies(): void {
    if (!this.currencySearchTerm.trim()) {
      this.filteredCurrencies = [...this.availableCurrencies];
    } else {
      const searchTerm = this.currencySearchTerm.toLowerCase();
      this.filteredCurrencies = this.availableCurrencies.filter(currency => 
        currency.id.toLowerCase().includes(searchTerm) ||
        currency.name.toLowerCase().includes(searchTerm) ||
        currency.symbol.toLowerCase().includes(searchTerm)
      );
    }
  }

  /**
   * TrackBy function for currency list performance
   */
  trackByCurrency(index: number, currency: any): string {
    return currency.id;
  }

  /**
   * Handles currency change events from the KPI card component
   * @param event - Currency change event containing current and available currencies
   */
  onCurrencyChange(event: any): void {
    console.log('Currency change event:', event);
    if (event && event.availableCurrencies) {
      // Open currency selection dialog
      this.openCurrencyDialog();
    }
  }

  /**
   * Opens the currency selection dialog
   */
  openCurrencyDialog(): void {
    const dialogConfig = {
      width: '400px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      padding: '0px',
      data: {
        currencies: this.availableCurrencies,
        selectedCurrency: this.selectedCurrency
      } as CurrencyDialogData,
      disableClose: false,
      autoFocus: true
    };

    const dialogRef = this.dialog.open(CurrencyDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((selectedCurrency: any) => {
      if (selectedCurrency) {
        this.selectCurrency(selectedCurrency);
      }
    });
  }

  /**
   * Selects a specific currency from the dialog
   * @param currency - The currency to select
   */
  selectCurrency(currency: any): void {
    if (currency && currency.id !== this.selectedCurrency?.id) {
      const previousCurrency = this.selectedCurrency;
      this.selectedCurrency = currency;
      
      // Update the gross earnings value based on currency
      this.updateGrossEarningsForCurrency();
      this.updateKpiCards();
      
      // Show notification
      this.showCurrencyChangeNotification(previousCurrency, currency);
      
      // Trigger currency changed animation
      this.setCurrencyChangedState(true);
    }
  }

  /**
   * Shows a notification when currency changes
   * @param previousCurrency - The previously selected currency
   * @param newCurrency - The newly selected currency
   */
  private showCurrencyChangeNotification(previousCurrency: any, newCurrency: any): void {
    if (previousCurrency && newCurrency) {
      console.log(`Currency changed from ${previousCurrency.id} to ${newCurrency.id}`);
      // In a real implementation, you might want to show a toast notification here
      // For now, we'll just log to console
    }
  }

  /**
   * Sets the loading state for the gross earnings KPI card
   * @param isLoading - Whether the card is in loading state
   */
  private setLoadingState(isLoading: boolean): void {
    this.kpiCards = this.kpiCards.map(card => {
      if (card.cardType === 'gross-earnings') {
        return {
          ...card,
          isLoading: isLoading
        };
      }
      return card;
    });
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Sets the currency changed state to trigger animation
   * @param changed - Whether the currency has changed
   */
  private setCurrencyChangedState(changed: boolean): void {
    this.kpiCards = this.kpiCards.map(card => {
      if (card.cardType === 'gross-earnings') {
        return {
          ...card,
          currencyChanged: changed
        };
      }
      return card;
    });
    
    if (changed) {
      // Remove the changed state after animation completes
      setTimeout(() => {
        this.setCurrencyChangedState(false);
      }, 600);
    }
    
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Updates the gross earnings value based on the selected currency
   * Uses conversion rates to calculate the equivalent value
   */
  private updateGrossEarningsForCurrency(): void {
    // This is a simplified currency conversion
    // In a real implementation, you would call an API to get the actual converted amount
    const conversionRates: { [key: string]: number } = {
      'USD': 1.0,
      'EUR': 0.85,
      'GBP': 0.73,
      'JPY': 110.0,
      'CAD': 1.25,
      'AUD': 1.35,
      'CHF': 0.92,
      'CNY': 6.45,
      'INR': 74.5,
      'BRL': 5.2,
      'MXN': 20.0,
      'KRW': 1100.0,
      'SGD': 1.35,
      'HKD': 7.8,
      'SEK': 8.5,
      'NOK': 8.8,
      'DKK': 6.3,
      'PLN': 3.8,
      'CZK': 21.5,
      'HUF': 300.0
    };

    if (this.selectedCurrency && conversionRates[this.selectedCurrency.id]) {
      const rate = conversionRates[this.selectedCurrency.id];
      this.grossEarnings = Math.round(148491.48 * rate * 100) / 100; // Round to 2 decimal places
    } else {
      // If currency not found, keep the original value
      this.grossEarnings = 148491.48;
    }
  }

  /**
   * Updates the KPI cards with new currency and value data
   */
  private updateKpiCards(): void {
    // Update the gross earnings card with new currency
    this.kpiCards = this.kpiCards.map(card => {
      if (card.cardType === 'gross-earnings') {
        return {
          ...card,
          selectedCurrency: this.selectedCurrency,
          availableCurrencies: this.availableCurrencies,
          convertedValue: this.grossEarnings
        };
      }
      return card;
    });
    
    // Trigger change detection
    this.changeDetectorRef.markForCheck();
  }

  ngAfterViewInit(): void {
    if (this.hasAccessibleCG) {
      combineLatest(
        this.dashboardWidgetsService.period$,
        this.dashboardWidgetsService.contactId$,
        this.dashboardWidgetsService.totalsData$,
        this.dashboardWidgetsService.contactGroupId$,
        this.dashboardWidgetsService.sourceOrgUnitIds$,
        this.dashboardWidgetsService.currencyId$,
        this.dashboardWidgetsService.refresh$
      )
        .pipe(delay(300), first())
        .subscribe(() => {
          this.clientsByRegionLoad.next();
        });
    }

    this.activate();
  }

    private getFilters() {
        return [
            this.filterModelContactGroup,
            this.filterModelOrgUnit,
            this.filterModelSource,
            this.filterCurrency
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
                else if (filter.caption == 'Currency')
                    this.dashboardWidgetsService.setCurrencyIdForTotals(this.currencyService.getSelectedCurrencies(filter)[0]);
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

    private loadStatus(initialLoad: boolean = false) {
        if (this.filterModelContactGroup.items.element.value) {
            this.dashboardServiceProxy.getStatus(
                this.filterModelContactGroup.items.element.value.toString(), undefined
            ).subscribe((status: GetCRMStatusOutput) => {
                this.showWelcomeSection.next(initialLoad ? !status.hasData : false);
                this.showLoadingSpinner = false;
                this.changeDetectorRef.detectChanges();
            });
        }
    }

    openDialog() {        
        if (this.appService.isHostTenant || !this.appService.hasModuleSubscription(
            this.appService.defaultSubscriptionModule.toLowerCase())
        ) return;

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