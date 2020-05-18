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
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export class AppPreBootstrap {
    static run(appRootUrl: string, callback: (sessionCallback?) => void, resolve: any, reject: any, router: Router): void {
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

        abp.multiTenancy.setTenantIdCookie();
        AppPreBootstrap.getApplicationConfig(appRootUrl, () => {
            const queryStringObj = UrlHelper.getQueryParameters();
            if (queryStringObj.redirect && queryStringObj.redirect === 'TenantRegistration') {
                if (queryStringObj.forceNewRegistration) {
                    new AppAuthService(null).logout();
                }
                callback(() => router.navigate(['app/account/select-edition']));
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
        let tenantId = queryStringObj.tenantId;
        if (tenantId && !queryStringObj['user-key']) {
            if (tenantId != abp.session.tenantId) {
                window['generalInfo'] = undefined;
                abp.auth.clearToken();
            }
            abp.multiTenancy.setTenantIdCookie(queryStringObj.tenantId);
        }
        AppPreBootstrap.getUserConfiguration(callback, true, queryStringObj).subscribe();
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

        const cookieLangValue = abp.utils.getCookieValue('Abp.Localization.CultureName');
        let requestHeaders = {
            'Abp.TenantId': queryStringObj.tenantId
        };

        if (cookieLangValue) {
            requestHeaders['.AspNetCore.Culture'] = 'c=' + cookieLangValue + '|uic=' + cookieLangValue;
        }

        delete queryStringObj.tenantId;
        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/ImpersonatedAuthenticate?secureId=' + queryStringObj.secureId,
            method: 'POST',
            headers: requestHeaders,
            abpHandleError: false
        }).done(result => {
            abp.auth.setToken(result.accessToken);
            AppPreBootstrap.setEncryptedTokenCookie(result.encryptedAccessToken);
            abp.multiTenancy.setTenantIdCookie();
            if (result.shouldVerifyEmail && result.userEmail)
                AppPreBootstrap.processRegularBootstrap(queryStringObj, () => {
                    callback(() => router.navigate(['account/auto-login'], {queryParams: {email: result.userEmail}}));
                });
            else if (result.shouldResetPassword) {
                let params = {
                    resetCode: result.passwordResetCode,
                    userId: result.userId
                };
                if (queryStringObj.tenantId)
                    params['tenantId'] = queryStringObj.tenantId;
                AppPreBootstrap.processRegularBootstrap(queryStringObj, () => {
                    callback(() => router.navigate(['account/reset-password'], { queryParams: params }));
                });
            } else
                AppPreBootstrap.processRegularBootstrap(queryStringObj, () => {
                    callback(() => router.navigate([location.pathname]));
                });
        }).fail(() => {
            abp.multiTenancy.setTenantIdCookie();
            AppPreBootstrap.processRegularBootstrap(queryStringObj, () => {
                callback(() => router.navigate(['/']));
            });
        });
    }

    private static linkedAccountAuthenticate(switchAccountToken: string, tenantId: number, callback: (sessionCallback?) => void, router: Router): JQueryPromise<any> {
        const cookieLangValue = abp.utils.getCookieValue('Abp.Localization.CultureName');
        let requestHeaders = {
            'Abp.TenantId': tenantId
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
            callback(() => router.navigate([location.pathname]));
        });
    }

    static getUserConfiguration(callback: () => void, loadThemeResources: boolean = true, queryStringObj = null): Observable<any> {
        let generalInfo = window['generalInfo'];
        if (generalInfo && generalInfo.userConfig) {
            return this.handleGetAll(generalInfo.userConfig, callback, loadThemeResources);
        } else {
            const cookieLangValue = abp.utils.getCookieValue('Abp.Localization.CultureName');
            const token = abp.auth.getToken();

            let requestHeaders = {
                'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
            };

            if (queryStringObj && queryStringObj['user-key']) {
                requestHeaders['user-key'] = queryStringObj['user-key'];
            }

            if (cookieLangValue) {
                requestHeaders['.AspNetCore.Culture'] = 'c=' + cookieLangValue + '|uic=' + cookieLangValue;
            }

            if (token) {
                requestHeaders['Authorization'] = 'Bearer ' + token;
            }

            return from(abp.ajax({
                url: AppConsts.remoteServiceBaseUrl + '/AbpUserConfiguration/GetAll',
                method: 'GET',
                headers: requestHeaders
            })).pipe(
                switchMap(result => {
                    return this.handleGetAll(result, callback, loadThemeResources);
                })
            );
        }
    }

    private static handleGetAll(result, callback: () => void, loadThemeResources: boolean = true) {
        $.extend(true, abp, result);
        abp.clock.provider = this.getCurrentClockProvider(result.clock.provider);

        if (abp.clock.provider.supportsMultipleTimezone && moment)
            moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);

        abp.event.trigger('abp.dynamicScriptsInitialized');

        AppConsts.recaptchaSiteKey = abp.setting.get('Recaptcha.SiteKey');
        AppConsts.appMemberPortalUrl = abp.setting.get('App.MemberPortal.Url');
        AppConsts.subscriptionExpireNootifyDayCount = parseInt(abp.setting.get('App.TenantManagement.SubscriptionExpireNotifyDayCount'));

        loadThemeResources ? LocalizedResourcesHelper.loadResources(callback) : callback();
        return of(true);
    }

    private static setEncryptedTokenCookie(encryptedToken: string) {
        new UtilsService().setCookieValue(AppConsts.authorization.encrptedAuthTokenName,
            encryptedToken,
            new Date(new Date().getTime() + 365 * 86400000), //1 year
            abp.appPath
        );
    }
}
