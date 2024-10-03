/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,    
    ViewChild,
    OnInit,
    ChangeDetectorRef
} from '@angular/core';
import { RouteReuseStrategy, ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import ODataStore from 'devextreme/data/odata/store';
import { DataSource } from 'devextreme/data/data_source/data_source';
import { NgxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { CacheService } from 'ng2-cache-service';
import { Observable, Subject, ReplaySubject, combineLatest, of } from 'rxjs';
import { finalize, filter, first, takeUntil, map, delay } from 'rxjs/operators';
import { FeatureCheckerService, MessageService } from 'abp-ng2-module';
import { DxScrollViewComponent } from 'devextreme-angular/ui/scroll-view';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { AppStore } from '@app/store';
import { AppConsts } from '@shared/AppConsts';
import { AppService } from '@app/app.service';
import { ContactGroup } from '@shared/AppEnums';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ModuleType, LayoutType, StripeSettingsDto, TenantPaymentSettingsServiceProxy } from '@shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';
import { CrmIntroComponent } from '../shared/crm-intro/crm-intro.component';
import { ODataService } from '@shared/common/odata/odata.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { CreateInvoiceDialogComponent } from '@app/crm/shared/create-invoice-dialog/create-invoice-dialog.component';
import { NotificationSettingsModalComponent } from '@app/shared/layout/notifications/notification-settings-modal/notification-settings-modal.component';
import { CreateProductDialogComponent } from '@app/crm/contacts/subscriptions/add-subscription-dialog/create-product-dialog/create-product-dialog.component';
import { CreateEntityDialogData } from '@shared/common/create-entity-dialog/models/create-entity-dialog-data.interface';
import { TenantSettingsWizardComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-wizard.component';
import { CreateEntityDialogComponent } from '@shared/common/create-entity-dialog/create-entity-dialog.component';
import { PaymentWizardComponent } from '@app/shared/common/payment-wizard/payment-wizard.component';
import { AddCouponDialogComponent } from '../coupons/add-coupon-dialog/add-coupon-dialog.component';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';

@Component({
    templateUrl: './shortcuts.component.html',
    styleUrls: ['./shortcuts.component.less'],
    providers: [ LifecycleSubjectsService, TenantPaymentSettingsServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShortcutsComponent implements OnInit {
    @ViewChild('shortcutsScroll') scrollView: DxScrollViewComponent;
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    private introAcceptedCacheKey: string = this.cacheHelper.getCacheKey('CRMIntro', 'IntroAccepted');
    dialogConfig = new MatDialogConfig();
    isGrantedOrders = this.permission.isGranted(AppPermissions.CRMOrders);

    waitFor$ = of(true);    
    formatting = AppConsts.formatting;
    calendlyUri = AppConsts.calendlyUri;
    stripePaymentSettings: StripeSettingsDto = new StripeSettingsDto();
    hasTenantPermission = this.permission.isGranted(AppPermissions.AdministrationTenantSettings);
    hasTenantOrCRMSettings = this.hasTenantPermission || 
        this.permission.isGranted(AppPermissions.CRMSettingsConfigure);
    isPaymentsEnabled: boolean = abp.features.isEnabled(AppFeatures.CRMPayments) && this.hasTenantOrCRMSettings;
    showLandingPageSettings = !this.appService.isHostTenant && 
        this.feature.isEnabled(AppFeatures.CRMTenantLandingPage) && 
        this.permission.isGranted(AppPermissions.AdministrationUsers);
    showInvoiceSettings = this.hasTenantOrCRMSettings && 
        this.feature.isEnabled(AppFeatures.CRMInvoicesManagement);
    showInvoices = this.permission.isGranted(AppPermissions.CRMOrdersInvoices);
    manageInvoices = this.permission.isGranted(AppPermissions.CRMOrdersInvoicesManage);
    showImportLeads = this.permission.isGranted(AppPermissions.CRMBulkImport);
    showImportUsersStep = (this.appService.isHostTenant || this.feature.isEnabled(AppFeatures.Admin))
            && this.permission.isGranted(AppPermissions.AdministrationUsers)
            && this.permission.isGranted(AppPermissions.AdministrationUsersCreate)
            && this.permission.isGranted(AppPermissions.AdministrationRoles);
    showSubscriptionManagement = this.permission.isGranted(AppPermissions.AdministrationTenantSubscriptionManagement);
    showCommissions = this.feature.isEnabled(AppFeatures.CRMCommissions) &&
        this.permission.isGranted(AppPermissions.CRMAffiliatesCommissions); 
    showCommissionsSettings = this.feature.isEnabled(AppFeatures.CRMCommissions) &&
        (this.permission.isGranted(AppPermissions.CRMAffiliatesCommissionsManage) || this.hasTenantPermission);

    isGrantedCRMCustomers = this.permission.isGranted(AppPermissions.CRMCustomers);
    isGrantedCRMFileStorage = this.permission.isGranted(AppPermissions.CRMFileStorageTemplates);
    isGrantedCRMProductsManage = this.permission.isGranted(AppPermissions.CRMProductsManage);
    isGrantedCRMProducts = this.permission.isGranted(AppPermissions.CRMProducts);

    hasAnyCGPermission: boolean = !!this.permission.getFirstAvailableCG();    
    showZapier = location.href.includes(AppConsts.defaultDomain) &&
        this.permission.isGranted(AppPermissions.CRM);

    subscriptions: any[];
    localization = AppConsts.localization.CRMLocalizationSourceName;
    isZendeskEnabled = !this.appService.isHostTenant && abp.setting.values['Integrations:Zendesk:AccountUrl'];
    headlineBackground = abp.setting.get('App.Appearance.NavBackground');

    showBioPage = this.feature.isEnabled(AppFeatures.AdvancedProfiles);
    showMyBranding = this.feature.isEnabled(AppFeatures.AdminCustomizations);
    showNotification = this.feature.isEnabled(AppFeatures.Notification);

    productsDataSource = new DataSource({ 
        store: new ODataStore({
            key: 'Id',
            deserializeDates: false,
            url: this.oDataService.getODataUrl('Product', { 'LastSold': { 'ne': null } }),
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                this.loadingService.startLoading(this.dataGrid.instance.element());
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.params.$select = DataGridService.getSelectFields(
                    this.dataGrid, [
                        'Id', 'Code'
                    ]
                );
                request.params.$top = 10;
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
            },
            onLoaded: (records) => {
                this.loadingService.finishLoading(this.dataGrid.instance.element());
            },
            errorHandler: (error) => {
                this.loadingService.finishLoading(this.dataGrid.instance.element());
            }
        })
    });

    constructor(
        public router: Router,
        private appService: AppService,
        public appSessionService: AppSessionService,
        private changeDetectorRef: ChangeDetectorRef,
        private lifeCycleSubject: LifecycleSubjectsService,
        private activatedRoute: ActivatedRoute,
        public cacheHelper: CacheHelper,
        private cacheService: CacheService,
        public ui: AppUiCustomizationService,
        public permission: AppPermissionService,
        private feature: FeatureCheckerService,
        public ls: AppLocalizationService,
        private loadingService: LoadingService,
        private message: MessageService,
        private dashboardWidgetsService: DashboardWidgetsService,
        private tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy,
        private ngxZendeskWebwidgetService: NgxZendeskWebwidgetService,
        private oDataService: ODataService,
        public httpInterceptor: AppHttpInterceptor,
        public layoutService: LayoutService,
        public dialog: MatDialog
    ) {
        if (this.isZendeskEnabled)
            this.ngxZendeskWebwidgetService.initZendesk();
    }

    ngOnInit() {
        this.loadSettings();

        if (this.appService.moduleSubscriptions$)
            this.appService.moduleSubscriptions$.subscribe(
                () => this.updateSubscriptionInfo());
    }

    updateSubscriptionInfo() {
        this.subscriptions = this.appService.moduleSubscriptions.filter(sub => sub.statusId == 'A');
        this.changeDetectorRef.markForCheck()
    }

    openIntroDialog(showLastStep: boolean = false) {
        if (this.appService.isHostTenant)
            return;

        let tenant = this.appSessionService.tenant;
        if (!tenant || !tenant.customLayoutType || tenant.customLayoutType == LayoutType.Default) {
            this.dialogConfig.height = '650px';
            this.dialogConfig.width = '900px';
            this.dialogConfig.id = 'crm-intro';
            this.dialogConfig.panelClass = ['crm-intro', 'setup'];
            this.dialogConfig.data = { alreadyStarted: false, showLastStep: showLastStep };
            this.dialog.open(CrmIntroComponent, this.dialogConfig).afterClosed().subscribe(() => {
                /** Mark accepted cache with true when user closed intro and don't want to see it anymore) */
                this.cacheService.set(this.introAcceptedCacheKey, 'true');
            });
        }
    }

    openProfileTenantSettingsDialog(selectedTab: string) {
        this.dialog.open(TenantSettingsWizardComponent, {
            id: 'tenant-settings',
            panelClass: ['tenant-settings'],
            data: {tab: selectedTab}
        });
    }

    subscribeToRefreshParam() {
        this.activatedRoute.queryParams
            .pipe(
                takeUntil(this.lifeCycleSubject.deactivate$),
                filter(params => !!params['refresh'])
            )
            .subscribe(() => {
                //this.refresh() 
            });
    }

    invalidate() {
        this.lifeCycleSubject.activate$.pipe(first()).subscribe(() => {
            //this.refresh(false);
        });
    }

    openContactDialog() {
        const dialogData: CreateEntityDialogData = {
            customerType: ContactGroup.Client
        };
        this.dialog.open(CreateEntityDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: dialogData
        }).afterClosed().subscribe(() => {});
    }

    openProductDialog() {
        const dialogData = {
            fullHeigth: true,
            product: undefined,
            isReadOnly: !this.permission.isGranted(AppPermissions.CRMProductsManage)
        };
        this.dialog.open(CreateProductDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: dialogData
        }).afterClosed().subscribe(product => {
            if (product)
                this.router.navigate(['app/crm/products'])
        });        
    }

    openCouponDialog() {
        const dialogData = {
            fullHeigth: true,
            coupon: undefined,
            isReadOnly: false
        };
        this.dialog.open(AddCouponDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: dialogData
        }).afterClosed().subscribe(
            (refresh) => {
                if (refresh) this.router.navigate(['app/crm/coupons'])
            }
        );
    }

    openPaymentWizardDialog(showSubscriptions = false, data?) {
        this.dialog.closeAll();
        this.dialog.open(PaymentWizardComponent, {
            height: '800px',
            width: '1200px',
            id: 'payment-wizard',
            panelClass: ['payment-wizard', 'setup'],
            data: {
                ...data,
                showSubscriptions: showSubscriptions
            }
        });
    }

    loadSettings() {
        if (this.isPaymentsEnabled) {
            this.loadingService.startLoading();
            this.tenantPaymentSettingsService.getStripeSettings(false, false)
                .pipe(
                    finalize(() => this.loadingService.finishLoading())
                )
                .subscribe(res => {
                    this.stripePaymentSettings = res;                    
                })
        }
    }

    connectStripeAccount() {
        if (this.stripePaymentSettings.isConnectedAccountSetUpCompleted)
            return;

        this.message.confirm('', this.ls.l('Do you want to connect Stripe account ?'), (isConfirmed) => {
            if (isConfirmed) {
                this.loadingService.startLoading();
                let method = this.stripePaymentSettings.connectedAccountId ?
                    this.tenantPaymentSettingsService.connectStripeAccount() :
                    this.tenantPaymentSettingsService.getConnectOAuthAuthorizeUrl();
                method.pipe(
                    finalize(() => this.loadingService.finishLoading())
                ).subscribe((url) => {
                    window.location.href = url;
                });
            }
        });
    }

    openCalendly() {
        window.open('https://calendly.com/' + this.calendlyUri, '_blank');
    }

    openNotificationModal(e): void {
        this.dialog.open(NotificationSettingsModalComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    showInvoiceDialog() {
        this.dialog.open(CreateInvoiceDialogComponent, {
            panelClass: ['slider'],
            disableClose: true,
            closeOnNavigation: false,
            data: {
                addNew: true,
                invoice: null
            }
        });
    }

    refresh() {
        this.productsDataSource.reload();
        this.dashboardWidgetsService.refresh();
    }

    activate() {
        if (this.appService.isHostTenant)
            return this.router.navigate(['app/crm/dashboard']);

        this.lifeCycleSubject.activate.next();
        this.ui.overflowHidden(true);
        this.appService.isClientSearchDisabled = true;
        this.appService.toolbarIsHidden.next(true);
        if (this.isZendeskEnabled && this.ngxZendeskWebwidgetService.isInitialized)
            this.ngxZendeskWebwidgetService.zE('messenger', 'show');
        this.changeDetectorRef.markForCheck()
    }

    deactivate() {
        this.ui.overflowHidden();        
        this.appService.toolbarIsHidden.next(false);
        this.lifeCycleSubject.deactivate.next();
        if (this.isZendeskEnabled && this.ngxZendeskWebwidgetService.isInitialized)
            this.ngxZendeskWebwidgetService.zE('messenger', 'hide');
        this.dialog.closeAll();
    }
}