import * as moment from 'moment';
import { AppConsts } from '@shared/AppConsts';
import { UrlHelper } from './shared/helpers/UrlHelper';
import { LocalizedResourcesHelper } from './shared/helpers/LocalizedResourcesHelper';
import * as _ from 'lodash';
import { SubdomainTenancyNameFinder } from '@shared/helpers/SubdomainTenancyNameFinder';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Type, CompilerOptions, NgModuleRef } from '@angular/core';
import { UtilsService } from '@abp/utils/utils.service';
import { AppAuthService } from '@app/shared/common/auth/app-auth.service';
import { TenantApiHostOutput } from '@shared/service-proxies/service-proxies';

export class AppPreBootstrap {

    static run(callback: () => void): void {
        AppPreBootstrap.getApplicationConfig(() => {
            const queryStringObj = UrlHelper.getQueryParameters();

            if (queryStringObj.redirect && queryStringObj.redirect === "TenantRegistration") {
                if (queryStringObj.forceNewRegistration) {
                    new AppAuthService().logout();
                }

                location.href = AppConsts.appBaseUrl + '/account/select-edition';
            }
            else if (queryStringObj.impersonationToken) {
                AppPreBootstrap.impersonatedAuthenticate(queryStringObj.impersonationToken, queryStringObj.tenantId, () => { AppPreBootstrap.getUserConfiguration(callback); });
            } else if (queryStringObj.switchAccountToken) {
                AppPreBootstrap.linkedAccountAuthenticate(queryStringObj.switchAccountToken, queryStringObj.tenantId, () => { AppPreBootstrap.getUserConfiguration(callback); });
            } else {                            
                if (queryStringObj.hasOwnProperty('tenantId'))
                  abp.multiTenancy.setTenantIdCookie(queryStringObj.tenantId);
                
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
            AppConsts.appBaseUrlFormat = result.appBaseUrl;
            AppConsts.remoteServiceBaseUrlFormat = result.remoteServiceBaseUrl;
            AppConsts.recaptchaSiteKey = result.recaptchaSiteKey;
            AppConsts.subscriptionExpireNootifyDayCount = result.subscriptionExpireNootifyDayCount;

            abp.ajax({
                url: result.remoteServiceBaseUrl + '/api/services/Platform/TenantHost/GetTenantApiHost?TenantHostType=' + encodeURIComponent("" + AppConsts.tenantHostType),
                method: 'GET',
                headers: {
                    'Accept-Language': abp.utils.getCookieValue("Abp.Localization.CultureName")
                }
            }).done((tenantApiHostOutput: TenantApiHostOutput) => {
                var apiProtocolUrl = new URL(result.remoteServiceBaseUrl);
                var clientProtocolUrl = new URL(result.appBaseUrl);

                if (tenantApiHostOutput.apiHostName !== null) {
                    AppConsts.remoteServiceBaseUrl = apiProtocolUrl.protocol + "//" + tenantApiHostOutput.apiHostName;
                }
                else {
                    AppConsts.remoteServiceBaseUrl = result.remoteServiceBaseUrl;
                }

                if (tenantApiHostOutput.clientHostName !== null) {
                    AppConsts.appBaseUrl = clientProtocolUrl.protocol + "//" + tenantApiHostOutput.clientHostName;
                }
                else {
                    AppConsts.appBaseUrl = result.appBaseUrl;
                }

                callback();
            });
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
        const cookieLangValue = abp.utils.getCookieValue("Abp.Localization.CultureName");
        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/ImpersonatedAuthenticate?impersonationToken=' + impersonationToken,
            method: 'POST',
            headers: {
                '.AspNetCore.Culture': ('c=' + cookieLangValue + '|uic=' + cookieLangValue),
                'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
            }
        }).done(result => {
            abp.auth.setToken(result.accessToken);
            AppPreBootstrap.setEncryptedTokenCookie(result.encryptedAccessToken);
            location.search = '';
            callback();
        });
    }

    private static linkedAccountAuthenticate(switchAccountToken: string, tenantId: number, callback: () => void): JQueryPromise<any> {
        abp.multiTenancy.setTenantIdCookie(tenantId);
        const cookieLangValue = abp.utils.getCookieValue("Abp.Localization.CultureName");
        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/LinkedAccountAuthenticate?switchAccountToken=' + switchAccountToken,
            method: 'POST',
            headers: {
                '.AspNetCore.Culture': ('c=' + cookieLangValue + '|uic=' + cookieLangValue),
                'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
            }
        }).done(result => {
            abp.auth.setToken(result.accessToken);
            AppPreBootstrap.setEncryptedTokenCookie(result.encryptedAccessToken);
            location.search = '';
            callback();
        });
    }

    private static getUserConfiguration(callback: () => void): JQueryPromise<any> {
        const cookieLangValue = abp.utils.getCookieValue("Abp.Localization.CultureName");
        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/AbpUserConfiguration/GetAll',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + abp.auth.getToken(),
                '.AspNetCore.Culture': ('c=' + cookieLangValue + '|uic=' + cookieLangValue),
                'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
            }
        }).done(result => {
            $.extend(true, abp, result);

            abp.clock.provider = this.getCurrentClockProvider(result.clock.provider);

            moment.locale(abp.localization.currentLanguage.name);
            (window as any).moment.locale(abp.localization.currentLanguage.name);

            if (abp.clock.provider.supportsMultipleTimezone) {
                moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
                (window as any).moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
            }

            abp.event.trigger('abp.dynamicScriptsInitialized');

            LocalizedResourcesHelper.loadResources(callback);
        });
    }

    private static setEncryptedTokenCookie(encryptedToken: string) {
        new UtilsService().setCookieValue(AppConsts.authorization.encrptedAuthTokenName,
            encryptedToken,
            new Date(new Date().getTime() + 365 * 86400000), //1 year
            abp.appPath
        );
    }
}