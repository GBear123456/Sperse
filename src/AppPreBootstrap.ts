import { Router } from '@angular/router';
import { UtilsService } from '@abp/utils/utils.service';
import { CompilerOptions, NgModuleRef, Type } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { AppConsts } from '@shared/AppConsts';
import * as moment from 'moment-timezone';
import { LocalizedResourcesHelper } from './shared/helpers/LocalizedResourcesHelper';
import { UrlHelper } from './shared/helpers/UrlHelper';
import { environment } from './environments/environment';

export class AppPreBootstrap {
    static run(appRootUrl: string, callback: () => void, resolve: any, reject: any, router: Router): void {
        let abpAjax: any = abp.ajax;
        if (abpAjax.defaultError) {
            abpAjax.defaultError.details = AppConsts.defaultErrorMessage;
        }

        let _handleUnAuthorizedRequest = abpAjax['handleUnAuthorizedRequest'];
        abpAjax['handleUnAuthorizedRequest'] = (messagePromise: any, targetUrl?: string) => {
            if (!targetUrl || targetUrl == '/')
                targetUrl = location.origin;
            _handleUnAuthorizedRequest.call(abpAjax, messagePromise, targetUrl);
        };

        AppPreBootstrap.getApplicationConfig(appRootUrl, () => {
            const queryStringObj = UrlHelper.getQueryParameters();
            if (queryStringObj.redirect && queryStringObj.redirect === 'TenantRegistration') {
                if (queryStringObj.forceNewRegistration) {
                    new AppAuthService(null).logout();
                }

                router.navigate(['app/account/select-edition']);
                callback();
            } else if (queryStringObj.secureId) {
                AppPreBootstrap.impersonatedAuthenticate(queryStringObj, router, callback);
            } else if (queryStringObj.switchAccountToken) {
                AppPreBootstrap.linkedAccountAuthenticate(queryStringObj.switchAccountToken, queryStringObj.tenantId,
                    () => AppPreBootstrap.processRegularBootstrap(queryStringObj, callback), router);
            } else
                AppPreBootstrap.processRegularBootstrap(queryStringObj, callback);
        });
    }

    static bootstrap<TM>(moduleType: Type<TM>, compilerOptions?: CompilerOptions | CompilerOptions[]): Promise<NgModuleRef<TM>> {
        return platformBrowserDynamic().bootstrapModule(moduleType, compilerOptions);
    }

    private static processRegularBootstrap(queryStringObj, callback) {
        if (queryStringObj.hasOwnProperty('tenantId'))
            abp.multiTenancy.setTenantIdCookie(queryStringObj.tenantId);

        AppPreBootstrap.getUserConfiguration(callback);
    }

    private static updateAppConsts(appConfig) {
        AppConsts.appBaseUrlFormat = environment.appBaseUrl;
        AppConsts.remoteServiceBaseUrlFormat = appConfig.remoteServiceBaseUrl;
        AppConsts.recaptchaSiteKey = appConfig.recaptchaSiteKey;
        AppConsts.googleSheetClientId = appConfig.googleSheetClientId;
        AppConsts.subscriptionExpireNootifyDayCount = appConfig.subscriptionExpireNootifyDayCount;
        AppConsts.appBaseUrl = window.location.protocol + '//' + window.location.host;
        AppConsts.remoteServiceBaseUrl = appConfig.enforceRemoteServiceBaseUrl
            ? appConfig.remoteServiceBaseUrl : location.origin;
    }

    private static getApplicationConfig(appRootUrl: string, callback: () => void) {
        if (window['appconfig']) {
            AppPreBootstrap.updateAppConsts(window['appconfig']);
            callback();
        } else
            return $.ajax({
                url: appRootUrl + 'assets/' + environment.appConfig,
                method: 'GET',
                dataType: 'json'
            }).done(result => {
                AppPreBootstrap.updateAppConsts(result);
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

    private static impersonatedAuthenticate(queryStringObj: any, router: Router, callback: Function): JQueryPromise<any> {
        abp.auth.clearToken();
        abp.multiTenancy.setTenantIdCookie(queryStringObj.tenantId);

        const cookieLangValue = abp.utils.getCookieValue('Abp.Localization.CultureName');
        let requestHeaders = {
            'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
        };

        if (cookieLangValue) {
            requestHeaders['.AspNetCore.Culture'] = 'c=' + cookieLangValue + '|uic=' + cookieLangValue;
        }

        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/ImpersonatedAuthenticate?secureId=' + queryStringObj.secureId,
            method: 'POST',
            headers: requestHeaders,
            abpHandleError: false
        }).done(result => {
            abp.auth.setToken(result.accessToken);
            AppPreBootstrap.setEncryptedTokenCookie(result.encryptedAccessToken);
            abp.multiTenancy.setTenantIdCookie();
            if (result.shouldResetPassword) {
                let params = {
                    resetCode: result.passwordResetCode,
                    userId: result.userId
                };
                if (queryStringObj.tenantId)
                    params['tenantId'] = queryStringObj.tenantId;
                router.navigate(['app/account/reset-password'], { queryParams: params });
                callback();
            } else
                AppPreBootstrap.processRegularBootstrap(queryStringObj, () => {
                    router.navigate([location.pathname]);
                    callback();
                });
        }).fail(() => {
            abp.multiTenancy.setTenantIdCookie();
            router.navigate(['app']);
            callback();
        });
    }

    private static linkedAccountAuthenticate(switchAccountToken: string, tenantId: number, callback: () => void, router: Router): JQueryPromise<any> {
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
            router.navigate([location.pathname]);
            callback();
        });
    }

    static getUserConfiguration(callback: () => void, loadThemeResources: boolean = true) {
        let generalInfo = window['generalInfo'];
        if (generalInfo && generalInfo.userConfig) {
            this.handleGetAll(generalInfo.userConfig, callback, loadThemeResources);
        } else {
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

            abp.ajax({
                url: AppConsts.remoteServiceBaseUrl + '/AbpUserConfiguration/GetAll',
                method: 'GET',
                headers: requestHeaders
            }).done(result => {
                this.handleGetAll(result, callback, loadThemeResources);
            });
        }
    }

    private static handleGetAll(result, callback: () => void, loadThemeResources: boolean = true) {
        $.extend(true, abp, result);
        abp.clock.provider = this.getCurrentClockProvider(result.clock.provider);

        if (abp.clock.provider.supportsMultipleTimezone && moment)
            moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);

        abp.event.trigger('abp.dynamicScriptsInitialized');

        AppConsts.recaptchaSiteKey = abp.setting.get('Recaptcha.SiteKey');
        AppConsts.subscriptionExpireNootifyDayCount = parseInt(abp.setting.get('App.TenantManagement.SubscriptionExpireNotifyDayCount'));

        loadThemeResources ? LocalizedResourcesHelper.loadResources(callback) : callback();
    }

    private static setEncryptedTokenCookie(encryptedToken: string) {
        new UtilsService().setCookieValue(AppConsts.authorization.encrptedAuthTokenName,
            encryptedToken,
            new Date(new Date().getTime() + 365 * 86400000), //1 year
            abp.appPath
        );
    }
}
