/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { FeatureCheckerService, PermissionCheckerService } from 'abp-ng2-module';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppPermissions } from '@root/shared/AppPermissions';
import { AppFeatures } from '@root/shared/AppFeatures';
import { ExternalLoginSettingsDto, LayoutType, TenantSettingsServiceProxy } from '@root/shared/service-proxies/service-proxies';
import { AppSessionService } from '@root/shared/common/session/app-session.service';
import { AppPermissionService } from '@root/shared/common/auth/permission.service';
import { mainNavigation, MenuItem } from './settings.navigation';

@Injectable()
export class SettingService {
    public isDarkMode: boolean = false;
    public hasSubmenu: boolean = false;

    public supportedPaymentProviders = [
        {
            id: 'paypal',
            iconUrl: 'assets/settings/Icons/Paypal.svg',
        },
        {
            id: 'stripe',
            iconUrl: 'assets/settings/Icons/Stripe.svg',
        },
        {
            id: 'authorize',
            iconUrl: 'assets/settings/Icons/Authorize.Net.svg',
        },
        {
            id: 'razorpay',
            iconUrl: 'assets/settings/Icons/RazorPay.svg',
        },
        {
            id: 'paystack',
            iconUrl: 'assets/settings/Icons/PayStack.svg',
        },
        {
            id: 'adyen',
            iconUrl: 'assets/settings/Icons/Adyen.svg',
        },
        {
            id: 'mollie',
            iconUrl: 'assets/settings/Icons/Mollie.svg',
        },
        {
            id: 'coinbase',
            iconUrl: 'assets/settings/Icons/Coinbase.svg',
        },
        {
            id: 'zelle',
            iconUrl: 'assets/settings/Icons/Zelle.svg',
        },
        {
            id: 'ach',
            iconUrl: 'assets/settings/Icons/ACH Bank Transfer.svg',
        },
        {
            id: 'wire',
            iconUrl: 'assets/settings/Icons/Wire Transfer Instructions.svg',
        },
        {
            id: 'other',
            iconUrl: 'assets/settings/Icons/Other 100+ Providers.svg',
        },
    ];

    isPaymentsEnabled: boolean = abp.features.isEnabled(AppFeatures.CRMPayments);
    isInboundOutboundSMSEnabled: boolean = abp.features.isEnabled(AppFeatures.InboundOutboundSMS);
    isAdminCustomizations: boolean = abp.features.isEnabled(AppFeatures.AdminCustomizations);
    isPFMApplicationsFeatureEnabled: boolean = abp.features.isEnabled(AppFeatures.PFM) && abp.features.isEnabled(AppFeatures.PFMApplications);
    isRapidTenantLayout: boolean = this.appSession.tenant && this.appSession.tenant.customLayoutType == LayoutType.Rapid;
    isSalesTalkEnabled: boolean = abp.features.isEnabled(AppFeatures.CRMSalesTalk) && this.permission.isGranted(AppPermissions.CRMSettingsConfigure);

    hasHostPermission = this.permission.isGranted(AppPermissions.AdministrationHostSettings);
    hasTenantPermission = this.permission.isGranted(AppPermissions.AdministrationTenantSettings);
    isTenantHosts: boolean = this.permission.isGranted(AppPermissions.AdministrationTenantHosts);

    hasHostTenantOrCRMSettings = this.hasHostPermission || this.hasTenantPermission || this.permissionCheckerService.isGranted(AppPermissions.CRMSettingsConfigure);

    externalLoginSettings: ExternalLoginSettingsDto;
    settingsConfig: { key: string, visible: boolean }[] = [];
    
    navs: MenuItem[] = mainNavigation;

    constructor(
        private appService: AppService,
        private appSession: AppSessionService,
        private permission: AppPermissionService,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private featureCheckerService: FeatureCheckerService,
        private permissionCheckerService: PermissionCheckerService,
    ) {
        this.initMenu();
    }

