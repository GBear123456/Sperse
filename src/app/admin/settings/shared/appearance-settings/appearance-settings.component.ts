/** Core imports */
import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { forkJoin, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import kebabCase from 'lodash/kebabCase';

/** Application imports */
import {
    CustomCssType,
    LayoutType,
    NavPosition,
    TenantCustomizationServiceProxy,
    TenantLoginInfoDto,
    TenantSettingsServiceProxy,
    AppearanceSettingsEditDto,
    TenantCustomizationInfoDto,
    PortalAppearanceSettingsEditDto
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { UploaderComponent } from '@shared/common/uploader/uploader.component';
import { FaviconService } from '@shared/common/favicon-service/favicon.service';
import { FontService } from '@shared/common/font-service/font.service';
import { SettingService } from 'abp-ng2-module';
import { AppConsts } from '@shared/AppConsts';
import { DomHelper } from '@shared/helpers/DomHelper';
import { AppFeatures } from '@shared/AppFeatures';
import { PortalMenuItemConfig } from './portal/portal-menu-item';
import { PortalMenuItemEnum } from './portal/portal-menu-item.enum';

@Component({
    selector: 'appearance-settings',
    templateUrl: './appearance-settings.component.html',
    styleUrls: ['./appearance-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantCustomizationServiceProxy, TenantSettingsServiceProxy]
})
export class AppearanceSettingsComponent extends SettingsComponentBase {
    @ViewChild('logoUploader') logoUploader: UploaderComponent;
    @ViewChild('cssUploader') cssUploader: UploaderComponent;
    @ViewChild('loginCssUploader') loginCssUploader: UploaderComponent;
    @ViewChild('portalLogoUploader') portalLogoUploader: UploaderComponent;
    @ViewChild('portalFaviconsUploader') portalFaviconsUploader: UploaderComponent;
    @ViewChild('portalLoginCssUploader') portalLoginCssUploader: UploaderComponent;
    @ViewChild('portalCssUploader') portalCssUploader: UploaderComponent;
    @ViewChild('faviconsUploader') faviconsUploader: UploaderComponent;
    @ViewChild('signUpCssUploader') signUpCssUploader: UploaderComponent;

    hasPortalFeature = this.feature.isEnabled(AppFeatures.Portal);
    isPortalSelected = false;

    tenant: TenantLoginInfoDto = this.appSession.tenant;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    maxCssFileSize = 1024 * 1024 /* 1MB */;
    maxLogoFileSize = 1024 * 30 /* 30KB */;
    CustomCssType = CustomCssType;

    signUpPagesEnabled: boolean = this.settingService.getBoolean('App.UserManagement.IsSignUpPageEnabled');
    someCssChanged: boolean;
    someColorChanged: boolean;

    defaultLeftSideMenuColor: string = this.layoutService.defaultLeftSideMenuColor;
    defaultHeaderColor: string = this.layoutService.defaultHeaderBgColor;
    defaultTextColor: string = this.layoutService.defaultHeaderTextColor;
    defaultButtonColor: string = this.layoutService.defaultButtonColor;
    defaultButtonTextColor: string = this.layoutService.defaultButtonTextColor;
    defaultButtonHighlightedColor: string = this.layoutService.defaultButtonHighlightedColor;
    defaultFontName: string = this.layoutService.defaultFontName;
    defaultTabularFontName: string = this.layoutService.defaultTabularFontName;
    defaultBorderRadius: string = this.layoutService.defaultBorderRadius;

    appearance: AppearanceSettingsEditDto = new AppearanceSettingsEditDto();
    colorSettings: AppearanceSettingsEditDto | PortalAppearanceSettingsEditDto = new AppearanceSettingsEditDto();

    navPosition = this.getNavPosition();
    navPositionOptions = Object.keys(NavPosition).map(item => {
        return {
            id: NavPosition[item],
            text: this.l('NavPosition_' + item)
        };
    });
    fontFamilyList: string[] = this.fontService.getSupportedFontsList();
    tabularFontFamilyList: string[] = this.fontService.supportedTabularGoogleFonts;
    portalMenuItems: PortalMenuItemConfig[] = [];
    portalMenuFeatures = {
        [PortalMenuItemEnum.Dashboard]: AppFeatures.PortalDashboard,
        [PortalMenuItemEnum.ReferredLeads]: AppFeatures.PortalLeads,
        [PortalMenuItemEnum.MyInvoices]: AppFeatures.PortalInvoices,
        [PortalMenuItemEnum.MyReferralPortal]: AppFeatures.PortalReseller,
        [PortalMenuItemEnum.CRMLogin]: AppFeatures.CRM
    };

    constructor(
        _injector: Injector,
        private faviconsService: FaviconService,
        private settingsProxy: TenantSettingsServiceProxy,
        private tenantCustomizationService: TenantCustomizationServiceProxy,
        private fontService: FontService,
        private settingService: SettingService
    ) {
        super(_injector);

        this.settingsProxy.getAppearanceSettings().subscribe(
            (res: AppearanceSettingsEditDto) => {
                this.appearance = res;
                this.colorSettings = res;

                this.initDefaultValues();
                this.initPortalMenuItems();
                this.changeDetection.detectChanges();
            }
        );

        DomHelper.addStyleSheet('allfonts', 'https://fonts.googleapis.com/css?family='
            + this.fontService.supportedGoogleFonts.concat(this.fontService.supportedTabularGoogleFonts).join('|')
        );
        this.fontService.supportedCustomFonts.map(font =>
            DomHelper.addStyleSheet('custom-font', './assets/fonts/fonts-' + font.toLowerCase() + '.css')
        );
    }

    initDefaultValues() {
        this.applyOrClearAppearanceDefaults(this.appearance, false);
        if (this.hasPortalFeature) {
            this.applyOrClearAppearanceDefaults(this.appearance.portalSettings, false);
        }
    }

    initPortalMenuItems() {
        if (!this.hasPortalFeature)
            return;

        let portalConfig: PortalMenuItemConfig[] = [];
        let tenantConfigJson = this.appearance.portalSettings.menuCustomization;
        if (tenantConfigJson)
            portalConfig = JSON.parse(tenantConfigJson);

        Object.keys(PortalMenuItemEnum).forEach(menuItem => {
            let menuItemEnum = PortalMenuItemEnum[menuItem];
            let currentItemIndex = portalConfig.findIndex(v => v.code == menuItemEnum);
            let currentItemConfigured = currentItemIndex >= 0;

            let requiredFeature = this.portalMenuFeatures[menuItem];
            if (requiredFeature && !this.feature.isEnabled(requiredFeature)) {
                if (currentItemConfigured)
                    portalConfig.splice(currentItemIndex, 1);
                return;
            }

            if (currentItemConfigured)
                return;

            portalConfig.push({
                code: menuItemEnum,
                customTitle: null,
                hide: false
            });
        });

        this.portalMenuItems = portalConfig;
    }

    applyOrClearAppearanceDefaults(settings: AppearanceSettingsEditDto | PortalAppearanceSettingsEditDto, isClear: boolean) {
        const method = isClear ? this.clearDefault : this.setDefault;

        method(settings.navBackground, settings, 'navBackground', this.defaultHeaderColor);
        method(settings.navTextColor, settings, 'navTextColor', this.defaultTextColor);
        method(settings.buttonColor, settings, 'buttonColor', this.defaultButtonColor);
        method(settings.buttonTextColor, settings, 'buttonTextColor', this.defaultButtonTextColor);
        method(settings.buttonHighlightedColor, settings, 'buttonHighlightedColor', this.defaultButtonHighlightedColor);
        method(settings.leftsideMenuColor, settings, 'leftsideMenuColor', this.defaultLeftSideMenuColor);
        method(settings.fontName, settings, 'fontName', this.defaultFontName);
        method(settings.tabularFont, settings, 'tabularFont', this.defaultTabularFontName);
        method(settings.borderRadius, settings, 'borderRadius', this.defaultBorderRadius);
    }

    setDefault(property, target, key, defaultValue) {
        if (!property) {
            target[key] = defaultValue;
        }
    }

    clearDefault(property, target, key, defaultValue) {
        if (property == defaultValue) {
            target[key] = null;
        }
    }

    toggleColorSetting(isPortalSelected) {
        this.isPortalSelected = isPortalSelected;
        this.colorSettings = this.isPortalSelected ? this.appearance.portalSettings : this.appearance;
        this.changeDetection.detectChanges();
    }

    getSaveObs(): Observable<any> {
        this.applyOrClearAppearanceDefaults(this.appearance, true);
        if (this.hasPortalFeature) {
            this.applyOrClearAppearanceDefaults(this.appearance.portalSettings, true);
            this.appearance.portalSettings.menuCustomization = JSON.stringify(this.portalMenuItems);
        } else {
            this.appearance.portalSettings = null;
        }

        if (this.getNavPosition() != this.navPosition)
            this.appearance.navPosition = this.navPosition;

        return forkJoin(
            this.settingsProxy.updateAppearanceSettings(this.appearance),
            this.logoUploader.uploadFile().pipe(tap((res: any) => {
                if (res.result && res.result.id) {
                    this.tenant.logoId = res.result.id;
                    this.changeDetection.detectChanges();
                }
            })),
            this.cssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Platform, res))),
            this.loginCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Login, res))),
            this.hasPortalFeature ? this.portalLogoUploader.uploadFile().pipe(tap((res: any) => {
                if (res.result && res.result.id) {
                    this.tenant.portalLogoId = res.result.id;
                    this.changeDetection.detectChanges();
                }
            })) : of(false),
            this.hasPortalFeature ? this.portalFaviconsUploader.uploadFile().pipe(tap((res: any) => this.handleFaviconsUpload(true, res))) : of(false),
            this.hasPortalFeature ? this.portalLoginCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.PortalLogin, res))) : of(false),
            this.hasPortalFeature ? this.portalCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Portal, res))) : of(false),
            this.signUpPagesEnabled ?
                this.signUpCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.SignUp, res))) : of(false),
            this.faviconsUploader.uploadFile().pipe(tap((res) => this.handleFaviconsUpload(false, res)))
        );
    }

    afterSave() {
        if (this.someCssChanged || this.someColorChanged)
            this.message.info(this.l('ReloadPageStylesMessage')).then(() => window.location.reload());
        else if (this.getNavPosition() != this.navPosition) {
            this.message.info(this.l('SettingsChangedRefreshPageNotification', this.l('NavigationMenuPosition'))).done(function () {
                window.location.reload();
            });
        }
        else {
            this.initDefaultValues();
            this.changeDetection.detectChanges();
        }
    }

    handleCssUpload(cssType: CustomCssType, res: any) {
        if (res.result && res.result.id) {
            this.someCssChanged = cssType != CustomCssType.PortalLogin && cssType != CustomCssType.Portal;
            this.setCustomCssTenantProperty(cssType, res.result.id);
            this.changeDetection.detectChanges();
        }
    }

    handleFaviconsUpload(portalFavicons: boolean, res: any) {
        if (!res || !res.result)
            return;

        let result: TenantCustomizationInfoDto = res.result;
        let updateUI = (portalFavicons && result.portalFaviconBaseUrl && result.portalFavicons && result.portalFavicons.length) ||
            (!portalFavicons && result.faviconBaseUrl && result.favicons && result.favicons.length);

        if (!updateUI)
            return;

        if (portalFavicons) {
            this.tenant.tenantCustomizations.portalFaviconBaseUrl = result.portalFaviconBaseUrl;
            this.tenant.tenantCustomizations.portalFavicons = result.portalFavicons;
        } else {
            this.tenant.tenantCustomizations.faviconBaseUrl = result.faviconBaseUrl;
            this.tenant.tenantCustomizations.favicons = result.favicons;
            this.faviconsService.updateFavicons(this.tenant.tenantCustomizations.favicons, this.tenant.tenantCustomizations.faviconBaseUrl);
        }

        this.changeDetection.detectChanges();

    }

    clearLogo(portalLogo = false): void {
        this.tenantCustomizationService.clearLogo(portalLogo).subscribe(() => {
            if (portalLogo) {
                this.tenant.portalLogoFileType = null;
                this.tenant.portalLogoId = null;
            } else {
                this.tenant.logoFileType = null;
                this.tenant.logoId = null;
            }
            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    clearFavicons(portalFavicons = false): void {
        this.tenantCustomizationService.clearFavicons(portalFavicons).subscribe(() => {
            if (portalFavicons) {
                this.tenant.tenantCustomizations.portalFavicons = [];
            }
            else {
                this.faviconsService.resetFavicons();
                this.tenant.tenantCustomizations.favicons = [];
            }

            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    clearCustomCss(cssType: CustomCssType): void {
        this.tenantCustomizationService.clearCustomCss(cssType).subscribe(() => {
            this.setCustomCssTenantProperty(cssType, null);
            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    setCustomCssTenantProperty(cssType: CustomCssType, value: string) {
        switch (cssType) {
            case CustomCssType.Platform:
                this.tenant.customCssId = value;
                break;
            case CustomCssType.Login:
                this.tenant.loginCustomCssId = value;
                break;
            case CustomCssType.PortalLogin:
                this.tenant.portalLoginCustomCssId = value;
                break;
            case CustomCssType.Portal:
                this.tenant.portalCustomCssId = value;
                break;
            case CustomCssType.SignUp:
                this.tenant.signUpCustomCssId = value;
                break;
        }
    }

    getCustomPlatformStylePath() {
        let tenant = this.appSession.tenant,
            basePath = 'assets/common/styles/custom/';
        if (tenant && tenant.customLayoutType && tenant.customLayoutType != LayoutType.Default)
            return basePath + kebabCase(tenant.customLayoutType) + '/style.css'
        else
            return basePath + 'platform-custom-style.css';
    }

    getNavPosition(): NavPosition {
        return NavPosition[this.settingService.get('App.Appearance.NavPosition')];
    }

    onCustomRadiusChange(event) {
        this.colorSettings.borderRadius = '' + event.component.option('value');
        this.changeDetection.detectChanges();
    }

    onColorValueChanged(event, defaultColor) {
        this.someColorChanged = event.value != defaultColor && !this.isPortalSelected;
        if (!event.value)
            event.component.option('value', defaultColor);
    }

    onPortalMenuReordered(event) {
        this.portalMenuItems.splice(event.fromIndex, 1);
        this.portalMenuItems.splice(event.toIndex, 0, event.itemData);
    }
}