/** Core imports */
import { Component, HostBinding, ViewChild, Inject, ChangeDetectorRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

/** Third party imports */
import { DataSource } from 'devextreme/data/data_source/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDropDownBoxComponent } from 'devextreme-angular/ui/drop-down-box';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FeatureCheckerService } from 'abp-ng2-module';
import { PermissionCheckerService } from 'abp-ng2-module';
import { TitleService } from '@shared/common/title/title.service';
import { AppConsts } from '@shared/AppConsts';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { Module } from '@shared/common/module.interface';
import { AppSessionService } from '@root/shared/common/session/app-session.service';
import { UpdateUserAffiliateCodeDto, MemberSettingsServiceProxy, LayoutType } from '@root/shared/service-proxies/service-proxies';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { SettingsHelper } from '@shared/common/settings/settings.helper';
import { ODataService } from '@shared/common/odata/odata.service';
import { ClipboardService } from 'ngx-clipboard';
import { environment } from '@root/environments/environment';

interface ModuleConfig extends Module {
    code: string;
}

@Component({
    templateUrl: './platform-select.component.html',
    styleUrls: ['./platform-select.component.less'],
    providers: [MemberSettingsServiceProxy],
    selector: 'platform-select'
})
export class PlatformSelectComponent {
    @ViewChild(DxDropDownBoxComponent) dropDownBox: DxDropDownBoxComponent;

    @HostBinding('class') public cssClass = '';
    private dropDown: any;
    module = '';
    displayName = '';
    uri = '';
    modules = {
        topItems: [],
        footerItems: [],
        items: [],
    };
    activeModuleCount = 0;
    permissions = AppPermissions;
    width: string = AppConsts.isMobile ? '100vw' : '760px';
    affiliateRefId = this.appSessionService.user &&
        this.appSessionService.user.affiliateCode;
    isProductEnabled = this.permission.isGranted(AppPermissions.CRMProducts);
    get isCFOPortalEnabled() {
        return !this.appService.isHostTenant
            && this.appService.isModuleActive('CFO')
            && this.feature.isEnabled(AppFeatures.CFOPartner)
            && this.permission.isGranted(AppPermissions.CFOMemberAccess);
    }

    accessCodeValidationRules = [
        {
            type: 'pattern',
            pattern: AppConsts.regexPatterns.affiliateCode,
            message: this.ls.l('AccessCodeIsNotValid')
        },
        {
            type: 'stringLength',
            max: AppConsts.maxAffiliateCodeLength,
            message: this.ls.l('MaxLengthIs', AppConsts.maxAffiliateCodeLength)
        }
    ];

    cfoPortalUrl = location.origin + '/app/cfo-portal';
    enabledPortal = this.feature.isEnabled(AppFeatures.Portal);
    enabledAdminCustomizations = this.feature.isEnabled(AppFeatures.AdminCustomizations);
    appMemberPortalUrl = this.formatUrl(
        (this.enabledAdminCustomizations && AppConsts.appMemberPortalUrl)
        || (this.enabledPortal && environment.portalUrl)
    );
    landingPageDomains = this.appSessionService.tenant &&
        this.appSessionService.tenant.landingPageDomains
            .sort((a, b) => a.includes('vercel.app') > b.includes('vercel.app') ? 1 : -1)
            .map(domain => this.getAffiliateLink('https://' + domain));
    selectedlandingPage = this.landingPageDomains
        && this.landingPageDomains[0];

    moduleItems: string[];
    currency: string = SettingsHelper.getCurrency();
    enabledAffiliate = this.feature.isEnabled(AppFeatures.CRMCommissions);
    productLinks: string[] = [];
    productUrl: string;
    searchProduct: string;

    productDataSource = new DataSource({
        store: new ODataStore({
            key: 'Id',
            deserializeDates: false,
            url: this.oDataService.getODataUrl('Product'),
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.params.$filter = '(IsPublished eq true) and (PublishDate le ' + (new Date()).toISOString() + ')' +
                    ' and (PublicName ne null)' + (this.searchProduct ? " and startswith(Name,'" + this.searchProduct + "')" : '');
                request.params.$select = 'Id,ThumbnailUrl,PublicName,Price,Name,Type';
                request.params.$top = 100;
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
            },
            onLoaded: (data) => {
                this.productLinks = data.map(product => this.getProductPublicLink(product.PublicName));
                if (!this.productUrl)
                    this.productUrl = this.productLinks[0];
                this.changeDetector.markForCheck();
            },
            errorHandler: (error) => {
                this.productLinks = [];
            }
        })
    });

    constructor(
        public appService: AppService,
        private authService: AppAuthService,
        private impersonationService: ImpersonationService,
        private userManagementService: UserManagementService,
        private feature: FeatureCheckerService,
        private permission: PermissionCheckerService,
        private router: Router,
        private titleService: TitleService,
        private oDataService: ODataService,
        private appSessionService: AppSessionService,
        private memberSettingsProxy: MemberSettingsServiceProxy,
        private changeDetector: ChangeDetectorRef,
        public clipboardService: ClipboardService,
        public layoutService: LayoutService,
        public ls: AppLocalizationService,
        @Inject(DOCUMENT) private document: any
    ) {
        let modules = appService.getModules();
        modules.forEach((module: Module) => {
            if (appService.isModuleActive(module.name) && !module.isMemberPortal) this.activeModuleCount++;
            let config = appService.getModuleConfig(module.name);
            if (module.showInDropdown) {
                let moduleConfig: ModuleConfig = {
                    code: config ? config.code : module.name,
                    name: module.name,
                    showDescription: module.showDescription,
                    showInDropdown: module.showInDropdown,
                    focusItem: module.focusItem,
                    footerItem: module.footerItem,
                    isComingSoon: module.isComingSoon,
                    uri: module.uri
                };

                if (module.focusItem) {
                    this.modules.topItems.push(moduleConfig);
                } else if (module.footerItem) {
                    if (module.name !== 'CFO' && module.name !== 'PFM' && !this.isDisabled(module.name)) {
                        this.modules.footerItems.push(moduleConfig);
                    } else if (module.name === 'CFO'
                        && !AppConsts.appMemberPortalUrl
                        && !appService.isHostTenant
                        && this.appService.isModuleActive(module.name)
                        && this.feature.isEnabled(AppFeatures.CFOPartner)
                        && this.permission.isGranted(AppPermissions.CFOMemberAccess)
                    ) {
                        this.modules.footerItems.push(moduleConfig);
                    } else if (
                        module.name === 'PFM'
                        && !AppConsts.appMemberPortalUrl
                        && this.appService.isModuleActive(module.name)
                        && (this.feature.isEnabled(AppFeatures.PFMApplications) || this.feature.isEnabled(AppFeatures.PFMCreditReport))
                    ) {
                        this.modules.footerItems = this.modules.footerItems.filter((item) => item.name !== 'CFO');
                        this.modules.footerItems.push(moduleConfig);
                    } else if (
                        AppConsts.appMemberPortalUrl
                        && !appService.isHostTenant
                        && module.name === 'MemberPortal'
                    ) {
                        this.modules.footerItems.push(module);
                    }
                } else if (module.showInDropdown) {
                    this.modules.items.push(moduleConfig);
                }
            }
        });
        this.moduleItems = modules.map(item => item.name);
        appService.subscribeModuleChange((config: ConfigInterface) => {
            this.module = config.name;
            this.displayName = config.displayName || config.name;
            this.uri = appService.params.instance;
            this.cssClass = this.module.toLowerCase();
            this.titleService.setTitle(config.name);
        });
    }

    formatUrl(url: string) {
        return (url && url[url.length - 1] == '/' ? url.slice(0, -1) : url);
    }

    onItemClick(module) {
        if ((this.module !== module.name || this.uri !== module.uri || module.footerItem) &&
            (this.appService.isModuleActive(module.name) || module.name === 'BankCode' || module.name === 'Slice')
        ) {
            let navigate = null;
            if (module.name === 'Slice' && this.permission.isGranted(AppPermissions.CRMCustomers)) {
                const lastSegment = this.router.url.substring(this.router.url.lastIndexOf('/') + 1);
                const availableSliceLinks: string[] = ['leads', 'clients', 'partners'];
                const group = availableSliceLinks.indexOf(lastSegment) > 0 ? lastSegment : 'leads';
                navigate = this.router.navigate(
                    ['/app/slice/' + group],
                    { queryParams: { dataLayoutType: DataLayoutType.PivotGrid } }
                );
            } else if (module.name === 'PFM' && module.footerItem) {
                return window.open(location.origin + '/personal-finance', '_blank');
            } else if (module.name === 'CFO' && module.footerItem && this.permission.isGranted(AppPermissions.CFOMemberAccess)) {
                return window.open(location.origin + '/app/cfo-portal', '_blank');
            } else if (module.name === 'BankCode' && this.userManagementService.checkBankCodeFeature()) {
                if (AppConsts.appMemberPortalUrl) {
                    if (this.authService.checkCurrentTopDomainByUri())
                        this.authService.setTokenBeforeRedirect();
                    else {
                        return this.impersonationService.impersonate(
                            abp.session.userId, abp.session.tenantId, AppConsts.appMemberPortalUrl
                        );
                    }
                }
                return window.open(AppConsts.appMemberPortalUrl || (location.origin + '/code-breaker/home'), '_blank');
            } else {
                navigate = this.router.navigate(['app/' + module.name.toLowerCase() + (module.uri ? '/' + module.uri.toLowerCase() : '')]);
            }
            this.dropDown.option('disabled', true);
            navigate && navigate.then((result) => {
                if (result) {
                    this.module = module.name;
                    this.displayName = module.displayName || module.name;
                    this.uri = module.uri;
                    this.appService.switchModule(this.module, { instance: this.uri });
                }
                this.dropDown.option('disabled', false);
            });
            this.dropDown.close();
        }

        if (module.name === 'MemberPortal') {
            if (AppConsts.appMemberPortalUrl) {
                if (this.authService.checkCurrentTopDomainByUri())
                    this.authService.setTokenBeforeRedirect();
                else {
                    return this.impersonationService.impersonate(
                        abp.session.userId, abp.session.tenantId, AppConsts.appMemberPortalUrl
                    );
                }
            }
            return window.open(AppConsts.appMemberPortalUrl, '_blank');
        }
    }

    isDisabled(item: string): boolean {
        return item !== 'Slice' && !this.appService.isModuleActive(item);
    }

    onDropDownInit(event) {
        this.dropDown = event.component;
        if (AppConsts.isMobile) {
            this.dropDown.option({
                'dropDownOptions.position': {
                    boundary: this.document.body,
                    my: 'top',
                    at: 'bottom',
                    of: this.document.querySelector('app-header')
                }
            });
        }
    }

    onDropDownOpen() {
        if (this.isProductEnabled && (!this.productLinks || !this.productLinks.length))
            this.productDataSource.load();
    }

    copyToClipboard(value: string) {
        if (value) {
            this.clipboardService.copyFromContent(this.getAffiliateLink(value));
            abp.notify.info(this.ls.l('SavedToClipboard'));
        }
    }

    openLink(link: string) {
        if (link)
            window.open(this.getAffiliateLink(link));
    }

    affiliateCodeChanged(affiliateCode: string) {
        this.memberSettingsProxy.updateAffiliateCode(
            new UpdateUserAffiliateCodeDto({ affiliateCode: affiliateCode })
        ).subscribe(() => {
            this.affiliateRefId = affiliateCode;
            if (this.productLinks) {
                this.productLinks = this.productDataSource.items().map(product =>
                    this.getProductPublicLink(product.PublicName)
                );
                this.productUrl = this.productLinks[0];
            }

            if (this.landingPageDomains) {
                this.landingPageDomains = this.landingPageDomains.map(
                    item => this.getAffiliateLink(item.split('?')[0]));
                this.selectedlandingPage = this.landingPageDomains[0];
            }

            this.changeDetector.markForCheck();
        });
    }

    getProductPublicLink(publicName: string) {
        if (publicName)
            return this.getAffiliateLink(location.origin + '/p/' + (abp.session.tenantId || 0) + '/' + publicName);
    }

    selectProduct(dialog, publicName) {
        this.productUrl = this.getProductPublicLink(publicName);
        dialog.instance.close();
    }

    onProductSearch() {
        this.productDataSource.load();
    }

    getAffiliateLink(url: string) {
        return (this.affiliateRefId && url && url.indexOf('ref=') == -1 ? url + '?ref=' + this.affiliateRefId : url);
    }
}