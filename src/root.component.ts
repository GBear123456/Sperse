<<<<<<< HEAD
/** Core imports */
import { AfterViewInit, Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { first, filter } from 'rxjs/operators';
import * as moment from 'moment-timezone';
import kebabCase from 'lodash/kebabCase';
import startCase from 'lodash/startCase';
import * as _ from 'underscore';

/** Core imports */
import { AppConsts } from '@shared/AppConsts';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { LayoutType, CustomCssType, HostSettingsServiceProxy, MaintenanceSettingsDto } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { FontService } from '@shared/common/font-service/font.service';
import { DomHelper } from '@shared/helpers/DomHelper';

/*
    Root App Component (App Selector)
*/
@Component({
    selector: 'app-root',
    templateUrl: 'root.component.html',
    styleUrls: ['./root.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class RootComponent implements OnInit, AfterViewInit {    
    showCBLoader: Boolean = false;
    showSperseLoader: Boolean = !abp.session.tenantId; 
    maintenanceSettings: MaintenanceSettingsDto;
    hideMaintenanceMessage: Boolean = false;
    currentDate = moment();

    constructor(
        private router: Router,
        private loadingService: LoadingService,
        private hostSettingsProxy: HostSettingsServiceProxy,
        private uiCustomizationService: AppUiCustomizationService,
        private fontService: FontService,
        @Inject(AppSessionService) private SS,
        @Inject(DOCUMENT) private document
    ) {
        let tenant = this.SS.tenant;
        this.showCBLoader = tenant && tenant.customLayoutType && 
            tenant.customLayoutType == LayoutType.BankCode;

        this.pageHeaderFixed(true);
        router.events.pipe(
            filter((event) => {
                if (event instanceof NavigationEnd) {
                    this.showCBLoader = false;
                    this.showSperseLoader = false;
                    this.removeLoadingSpinner();
                    return true;
                }
                return false;
            }), 
            first()
        ).subscribe();

        if (this.showSperseLoader || this.showCBLoader)
            this.removeLoadingSpinner();

        this.hostSettingsProxy.getMaintenanceSettings().subscribe((res: MaintenanceSettingsDto) => {
            this.maintenanceSettings = res;
        });

        let hideMaintenanceMessage = localStorage.getItem('hideMaintenanceMessage');
        if (hideMaintenanceMessage != null)
            this.hideMaintenanceMessage = Boolean(hideMaintenanceMessage);
    }

    removeLoadingSpinner() {
        this.document.body.querySelectorAll('div.spinner').forEach(elm => {
            this.document.body.removeChild(elm);
        });
    }
    
    ngOnInit() {
        sessionStorage.clear();
        if (abp && abp.setting && abp.setting.values) {
            let mapKey = abp.setting.values['Integrations:Google:MapsJavascriptApiKey'];
            if (mapKey && this.SS.userId)
                DomHelper.addScriptLink(AppConsts.googleMapsApiUrl.replace('{KEY}', mapKey));

            let fontName = abp.setting.values['App.Appearance.FontName'] || AppConsts.defaultFontName,
                tabularFontName = abp.setting.values['App.Appearance.TabularFont'] || AppConsts.defaultTabularFontName,
                buttonColor = abp.setting.values['App.Appearance.ButtonColor'] || AppConsts.defaultButtonColor,
                buttonTextColor = abp.setting.values['App.Appearance.ButtonTextColor'] || AppConsts.defaultButtonTextColor,
                buttonHighlightedColor = abp.setting.values['App.Appearance.ButtonHighlightedColor'] || AppConsts.defaultButtonHighlightedColor,
                leftSideMenuColor = abp.setting.values['App.Appearance.LeftsideMenuColor'] || AppConsts.defaultLeftSideMenuColor,
                borderRadius = abp.setting.values['App.Appearance.BorderRadius'] || AppConsts.defaultBorderRadius,
                rootStyle = this.document.querySelector(':root').style;

            if (this.fontService.supportedCustomFonts.includes(fontName))
                DomHelper.addStyleSheet('custom-font', './assets/fonts/fonts-' + fontName.toLowerCase() + '.css');            
            else
                DomHelper.addStyleSheet('googleapis', 'https://fonts.googleapis.com/css?family=' + fontName);

            rootStyle.setProperty('--app-font-family', fontName);
            rootStyle.setProperty('--app-tabular-font-family', tabularFontName);
            rootStyle.setProperty('--app-left-bar-color', leftSideMenuColor);
            rootStyle.setProperty('--app-button-color', buttonColor);
            rootStyle.setProperty('--app-button-text-color', buttonTextColor);
            rootStyle.setProperty('--app-button-highlighted-color', buttonHighlightedColor);
            rootStyle.setProperty('--app-border-radius', borderRadius + 'px');
            rootStyle.setProperty('--app-button-context-color', 
                abp.setting.values['App.Appearance.ButtonColor'] || '#00a0dc');
        }

        //tenant specific custom css
        let tenant = this.SS.tenant;
        if (tenant) {
            let customCss = abp.session.userId ? tenant.customCssId : (
                UrlHelper.isSignUpUrl() ?  tenant.signUpCustomCssId : tenant.loginCustomCssId
            );
            if (customCss)
                DomHelper.addStyleSheet(`${CustomCssType.Platform}CustomCss`, AppConsts.remoteServiceBaseUrl + 
                    '/api/TenantCustomization/GetCustomCss/' + customCss + '/' + tenant.id);

            if (tenant.customLayoutType && tenant.customLayoutType !== LayoutType.Default) {
                let layoutName = kebabCase(tenant.customLayoutType);
                this.document.body.classList.add(layoutName);
                DomHelper.addStyleSheet(tenant.customLayoutType + 'Styles', AppConsts.appBaseHref +
                    'assets/common/styles/custom/' + layoutName + '/style.css');
            }

            this.checkSetGoogleAnalyticsCode(tenant);
        }
    }

    ngAfterViewInit() {
        this.checkSetClasses(abp.session.userId);
    }

    public checkSetClasses(loggedUser) {
        let classList = this.document.body.classList,
            loggedClass = this.uiCustomizationService.getAppModuleBodyClass().split(' ').filter(Boolean),
            accountClass = this.uiCustomizationService.getAccountModuleBodyClass().split(' ').filter(Boolean);
        classList.remove.apply(classList, accountClass.concat(accountClass));
        classList.add.apply(classList, loggedUser ? loggedClass : accountClass);
    }

    public pageHeaderFixed(value?: boolean) {
        this.document.body.classList[
            value ? 'add' : 'remove']('page-header-fixed');
    }

    public overflowHidden(value?: boolean) {
        this.uiCustomizationService.overflowHidden(value);
    }

    checkSetGoogleAnalyticsCode(tenant) {
        if (tenant.customLayoutType == LayoutType.LendSpace) {
            let tenantGACode = 'UA-129828500-1'; //!!VP should be used some tenant property
            DomHelper.addScriptLink('https://www.googletagmanager.com/gtag/js?id=' + tenantGACode, '', () => {
                let dataLayer = window['dataLayer'] = window['dataLayer'] || [];
                dataLayer.push(['js', new Date()]);
                dataLayer.push(['config', tenantGACode]);
            });
        }
    }

    getMaintenanceMessageLink() {
        let message = this.maintenanceSettings.maintenanceMessage,
            email = this.maintenanceSettings.maintenanceEmailAddress;
        if (this.maintenanceSettings.showMaintenanceMessage && message) {
            if (email) {
                if (message.indexOf('{0}') >= 0)            
                    return message.replace('{0}', this.getEmailLink(email, email));
                else
                    return this.getEmailLink(email, message);
            } else 
                return message;
        }
        return '';
    }

    getEmailLink(email, text) {
        return '<a target="_blank" href="mailto:' + email + '?subject=New Request from ' + (this.SS.tenantName
            || AppConsts.defaultTenantName) + ' - ' + this.getModuleName() + '">' + text + '</a>';
    }

    getModuleName() {
        let path = document.location.href.match(/\/[app|account]{3,7}\/(\w*)[\/|$]?/);
        return path ? startCase(path[1]) : AppConsts.modules.platformModule;
    }

    toogleMaintenanceMessage() {
        this.hideMaintenanceMessage = !this.hideMaintenanceMessage;
        localStorage.setItem('hideMaintenanceMessage', this.hideMaintenanceMessage ? '1' : '');
    }
=======
/** Core imports */
import { AfterViewInit, Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { first, filter } from 'rxjs/operators';
import * as moment from 'moment-timezone';
import kebabCase from 'lodash/kebabCase';
import startCase from 'lodash/startCase';
import * as _ from 'underscore';

/** Core imports */
import { AppConsts } from '@shared/AppConsts';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { LayoutType, CustomCssType, HostSettingsServiceProxy, MaintenanceSettingsDto } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { FontService } from '@shared/common/font-service/font.service';
import { DomHelper } from '@shared/helpers/DomHelper';

/*
    Root App Component (App Selector)
*/
@Component({
    selector: 'app-root',
    templateUrl: 'root.component.html',
    styleUrls: ['./root.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class RootComponent implements OnInit, AfterViewInit {    
    showCBLoader: Boolean = false;
    showSperseLoader: Boolean = !abp.session.tenantId; 
    maintenanceSettings: MaintenanceSettingsDto;
    hideMaintenanceMessage: Boolean = false;
    currentDate = moment();

    constructor(
        private router: Router,
        private loadingService: LoadingService,
        private hostSettingsProxy: HostSettingsServiceProxy,
        private uiCustomizationService: AppUiCustomizationService,
        private fontService: FontService,
        @Inject(AppSessionService) private SS,
        @Inject(DOCUMENT) private document
    ) {
        let tenant = this.SS.tenant;
        this.showCBLoader = tenant && tenant.customLayoutType && 
            tenant.customLayoutType == LayoutType.BankCode;

        this.pageHeaderFixed(true);
        router.events.pipe(
            filter((event) => {
                if (event instanceof NavigationEnd) {
                    this.showCBLoader = false;
                    this.showSperseLoader = false;
                    this.removeLoadingSpinner();
                    return true;
                }
                return false;
            }), 
            first()
        ).subscribe();

        if (this.showSperseLoader || this.showCBLoader)
            this.removeLoadingSpinner();

        this.hostSettingsProxy.getMaintenanceSettings().subscribe((res: MaintenanceSettingsDto) => {
            this.maintenanceSettings = res;
        });

        let hideMaintenanceMessage = localStorage.getItem('hideMaintenanceMessage');
        if (hideMaintenanceMessage != null)
            this.hideMaintenanceMessage = Boolean(hideMaintenanceMessage);
    }

    removeLoadingSpinner() {
        this.document.body.querySelectorAll('div.spinner').forEach(elm => {
            this.document.body.removeChild(elm);
        });
    }
    
    ngOnInit() {
        sessionStorage.clear();
        if (abp && abp.setting && abp.setting.values) {
            let mapKey = abp.setting.values['Integrations:Google:MapsJavascriptApiKey'];
            if (mapKey && this.SS.userId)
                DomHelper.addScriptLink(AppConsts.googleMapsApiUrl.replace('{KEY}', mapKey));

            let fontName = abp.setting.values['App.Appearance.FontName'] || AppConsts.defaultFontName,
                tabularFontName = abp.setting.values['App.Appearance.TabularFont'] || AppConsts.defaultTabularFontName,
                buttonColor = abp.setting.values['App.Appearance.ButtonColor'] || AppConsts.defaultButtonColor,
                buttonTextColor = abp.setting.values['App.Appearance.ButtonTextColor'] || AppConsts.defaultButtonTextColor,
                buttonHighlightedColor = abp.setting.values['App.Appearance.ButtonHighlightedColor'] || AppConsts.defaultButtonHighlightedColor,
                leftSideMenuColor = abp.setting.values['App.Appearance.LeftsideMenuColor'] || AppConsts.defaultLeftSideMenuColor,
                borderRadius = abp.setting.values['App.Appearance.BorderRadius'] || AppConsts.defaultBorderRadius,
                rootStyle = this.document.querySelector(':root').style;

            if (this.fontService.supportedCustomFonts.includes(fontName))
                DomHelper.addStyleSheet('custom-font', './assets/fonts/fonts-' + fontName.toLowerCase() + '.css');            
            else
                DomHelper.addStyleSheet('googleapis', 'https://fonts.googleapis.com/css?family=' + fontName);

            rootStyle.setProperty('--app-font-family', fontName);
            rootStyle.setProperty('--app-tabular-font-family', tabularFontName);
            rootStyle.setProperty('--app-left-bar-color', leftSideMenuColor);
            rootStyle.setProperty('--app-button-color', buttonColor);
            rootStyle.setProperty('--app-button-text-color', buttonTextColor);
            rootStyle.setProperty('--app-button-highlighted-color', buttonHighlightedColor);
            rootStyle.setProperty('--app-border-radius', borderRadius + 'px');
            rootStyle.setProperty('--app-button-context-color', 
                abp.setting.values['App.Appearance.ButtonColor'] || '#00a0dc');
        }

        //tenant specific custom css
        let tenant = this.SS.tenant;
        if (tenant) {
            let customCss = abp.session.userId ? tenant.customCssId : (
                UrlHelper.isSignUpUrl() ?  tenant.signUpCustomCssId : tenant.loginCustomCssId
            );
            if (customCss)
                DomHelper.addStyleSheet(`${CustomCssType.Platform}CustomCss`, AppConsts.remoteServiceBaseUrl + 
                    '/api/TenantCustomization/GetCustomCss/' + customCss + '/' + tenant.id);

            if (tenant.customLayoutType && tenant.customLayoutType !== LayoutType.Default) {
                let layoutName = kebabCase(tenant.customLayoutType);
                this.document.body.classList.add(layoutName);
                DomHelper.addStyleSheet(tenant.customLayoutType + 'Styles', AppConsts.appBaseHref +
                    'assets/common/styles/custom/' + layoutName + '/style.css');
            }

            this.checkSetGoogleAnalyticsCode(tenant);
        }
    }

    ngAfterViewInit() {
        this.checkSetClasses(abp.session.userId);
    }

    public checkSetClasses(loggedUser) {
        let classList = this.document.body.classList,
            loggedClass = this.uiCustomizationService.getAppModuleBodyClass().split(' ').filter(Boolean),
            accountClass = this.uiCustomizationService.getAccountModuleBodyClass().split(' ').filter(Boolean);
        classList.remove.apply(classList, accountClass.concat(accountClass));
        classList.add.apply(classList, loggedUser ? loggedClass : accountClass);
    }

    public pageHeaderFixed(value?: boolean) {
        this.document.body.classList[
            value ? 'add' : 'remove']('page-header-fixed');
    }

    public overflowHidden(value?: boolean) {
        this.uiCustomizationService.overflowHidden(value);
    }

    checkSetGoogleAnalyticsCode(tenant) {
        if (tenant.customLayoutType == LayoutType.LendSpace) {
            let tenantGACode = 'UA-129828500-1'; //!!VP should be used some tenant property
            DomHelper.addScriptLink('https://www.googletagmanager.com/gtag/js?id=' + tenantGACode, '', () => {
                let dataLayer = window['dataLayer'] = window['dataLayer'] || [];
                dataLayer.push(['js', new Date()]);
                dataLayer.push(['config', tenantGACode]);
            });
        }
    }

    getMaintenanceMessageLink() {
        let message = this.maintenanceSettings.maintenanceMessage,
            email = this.maintenanceSettings.maintenanceEmailAddress;
        if (this.maintenanceSettings.showMaintenanceMessage && message) {
            if (email) {
                if (message.indexOf('{0}') >= 0)            
                    return message.replace('{0}', this.getEmailLink(email, email));
                else
                    return this.getEmailLink(email, message);
            } else 
                return message;
        }
        return '';
    }

    getEmailLink(email, text) {
        return '<a target="_blank" href="mailto:' + email + '?subject=New Request from ' + (this.SS.tenantName
            || AppConsts.defaultTenantName) + ' - ' + this.getModuleName() + '">' + text + '</a>';
    }

    getModuleName() {
        let path = document.location.href.match(/\/[app|account]{3,7}\/(\w*)[\/|$]?/);
        return path ? startCase(path[1]) : AppConsts.modules.platformModule;
    }

    toogleMaintenanceMessage() {
        this.hideMaintenanceMessage = !this.hideMaintenanceMessage;
        localStorage.setItem('hideMaintenanceMessage', this.hideMaintenanceMessage ? '1' : '');
    }
>>>>>>> f999b481882149d107812286d0979872df712626
}