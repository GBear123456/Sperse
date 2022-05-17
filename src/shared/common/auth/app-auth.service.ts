import { Injectable, Injector, OnDestroy, NgZone } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';

@Injectable()
export class AppAuthService implements OnDestroy {
    private tokenCheckTimeout: any;
    private tokenCheckBusy = false;
    private readonly REDIRECT_AUTH_DATA = 'AuthData';

    constructor(
        private injector: Injector,
        private appLocalizationService: AppLocalizationService,
        private ngZone: NgZone = null,
    ) {}

    logout(reload?: boolean, returnUrl?: string): void {
        if (this.tokenCheckBusy) {
            setTimeout(() => this.logout(reload, returnUrl), 500);
            return;
        }
        this.injector.get(TokenAuthServiceProxy).logOut().subscribe(() => {
            this.stopTokenCheck();
            abp.auth.clearToken();
            abp.multiTenancy.setTenantIdCookie();
            if (reload !== false) {
                if (returnUrl) {
                    location.href = returnUrl;
                } else {
                    location.href = AppConsts.appBaseUrl;
                }
            }
        });
    }

    getTopLevelDomain() {
        return location.origin.split('.').slice(-2).join('.');
    }

    checkCurrentTopDomainByUri(uri = AppConsts.appMemberPortalUrl) {
        return uri.includes(this.getTopLevelDomain());
    }

    setTokenBeforeRedirect() {
        let token = abp.auth.getToken();
        if (token)
            document.cookie = this.REDIRECT_AUTH_DATA + '=' + JSON.stringify({
                accessToken: token
            }) + '; path=/; domain=' + this.getTopLevelDomain();
    }

    setCheckDomainToken(): boolean { //!!VP this necessary to provide login from top domain level
        return document.cookie.split(';').some((data) => {
            let parts = data.split('=');
            if ((parts[0].trim() == this.REDIRECT_AUTH_DATA) && parts[1]) {
                let authData = JSON.parse(parts[1]);
                this.setLoginCookies(
                    authData.accessToken,
                    authData.encryptedAccessToken,
                    authData.expireInSeconds,
                    authData.rememberClient,
                    authData.twoFactorRememberClientToken,
                    authData.returnUrl
                );
                document.cookie = this.REDIRECT_AUTH_DATA + '=; path=/; domain=' + this.getTopLevelDomain();
                return true;
            }
            return false;
        });
    }

    setLoginCookies(accessToken, encryptedAccessToken, expireInSeconds, rememberMe, twoFactorRememberClientToken, redirectUrl) {
        let tokenExpireDate = rememberMe ? (new Date(new Date().getTime() + 1000 * expireInSeconds)) : undefined;

        abp.auth.setToken(
            accessToken,
            tokenExpireDate
        );

        abp.utils.setCookieValue(
            AppConsts.authorization.encrptedAuthTokenName,
            encryptedAccessToken,
            tokenExpireDate,
            abp.appPath
        );

        if (twoFactorRememberClientToken) {
            abp.utils.setCookieValue(
                'TwoFactorRememberClientToken',
                twoFactorRememberClientToken,
                new Date(new Date().getTime() + 365 * 86400000), // 1 year
                abp.appPath
            );
        }

        abp.multiTenancy.setTenantIdCookie();
    }

    startTokenCheck() {
        clearTimeout(this.tokenCheckTimeout);
        let currentToken = abp.auth.getToken();
        if (currentToken)
            this.ngZone.runOutsideAngular(() => {
                this.tokenCheckTimeout = setTimeout(() => this.checkAuthToken(currentToken), 3000);
            });
    }

    stopTokenCheck() {
        clearTimeout(this.tokenCheckTimeout);
    }

    ngOnDestroy(): void {
        this.stopTokenCheck();
    }

    private checkAuthToken(initialToken) {
        this.tokenCheckBusy = true;
        let currentToken = abp.auth.getToken();
        if (initialToken != currentToken) {
            let warningMessage = 'Current user has changed. Page should be reloaded.';
            if (this.appLocalizationService)
                warningMessage = this.appLocalizationService.ls(AppConsts.localization.defaultLocalizationSourceName, 'UserHasChangedWarning');
            abp.message.warn(warningMessage).done(() => location.reload());
        } else
            this.startTokenCheck();
        this.tokenCheckBusy = false;
    }
}