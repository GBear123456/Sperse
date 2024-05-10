/** Core imports */
import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
    AppearanceSettingsEditDto
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { UploaderComponent } from '@shared/common/uploader/uploader.component';
import { FaviconService } from '@shared/common/favicon-service/favicon.service';
import { FontService } from '@shared/common/font-service/font.service';
import { SettingService } from 'abp-ng2-module';
import { AppConsts } from '@shared/AppConsts';

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
    @ViewChild('portalCssUploader') portalCssUploader: UploaderComponent;
    @ViewChild('faviconsUploader') faviconsUploader: UploaderComponent;
    @ViewChild('signUpCssUploader') signUpCssUploader: UploaderComponent;

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

    navPosition = this.getNavPosition();
    navPositionOptions = Object.keys(NavPosition).map(item => {
        return {
            id: NavPosition[item],
            text: this.l('NavPosition_' + item)
        };
    });
    fontFamilyList: string[] = this.fontService.getSupportedFontsList();
    tabularFontFamilyList: string[] = this.fontService.supportedTabularGoogleFonts;

    constructor(
        _injector: Injector,
        private faviconsService: FaviconService,
        private settingsProxy: TenantSettingsServiceProxy,
        private tenantCustomizationService: TenantCustomizationServiceProxy,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        private fontService: FontService,
        private settingService: SettingService,
        private http: HttpClient
    ) {
        super(_injector);

        this.settingsProxy.getAppearanceSettings().subscribe(
            (res: AppearanceSettingsEditDto) => {
                this.appearance = res;
                if (!this.appearance.navBackground)
                    this.appearance.navBackground = this.defaultHeaderColor;
                if (!this.appearance.navTextColor)
                    this.appearance.navTextColor = this.defaultTextColor;
                if (!this.appearance.buttonColor)
                    this.appearance.buttonColor = this.defaultButtonColor;
                if (!this.appearance.buttonTextColor)
                    this.appearance.buttonTextColor = this.defaultButtonTextColor;
                if (!this.appearance.buttonHighlightedColor)
                    this.appearance.buttonHighlightedColor = this.defaultButtonHighlightedColor;
                if (!this.appearance.leftsideMenuColor)
                    this.appearance.leftsideMenuColor = this.defaultLeftSideMenuColor;
                if (!this.appearance.fontName)
                    this.appearance.fontName = this.defaultFontName;
                if (!this.appearance.tabularFont)
                    this.appearance.tabularFont = this.defaultTabularFontName;

                if (!this.appearance.borderRadius)
                    this.appearance.borderRadius = this.defaultBorderRadius;

                this.changeDetection.detectChanges();
            }
        );

        let root = this.getRootComponent();
        root.addStyleSheet('allfonts', 'https://fonts.googleapis.com/css?family='
            + this.fontService.supportedGoogleFonts.concat(this.fontService.supportedTabularGoogleFonts).join('|')
        );
        this.fontService.supportedCustomFonts.map(font =>
            root.addStyleSheet('custom-font', './assets/fonts/fonts-' + font.toLowerCase() + '.css')
        );
    }

    getSaveObs(): Observable<any> {
        if (this.appearance.navBackground == this.defaultHeaderColor)
            this.appearance.navBackground = null;
        if (this.appearance.navTextColor == this.defaultTextColor)
            this.appearance.navTextColor = null;
        if (this.appearance.buttonColor == this.defaultButtonColor)
            this.appearance.buttonColor = null;
        if (this.appearance.buttonTextColor == this.defaultButtonTextColor)
            this.appearance.buttonTextColor = null;
        if (this.appearance.buttonHighlightedColor == this.defaultButtonHighlightedColor)
            this.appearance.buttonHighlightedColor = null;
        if (this.appearance.leftsideMenuColor == this.defaultLeftSideMenuColor)
            this.appearance.leftsideMenuColor = null;
        if (this.appearance.fontName == this.defaultFontName)
            this.appearance.fontName = null;
        if (this.appearance.tabularFont == this.defaultTabularFontName)
            this.appearance.tabularFont = null;
        if (this.appearance.borderRadius == this.defaultBorderRadius)
            this.appearance.borderRadius = null;

        if (this.getNavPosition() != this.navPosition)
            this.appearance.navPosition = this.navPosition;

        return forkJoin(
            this.someColorChanged ?
                this.settingsProxy.updateAppearanceSettings(this.appearance) : of(null),
            this.logoUploader.uploadFile().pipe(tap((res: any) => {
                if (res.result && res.result.id) {
                    this.tenant.logoId = res.result && res.result.id;
                    this.changeDetection.detectChanges();
                }
            })),
            this.cssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Platform, res))),
            this.loginCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Login, res))),
            this.portalCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Portal, res))),
            this.signUpPagesEnabled ?
                this.signUpCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.SignUp, res))) : of(false),
            this.faviconsUploader.uploadFile().pipe(tap((res) => {
                if (res && res.result && res.result.faviconBaseUrl && res.result.favicons && res.result.favicons.length) {
                    this.tenant.tenantCustomizations = <any>{ ...this.tenant.tenantCustomizations, ...res.result };
                    this.faviconsService.updateFavicons(this.tenant.tenantCustomizations.favicons, this.tenant.tenantCustomizations.faviconBaseUrl);
                    this.changeDetection.detectChanges();
                }
            }))
        );
    }

    afterSave() {
        if (this.someCssChanged || this.someColorChanged)
            this.message.info(this.l('ReloadPageStylesMessage')).then(() => window.location.reload());

        if (this.getNavPosition() != this.navPosition) {
            this.message.info(this.l('SettingsChangedRefreshPageNotification', this.l('NavigationMenuPosition'))).done(function () {
                window.location.reload();
            });
        }
    }

    handleCssUpload(cssType: CustomCssType, res: any) {
        if (res.result && res.result.id) {
            this.someCssChanged = true;
            this.setCustomCssTenantProperty(cssType, res.result.id);
            this.changeDetection.detectChanges();
        }
    }

    clearLogo(): void {
        this.tenantCustomizationService.clearLogo().subscribe(() => {
            this.tenant.logoFileType = null;
            this.tenant.logoId = null;
            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    clearFavicons(): void {
        this.tenantCustomizationService.clearFavicons().subscribe(() => {
            this.faviconsService.resetFavicons();
            this.tenant.tenantCustomizations.favicons = [];
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
        this.appearance.borderRadius = '' + event.component.option('value');
        this.changeDetection.detectChanges();
    }

    onColorValueChanged(event, defaultColor) {
        this.someColorChanged = true;
        if (!event.value)
            event.component.option('value', defaultColor);
    }
}