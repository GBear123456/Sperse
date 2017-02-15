import * as moment from 'moment';
import { AppConsts } from '@shared/AppConsts';
import { UrlHelper } from './shared/helpers/UrlHelper';
import { LocalizedResourcesHelper } from './shared/helpers/LocalizedResourcesHelper';
import * as _ from 'lodash';
import { SubdomainTenancyNameFinder } from '@shared/helpers/SubdomainTenancyNameFinder';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Type, CompilerOptions, NgModuleRef } from '@angular/core';

export class AppPreBootstrap {
    
    static run(callback: () => void): void {
        AppPreBootstrap.getApplicationConfig(() => {
            const queryStringObj = UrlHelper.getQueryParameters();

            if (queryStringObj.impersonationToken) {
                AppPreBootstrap.impersonatedAuthenticate(queryStringObj.impersonationToken, queryStringObj.tenantId, () => { AppPreBootstrap.getUserConfiguration(callback); });
            } else if (queryStringObj.switchAccountToken) {
                AppPreBootstrap.linkedAccountAuthenticate(queryStringObj.switchAccountToken, queryStringObj.tenantId, () => { AppPreBootstrap.getUserConfiguration(callback); });
            } else {
                AppPreBootstrap.getUserConfiguration(callback);
            }
        });
    }

    static bootstrap<TM>(moduleType: Type<TM>, compilerOptions?: CompilerOptions | CompilerOptions[]): Promise<NgModuleRef<TM>> {
        return platformBrowserDynamic().bootstrapModule(moduleType, compilerOptions);
    }

    private static getApplicationConfig(callback: () => void) {
        return abp.ajax({
            url: '/assets/appconfig.json',
            method: 'GET',
            headers: {
                'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
            }
        }).done(result => {

            let subdomainTenancyNameFinder = new SubdomainTenancyNameFinder();
            var tenancyName = subdomainTenancyNameFinder.getCurrentTenancyNameOrNull(result.appBaseUrl);

            AppConsts.appBaseUrlFormat = result.appBaseUrl;
            AppConsts.appBaseUrl = result.appBaseUrl.replace(AppConsts.tenancyNamePlaceHolderInUrl, tenancyName);

            AppConsts.remoteServiceBaseUrlFormat = result.remoteServiceBaseUrl;
            AppConsts.remoteServiceBaseUrl = result.remoteServiceBaseUrl.replace(AppConsts.tenancyNamePlaceHolderInUrl, tenancyName);

            callback();
        });
    }

    private static getCurrentClockProvider(currentProviderName: string): abp.timing.IClockProvider {
        if (currentProviderName === "unspecifiedClockProvider") {
            return abp.timing.unspecifiedClockProvider;
        }

        if (currentProviderName === "utcClockProvider") {
            return abp.timing.utcClockProvider;
        }

        return abp.timing.localClockProvider;
    }

    private static impersonatedAuthenticate(impersonationToken: string, tenantId: number, callback: () => void): JQueryPromise<any> {
        abp.multiTenancy.setTenantIdCookie(tenantId);

        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/ImpersonatedAuthenticate?impersonationToken=' + impersonationToken,
            method: 'POST',
            headers: {
                'Accept-Language': abp.utils.getCookieValue("Abp.Localization.CultureName"),
                'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
            }
        }).done(result => {
            abp.auth.setToken(result.accessToken);
            location.search = '';
            callback();
        });
    }

    private static linkedAccountAuthenticate(switchAccountToken: string, tenantId: number, callback: () => void): JQueryPromise<any> {
        abp.multiTenancy.setTenantIdCookie(tenantId);

        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/LinkedAccountAuthenticate?switchAccountToken=' + switchAccountToken,
            method: 'POST',
            headers: {
                'Accept-Language': abp.utils.getCookieValue("Abp.Localization.CultureName"),
                'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
            }
        }).done(result => {
            abp.auth.setToken(result.accessToken);
            location.search = '';
            callback();
        });
    }

    private static getUserConfiguration(callback: () => void): JQueryPromise<any> {
        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/AbpUserConfiguration/GetAll',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + abp.auth.getToken(),
                'Accept-Language': abp.utils.getCookieValue("Abp.Localization.CultureName"),
                'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
            }
        }).done(result => {
            $.extend(true, abp, result);

            abp.clock.provider = this.getCurrentClockProvider(result.clock.provider);

            moment.locale(abp.localization.currentLanguage.name);

            if (abp.clock.provider.supportsMultipleTimezone) {
                moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
            }

            LocalizedResourcesHelper.loadResources(callback);
        });
    }
}