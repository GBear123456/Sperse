import { UtilsService } from '@abp/utils/utils.service';
import { CompilerOptions, NgModuleRef, Type } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { AppConsts } from '@shared/AppConsts';
import * as moment from 'moment-timezone';
import { LocalizedResourcesHelper } from './shared/helpers/LocalizedResourcesHelper';
import { UrlHelper } from './shared/helpers/UrlHelper';
import { environment } from './environments/environment';
import { TenantAppHostOutput } from '@shared/service-proxies/service-proxies';

export class AppPreBootstrap {

    static run(appRootUrl: string, callback: () => void, resolve: any, reject: any): void {
        let abpAjax: any = abp.ajax;
        if (abpAjax.defaultError) {
            abpAjax.defaultError.details = AppConsts.defaultErrorMessage;
        }

        let _handleUnAuthorizedRequest = abpAjax['handleUnAuthorizedRequest'];
        abpAjax['handleUnAuthorizedRequest'] = (messagePromise: any, targetUrl?: string) => {
            if (!targetUrl || targetUrl == '/')
                targetUrl = location.origin;
            _handleUnAuthorizedRequest.call(abpAjax, messagePromise, targetUrl);
        }

        AppPreBootstrap.getApplicationConfig(appRootUrl, () => {
            const queryStringObj = UrlHelper.getQueryParameters();
            if (queryStringObj.redirect && queryStringObj.redirect === 'TenantRegistration') {
                if (queryStringObj.forceNewRegistration) {
                    new AppAuthService(null).logout();
                }

                location.href = AppConsts.appBaseUrl + '/account/select-edition';
            } else if (queryStringObj.secureId) {
                AppPreBootstrap.impersonatedAuthenticate(queryStringObj.secureId, queryStringObj.tenantId, () => { AppPreBootstrap.getUserConfiguration(callback); });
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

    private static getApplicationConfig(appRootUrl: string, callback: () => void) {
        return abp.ajax({
            url: appRootUrl + 'assets/' + environment.appConfig,
            method: 'GET',
        }).done(result => {
            AppConsts.appBaseUrlFormat = environment.appBaseUrl;
            AppConsts.remoteServiceBaseUrlFormat = result.remoteServiceBaseUrl;
            AppConsts.recaptchaSiteKey = result.recaptchaSiteKey;
            AppConsts.googleSheetClientId = result.googleSheetClientId;
            AppConsts.subscriptionExpireNootifyDayCount = result.subscriptionExpireNootifyDayCount;
            AppConsts.appBaseUrl = window.location.protocol + '//' + window.location.host;
            AppConsts.remoteServiceBaseUrl = result.enforceRemoteServiceBaseUrl 
                ? result.remoteServiceBaseUrl: location.origin;
            callback();
        });
    }

    private static getCurrentClockProvider(currentProviderName: string): abp.timing.IClockProvider {
        if (currentProviderName === 'unspecifiedClockProvider') {
            return abp.timing.unspecifiedClockProvider;
        }

        if (currentProviderName === 'utcClockProvider') {
            return abp.timing.utcClockProvider;
        }

        return abp.timing.localClockProvider;
    }

    private static impersonatedAuthenticate(impersonationToken: string, tenantId: number, callback: () => void): JQueryPromise<any> {
        abp.multiTenancy.setTenantIdCookie(tenantId);

        const cookieLangValue = abp.utils.getCookieValue('Abp.Localization.CultureName');
        let requestHeaders = {
            'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
        };

        if (cookieLangValue) {
            requestHeaders['.AspNetCore.Culture'] = 'c=' + cookieLangValue + '|uic=' + cookieLangValue;
        }

        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/ImpersonatedAuthenticate?secureId=' + impersonationToken,
            method: 'POST',
            headers: requestHeaders,
            abpHandleError: false
        }).done(result => {
            abp.auth.setToken(result.accessToken);
            AppPreBootstrap.setEncryptedTokenCookie(result.encryptedAccessToken);
            abp.multiTenancy.setTenantIdCookie();
            location.search = '';
            callback();
        }).fail(() => {
            abp.multiTenancy.setTenantIdCookie();
            location.href = AppConsts.appBaseUrl;
        });
    }

    private static linkedAccountAuthenticate(switchAccountToken: string, tenantId: number, callback: () => void): JQueryPromise<any> {
        abp.multiTenancy.setTenantIdCookie(tenantId);

        const cookieLangValue = abp.utils.getCookieValue('Abp.Localization.CultureName');
        let requestHeaders = {
            'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
        };

        if (cookieLangValue) {
            requestHeaders['.AspNetCore.Culture'] = 'c=' + cookieLangValue + '|uic=' + cookieLangValue;
        }

        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/LinkedAccountAuthenticate?switchAccountToken=' + switchAccountToken,
            method: 'POST',
            headers: requestHeaders
        }).done(result => {
            abp.auth.setToken(result.accessToken);
            AppPreBootstrap.setEncryptedTokenCookie(result.encryptedAccessToken);
            abp.multiTenancy.setTenantIdCookie();
            location.search = '';
            callback();
        });
    }

    static getUserConfiguration(callback: () => void, loadThemeResources: boolean = true): JQueryPromise<any> {
        const cookieLangValue = abp.utils.getCookieValue('Abp.Localization.CultureName');
        const token = abp.auth.getToken();

        let requestHeaders = {
            'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
        };

        if (cookieLangValue) {
            requestHeaders['.AspNetCore.Culture'] = 'c=' + cookieLangValue + '|uic=' + cookieLangValue;
        }

        if (token) {
            requestHeaders['Authorization'] = 'Bearer ' + token;
        }

        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/AbpUserConfiguration/GetAll',
            method: 'GET',
            headers: requestHeaders
        }).done(result => {
            $.extend(true, abp, result);
            abp.clock.provider = this.getCurrentClockProvider(result.clock.provider);

            if (window.hasOwnProperty('moment')) {
                moment.locale(abp.localization.currentLanguage.name);
                (window as any).moment.locale(abp.localization.currentLanguage.name);
                if (abp.clock.provider.supportsMultipleTimezone && moment) {
                    moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
                    (window as any).moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
                }
            }

            abp.event.trigger('abp.dynamicScriptsInitialized');

            AppConsts.recaptchaSiteKey = abp.setting.get('Recaptcha.SiteKey');
            AppConsts.subscriptionExpireNootifyDayCount = parseInt(abp.setting.get('App.TenantManagement.SubscriptionExpireNotifyDayCount'));

            loadThemeResources ? LocalizedResourcesHelper.loadResources(callback) : callback();
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
