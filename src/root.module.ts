/** Core imports */
import { APP_INITIALIZER, LOCALE_ID, Injector, NgModule } from '@angular/core';
import { HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_BASE_HREF, PlatformLocation, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RouteReuseStrategy } from '@angular/router';

/** Third party imports */
import { AbpModule } from '@abp/abp.module';
import { GestureConfig } from '@angular/material';
import { CacheService } from 'ng2-cache-service';
import { filter } from 'lodash';

/** Application imports */
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
import { RootRoutingModule, CustomReuseStrategy } from './root-routing.module';
import { RootStoreModule } from '@root/store';

export function appInitializerFactory(
    injector: Injector,
    platformLocation: PlatformLocation) {
    return () => {
        handleLogoutRequest(injector.get(AppAuthService));

        return new Promise<boolean>((resolve, reject) => {
            AppConsts.appBaseHref = getBaseHref(platformLocation);
            AppPreBootstrap.run(AppConsts.appBaseHref, () => {
                let appSessionService: AppSessionService = injector.get(AppSessionService);
                let ui: AppUiCustomizationService = injector.get(AppUiCustomizationService);
                appSessionService.init().then(
                    (result) => {

                        //Css classes based on the layout
                        let appUiCustomizationService: AppUiCustomizationService = injector.get(AppUiCustomizationService);
                        if (abp.session.userId) {
                            $('body').attr('class', appUiCustomizationService.getAppModuleBodyClass());
                        } else {
                            $('body').attr('class', appUiCustomizationService.getAccountModuleBodyClass());
                        }

                        //set og share image meta tag
                        if (!appSessionService.tenant || !appSessionService.tenant.logoId) {
                            $('meta[property=og\\:image]').attr('content', window.location.origin + '/assets/common/images/app-logo-on-' + ui.getAsideSkin() + '.png');
                        } else {
                            $('meta[property=og\\:image]').attr('content', AppConsts.remoteServiceBaseUrl + '/api/TenantCustomization/GetLogo?id=' + appSessionService.tenant.logoId);
                        }

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
            }, resolve, reject);
        });
    };
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
    return (/http[s]{0,1}:\/\//g).test(baseUrl) ? baseUrl: getDocumentOrigin() + baseUrl;
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
        AppLocalizationService,
        AppUiCustomizationService,
        AppAuthService,
        RouteGuard,
        AppSessionService,
        AppHttpConfiguration,
        AppHttpInterceptor,
        CacheService,
        { provide: HTTP_INTERCEPTORS, useClass: AppHttpInterceptor, multi: true },
        { provide: API_BASE_URL, useFactory: getRemoteServiceBaseUrl },
        { provide: APP_BASE_HREF, useValue: getDocumentOrigin() },
        {
            provide: APP_INITIALIZER,
            useFactory: appInitializerFactory,
            deps: [ Injector, PlatformLocation ],
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
        }
    ],
    bootstrap: [ RootComponent ]
})
export class RootModule {

}