    initMenu() {
        return this.tenantSettingsService.getEnabledSocialLoginSettings()
            .subscribe(res => {
                this.externalLoginSettings = res;
                
                this.settingsConfig = [
                  { key: 'appearance', visible: this.isAdminCustomizations },
                  { key: 'domains', visible: this.isAdminCustomizations && this.isTenantHosts },
                  { key: 'paypal', visible: this.isPaymentsEnabled },
                  { key: 'stripe', visible: this.isPaymentsEnabled },
                  { key: 'sendgrid', visible: !this.appService.isHostTenant },
                  { key: 'klaviyo', visible: !this.appService.isHostTenant },
                  { key: 'ytel', visible: this.isInboundOutboundSMSEnabled },
                  { key: 'iage', visible: !this.appService.isHostTenant && this.isPFMApplicationsFeatureEnabled },
                  { key: 'ongage', visible: !this.appService.isHostTenant && this.isPFMApplicationsFeatureEnabled },
                  { key: 'tenant', visible: this.appService.isHostTenant && this.hasHostPermission },
                  { key: 'insights', visible: this.appService.isHostTenant },
                  { key: 'linkedin', visible: this.isSocialLoginEnabled('LinkedIn') },
                  { key: 'facebook', visible: this.isSocialLoginEnabled('Facebook') },
                  { key: 'google', visible: this.isSocialLoginEnabled('Google') },
                  { key: 'discord', visible: this.isSocialLoginEnabled('Discord') },
                  { key: 'landing', visible: !this.appService.isHostTenant && this.featureCheckerService.isEnabled(AppFeatures.CRMTenantLandingPage) && this.permissionCheckerService.isGranted(AppPermissions.AdministrationUsers) },
                  { key: 'invoice', visible: this.featureCheckerService.isEnabled(AppFeatures.CRMInvoicesManagement) && this.hasHostTenantOrCRMSettings },
                  { key: 'affiliate', visible: this.featureCheckerService.isEnabled(AppFeatures.CRMCommissions) &&
                    (this.permissionCheckerService.isGranted(AppPermissions.CRMAffiliatesCommissionsManage) || this.hasHostPermission || this.hasTenantPermission) },
                  { key: 'subscription', visible: this.featureCheckerService.isEnabled(AppFeatures.CRMSubscriptionManagementSystem) && (this.hasHostPermission || this.hasTenantPermission) },
                  { key: 'credits', visible: this.featureCheckerService.isEnabled(AppFeatures.CRMContactCredits) &&
                    (this.permissionCheckerService.isGranted(AppPermissions.CRMContactCreditsManage) || this.hasHostPermission || this.hasTenantPermission) },
                  { key: 'ach', visible: this.hasHostTenantOrCRMSettings },
                  { key: 'zapier', visible: this.permissionCheckerService.isGranted(AppPermissions.CRM) },
                  { key: 'files', visible: this.permissionCheckerService.isGranted(AppPermissions.CRMFileStorageTemplates) },
                  { key: 'MemberPortal', visible: !this.appService.isHostTenant && this.isAdminCustomizations },
                  // { key: 'IDCS Link', visible: this.isCreditReportFeatureEnabled },
                  { key: 'EPCVIPLink', visible: !this.appService.isHostTenant && this.isPFMApplicationsFeatureEnabled },
                  { key: 'EPCVIPEmail', visible: !this.appService.isHostTenant && this.isPFMApplicationsFeatureEnabled },
                  { key: 'Rapid', visible: this.isRapidTenantLayout },
                  { key: 'Sales Talk', visible: !this.appService.isHostTenant && this.isSalesTalkEnabled },
                ];
          
                for (const [i, nav] of this.navs.entries()) {
                  let config = this.settingsConfig.find(v => v.key === nav.id);
                  if (config && !config.visible) this.navs.splice(i, 1);
          
                  if (nav.submenu) {
                    for (const [k, sub] of nav.submenu.entries()) {
                      config = this.settingsConfig.find(v => v.key === sub.id);
                      if (config && !config.visible) nav.submenu.splice(k, 1);
            
                      if (sub.submenu) {
                        for (const [j, subsub] of sub.submenu.entries()) {
                          config = this.settingsConfig.find(v => v.key === subsub.id);
                          if (config && !config.visible) sub.submenu.splice(j, 1);
                        }
                      }
                    }
                  }
                }
            });
    }
    
    isSocialLoginEnabled(name: string): boolean {
        return this.externalLoginSettings && this.externalLoginSettings.enabledSocialLoginSettings.indexOf(name) !== -1;
    }

    getFullPath = (path: string) => '/app/admin/settings/' + path;

    toggleTheme = () => {
        this.isDarkMode = !this.isDarkMode;
    }

    alterSubmenu = (v: boolean) => {
        this.hasSubmenu = v;
    }

    get configuredNavs() {
        return this.navs;
    }
}