import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {APP_INITIALIZER, Injector, LOCALE_ID, NgModule} from '@angular/core';
import {registerLocaleData} from '@angular/common';

import {HttpModule, RequestOptions, XHRBackend} from '@angular/http';

import {ABP_HTTP_PROVIDER, AbpModule} from '@abp/abp.module';
import {httpConfiguration} from '@shared/http/httpConfiguration';
import {MobileModule} from './mobile/mobile.module';
import {CommonModule} from '@shared/common/common.module';
import {ServiceProxyModule} from '@shared/service-proxies/service-proxy.module';
import {RootRoutingModule} from './root-routing.module';

import {AppConsts} from '@shared/AppConsts';
import {AppSessionService} from '@shared/common/session/app-session.service';
import {API_BASE_URL} from '@shared/service-proxies/service-proxies';

import {AppRootComponent, RootComponent} from './root.components';
import {AppPreBootstrap} from './AppPreBootstrap';

import {UrlHelper} from '@shared/helpers/UrlHelper';
import {AppAuthService} from '@shared/common/auth/app-auth.service';

import * as _ from 'lodash';

import {FiltersModule} from '@shared/filters/filters.module';

export function appInitializerFactory(injector: Injector) {
    let process = (method) => {
        return (result) => {
            abp.ui.clearBusy();
            if (shouldLoadLocale()) {
                let angularLocale = convertAbpLocaleToAngularLocale(abp.localization.currentLanguage.name);
                System.import(`@angular/common/locales/${angularLocale}.js`)
                    .then(module => {
                        registerLocaleData(module.default);
                        method(result);
                    }, method);
            } else
                method(result);
        };
    };

    return () => {
        abp.ui.setBusy();

        handleLogoutRequest(injector.get(AppAuthService));

        return new Promise<boolean>((resolve, reject) => {
            AppPreBootstrap.run(() => {
                injector.get(AppSessionService).init()
                    .then(process(resolve), process(reject));
            }, resolve, reject);
        });
    };
}

export function shouldLoadLocale(): boolean {
    return abp.localization.currentLanguage.name && abp.localization.currentLanguage.name !== 'en-US';
}

export function convertAbpLocaleToAngularLocale(locale: string): string {
    if (!AppConsts.localeMappings) {
        return locale;
    }

    let localeMapings = _.filter(AppConsts.localeMappings, {from: locale});
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

function handleLogoutRequest(authService: AppAuthService) {
    let currentUrl = UrlHelper.initialUrl;
    let returnUrl = UrlHelper.getReturnUrl();
    if (currentUrl.indexOf(('account/logout')) >= 0 && returnUrl) {
        authService.logout(true, returnUrl);
    }
}

ABP_HTTP_PROVIDER.deps = [XHRBackend, RequestOptions, httpConfiguration];

@NgModule({
    imports: [
        HttpModule,
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
        ABP_HTTP_PROVIDER,
        httpConfiguration,
        {provide: API_BASE_URL, useFactory: getRemoteServiceBaseUrl},
        {
            provide: APP_INITIALIZER,
            useFactory: appInitializerFactory,
            deps: [Injector],
            multi: true
        },
        {
            provide: LOCALE_ID,
            useFactory: getCurrentLanguage
        }
    ],
    bootstrap: [RootComponent]
})

export class RootModule {
}
