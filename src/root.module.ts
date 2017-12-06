import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, Injector, APP_INITIALIZER } from '@angular/core';

import { HttpModule, JsonpModule, Http, XHRBackend, RequestOptions } from '@angular/http';

import { AbpModule, ABP_HTTP_PROVIDER } from '@abp/abp.module';
import { httpConfiguration } from '@shared/http/httpConfiguration';

import { AppModule } from './app/app.module';
import { CommonModule } from '@shared/common/common.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { RootRoutingModule } from './root-routing.module';

import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { API_BASE_URL } from '@shared/service-proxies/service-proxies';

import { RootComponent, AppRootComponent } from './root.components';
import { AppPreBootstrap } from './AppPreBootstrap';

import { UrlHelper } from '@shared/helpers/UrlHelper';
import { AppAuthService } from '@app/shared/common/auth/app-auth.service';

import { FiltersModule } from '@shared/filters/filters.module';

export function appInitializerFactory(injector: Injector) {
    let process = (method) => {
        return (result) => {
            abp.ui.clearBusy();
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
            });
        });
    };
}

export function getRemoteServiceBaseUrl(): string {
    return AppConsts.remoteServiceBaseUrl;
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
        BrowserModule,
        BrowserAnimationsModule,
        AppModule,
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
        { provide: API_BASE_URL, useFactory: getRemoteServiceBaseUrl },
        {
            provide: APP_INITIALIZER,
            useFactory: appInitializerFactory,
            deps: [Injector],
            multi: true
        }
    ],
    bootstrap: [RootComponent]
})

export class RootModule { }
