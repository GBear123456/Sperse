import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Injectable()
export class AppAuthService implements OnDestroy {
    private tokenCheckTimeout: any;
    private tokenCheckBusy: boolean = false;

    constructor(
        private _appLocalizationService: AppLocalizationService,
        private _ngZone: NgZone = null,
    ) {
        this.startTokenCheck();
    }

    logout(reload?: boolean, returnUrl?: string): void {
        if (this.tokenCheckBusy) {
            setTimeout(() => this.logout(reload, returnUrl), 500);
            return;
        }
        this.stopTokenCheck();
        abp.auth.clearToken();
        if (reload !== false) {
            if (returnUrl) {
                location.href = returnUrl;
            } else {
                location.href = AppConsts.appBaseUrl;
            }
        }
    }

    setCheckDomainToken() { //!!VP this necessary to provide login from top domain level
        const authDataKey = 'AuthData';
        document.cookie.split(';').some((data) => {
            let parts = data.split('=');
            if ((parts[0].trim() == authDataKey) && parts[1]) {
                let authData = JSON.parse(parts[1]);
                this.setLoginCookies(
                    authData.accessToken,
                    authData.encryptedAccessToken,
                    authData.expireInSeconds,
                    authData.rememberClient,
                    authData.twoFactorRememberClientToken,
                    authData.returnUrl
                );
                document.cookie = authDataKey + '=; domain=' + 
                    location.origin.split('.').slice(-2).join('.');

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
            this._ngZone.runOutsideAngular(() => {
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
            if (this._appLocalizationService)
                warningMessage = this._appLocalizationService.ls(AppConsts.localization.defaultLocalizationSourceName, 'UserHasChangedWarning');
            abp.message.warn(warningMessage).done(() => location.reload());
        } else {
            this.tokenCheckTimeout = setTimeout(() => this.checkAuthToken(initialToken), 3000);
        }
        this.tokenCheckBusy = false;
    }
}
