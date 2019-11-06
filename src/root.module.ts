/** Core imports */
import { APP_INITIALIZER, LOCALE_ID, Injector, NgModule, ErrorHandler } from '@angular/core';
import { HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_BASE_HREF, PlatformLocation, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RouteReuseStrategy, Router } from '@angular/router';

/** Third party imports */
import { AbpModule } from '@abp/abp.module';
import { GestureConfig } from '@angular/material';
import { CacheService } from 'ng2-cache-service';
import { CacheStorageAbstract } from 'ng2-cache-service/dist/src/services/storage/cache-storage-abstract.service';
import { CacheLocalStorage } from 'ng2-cache-service/dist/src/services/storage/local-storage/cache-local-storage.service';
import filter from 'lodash/filter';
import { BugsnagErrorHandler } from '@bugsnag/plugin-angular';

/** Application imports */
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { RouteGuard } from '@shared/common/auth/route-guard';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { API_BASE_URL } from '@shared/service-proxies/service-proxies';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { AppPreBootstrap } from './AppPreBootstrap';
import { RootComponent, AppRootComponent } from './root.components';
import { RootRoutingModule, CustomReuseStrategy, AppPreloadingStrategy } from './root-routing.module';
import { RootStoreModule } from '@root/store';
import { FaviconService } from '@shared/common/favicon-service/favicon.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { BugsnagService } from '@shared/common/bugsnag/bugsnag.service';

export function errorHandlerFactory(
    bugsnagService: BugsnagService
) {
    return bugsnagService.bugsnagApiKey
        ? new BugsnagErrorHandler(bugsnagService.bugsnagClient)
        : new ErrorHandler();
}

export function appInitializerFactory(
    injector: Injector,
    platformLocation: PlatformLocation,
    faviconService: FaviconService,
    bugsnagService: BugsnagService
) {
    return () => {
        let appAuthService = injector.get(AppAuthService);
        appAuthService.setCheckDomainToken();
        handleLogoutRequest(appAuthService);
        return new Promise<boolean>((resolve, reject) => {
            AppConsts.appBaseHref = getBaseHref(platformLocation);
            AppPreBootstrap.run(AppConsts.appBaseHref, (sessionCallback?) => {
                appAuthService.startTokenCheck();
                let appSessionService: AppSessionService = injector.get(AppSessionService);
                let ui: AppUiCustomizationService = injector.get(AppUiCustomizationService);
                appSessionService.init().then(
                    (result) => {
                        //set og meta tags
                        sessionCallback && sessionCallback();
                        updateMetadata(appSessionService.tenant, ui);
                        bugsnagService.updateBugsnagWithUserInfo(appSessionService);
                        let customizations = appSessionService.tenant && appSessionService.tenant.tenantCustomizations;
                        if (customizations && customizations.favicons && customizations.favicons.length)
                            faviconService.updateFavicons(customizations.favicons, customizations.faviconBaseUrl);
                        else
                            faviconService.updateFavicons(FaviconService.DEFAULT_FAVICONS, AppConsts.appBaseHref);

                        if (shouldLoadLocale()) {
                            let angularLocale = convertAbpLocaleToAngularLocale(abp.localization.currentLanguage.name);
                            import(`@angular/common/locales/${angularLocale}.js`)
                                .then(module => {
                                    registerLocaleData(module.default);
                                    resolve(result);
                                }, reject);
                        } else {
                            resolve(result);
                        }
                    },
                    (err) => {
                        reject(err);
                    }
                );
            }, Function(), reject, injector.get(Router));
        });
    };
}

function createMetatag(name, content) {
    let meta = document.head.querySelector('meta[property="' + name + '"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', name);
        document.head.appendChild(meta);
    }

    meta.setAttribute('content', content);
}

function updateMetadata(tenant, ui) {
    createMetatag('og:title', document.title);
    createMetatag('og:description', tenant &&
        tenant.customLayoutType && tenant.customLayoutType != 'Default'
        ? '' : 'Business management platform, enhanced with AI');
    createMetatag('og:url', location.origin);
    createMetatag('og:image', !tenant || !tenant.logoId ?
        window.location.origin + '/assets/common/images/app-logo-on-' + ui.getAsideSkin() + '.png' :
        AppConsts.remoteServiceBaseUrl + '/api/TenantCustomization/GetLogo?id=' + tenant.logoId);
}

function getDocumentOrigin() {
    if (!document.location.origin) {
        return document.location.protocol + '//' + document.location.hostname + (document.location.port ? ':' + document.location.port : '');
    }

    return document.location.origin;
}

export function shouldLoadLocale(): boolean {
    return abp.localization.currentLanguage.name && abp.localization.currentLanguage.name !== 'en-US';
}

export function convertAbpLocaleToAngularLocale(locale: string): string {
    if (!AppConsts.localeMappings) {
        return locale;
    }

    let localeMapings = filter(AppConsts.localeMappings, { from: locale });
    if (localeMapings && localeMapings.length) {
        return localeMapings[0]['to'];
    }

    return locale;
}

export function getRemoteServiceBaseUrl(): string {
    return AppConsts.remoteServiceBaseUrl;
}

export function getCurrentLanguage(): string {
    return abp.localization.currentLanguage.name;
}

export function getBaseHref(platformLocation: PlatformLocation): string {
    let baseUrl = document.head.getElementsByTagName('base')[0].href;  //platformLocation.getBaseHrefFromDOM();
    return (/http[s]{0,1}:\/\//g).test(baseUrl) ? baseUrl : getDocumentOrigin() + baseUrl;
}

function handleLogoutRequest(authService: AppAuthService) {
    let currentUrl = UrlHelper.initialUrl;
    let returnUrl = UrlHelper.getReturnUrl();
    if (currentUrl.indexOf(('account/logout')) >= 0 && returnUrl) {
        authService.logout(true, returnUrl);
    }
}

@NgModule({
    imports: [
        AbpModule,
        ServiceProxyModule,
        HttpClientModule,
        RootRoutingModule,
        RootStoreModule,
        BrowserAnimationsModule
    ],
    declarations: [
        RootComponent, AppRootComponent
    ],
    providers: [
        AppPreloadingStrategy,
        AppLocalizationService,
        BugsnagService,
        AppUiCustomizationService,
        AppAuthService,
        RouteGuard,
        AppSessionService,
        ProfileService,
        AppHttpConfiguration,
        AppHttpInterceptor,
        {
            provide: CacheStorageAbstract,
            useClass: CacheLocalStorage
        },
        FaviconService,
        CacheService,
        { provide: HTTP_INTERCEPTORS, useClass: AppHttpInterceptor, multi: true },
        { provide: API_BASE_URL, useFactory: getRemoteServiceBaseUrl },
        { provide: APP_BASE_HREF, useValue: getDocumentOrigin() },
        {
            provide: APP_INITIALIZER,
            useFactory: appInitializerFactory,
            deps: [ Injector, PlatformLocation, FaviconService, BugsnagService ],
            multi: true
        },
        {
            provide: LOCALE_ID,
            useFactory: getCurrentLanguage
        },
        {
            provide: RouteReuseStrategy,
            useClass: CustomReuseStrategy
        },
        {
            provide: HAMMER_GESTURE_CONFIG,
            useClass: GestureConfig
        },
        {
            provide: ErrorHandler,
            useFactory: errorHandlerFactory,
            deps: [ BugsnagService ]
        },
        AppPermissionService
    ],
    bootstrap: [ RootComponent ]
})
export class RootModule {}
