/** Core imports */
import { APP_INITIALIZER, LOCALE_ID, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlatformLocation, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RouteReuseStrategy } from '@angular/router';

/** Third party imports */
import { AbpModule } from '@abp/abp.module';
import { AbpHttpInterceptor } from '@abp/abpHttpInterceptor';
import * as _ from 'lodash';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { CommonModule } from '@shared/common/common.module';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { FiltersModule } from '@shared/filters/filters.module';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { httpConfiguration } from '@shared/http/httpConfiguration';
import { API_BASE_URL } from '@shared/service-proxies/service-proxies';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { AppPreBootstrap } from './AppPreBootstrap';
import { MobileModule } from './mobile/mobile.module';
import { RootComponent, AppRootComponent } from './root.components';
import { RootRoutingModule, CustomReuseStrategy } from './root-routing.module';

export function appInitializerFactory(
    injector: Injector,
    platformLocation: PlatformLocation) {
    return () => {
        abp.ui.setBusy();

        handleLogoutRequest(injector.get(AppAuthService));

        return new Promise<boolean>((resolve, reject) => {
            AppConsts.appBaseHref = getBaseHref(platformLocation);
            let appBaseUrl = getDocumentOrigin() + AppConsts.appBaseHref;
            AppPreBootstrap.run(appBaseUrl, () => {
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

                        //tenant specific custom css
                        if (appSessionService.tenant && appSessionService.tenant.customCssId) {
                            $('head').append('<link id="TenantCustomCss" href="' + AppConsts.remoteServiceBaseUrl + '/TenantCustomization/GetCustomCss?id=' + appSessionService.tenant.customCssId + '" rel="stylesheet"/>');
                        }

                        //set og share image meta tag
                        if (!appSessionService.tenant || !appSessionService.tenant.logoId) {
                            $('meta[property=og\\:image]').attr('content', window.location.origin + '/assets/common/images/app-logo-on-' + ui.getAsideSkin() + '.png');
                        } else {
                            $('meta[property=og\\:image]').attr('content', AppConsts.remoteServiceBaseUrl + '/TenantCustomization/GetLogo?id=' + appSessionService.tenant.logoId);
                        }

                        abp.ui.clearBusy();

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
                        abp.ui.clearBusy();
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

    let localeMapings = _.filter(AppConsts.localeMappings, { from: locale });
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
    let baseUrl = platformLocation.getBaseHrefFromDOM();
    if (baseUrl) {
        return baseUrl;
    }

    return '/';
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
        HttpClientModule,
        BrowserModule,
        BrowserAnimationsModule,
        MobileModule,
        CommonModule.forRoot(),
        AbpModule,
        ServiceProxyModule,
        RootRoutingModule,
        FiltersModule.forRoot()
    ],
    declarations: [
        RootComponent, AppRootComponent
    ],
    providers: [
        httpConfiguration,
        { provide: HTTP_INTERCEPTORS, useClass: AbpHttpInterceptor, multi: true },
        { provide: API_BASE_URL, useFactory: getRemoteServiceBaseUrl },
        {
            provide: APP_INITIALIZER,
            useFactory: appInitializerFactory,
            deps: [Injector, PlatformLocation],
            multi: true
        },
        {
            provide: LOCALE_ID,
            useFactory: getCurrentLanguage
        },
        {
            provide: RouteReuseStrategy,
            useClass: CustomReuseStrategy
        }
    ],
    bootstrap: [RootComponent]
})
export class RootModule {

}
