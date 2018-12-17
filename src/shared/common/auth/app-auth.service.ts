import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';


@Injectable()
export class AppAuthService implements OnDestroy {
    private tokenCheckTimeout: any;

    constructor(
        private _appLocalizationService: AppLocalizationService,
        private _ngZone: NgZone = null,
    ) {
        this.startTokenCheck();
    }

    logout(reload?: boolean, returnUrl?: string): void {
        this.stopTokenCheck();
        this.clearToken();
        if (reload !== false) {
            if (returnUrl) {
                location.href = returnUrl;
            } else {
                location.href = AppConsts.appBaseUrl;
            }
        }
    }

    clearToken() {
        abp.auth.clearToken(); //!!VP Clear token in current (app) domain
        abp['domain'] = location.origin.split('.').slice(-2).join('.');
        abp.auth.clearToken(); //!!VP Clear token on top level domain
        delete abp['domain'];
    }

    startTokenCheck() {
        clearTimeout(this.tokenCheckTimeout);
        let currentToken = abp.auth.getToken();
        if (currentToken)
            this._ngZone.runOutsideAngular(() => {
                setTimeout(() => this.checkAuthToken(currentToken), 3000);
            });
    }

    stopTokenCheck() {
        clearTimeout(this.tokenCheckTimeout);
    }

    ngOnDestroy(): void {
        this.stopTokenCheck();
    }

    private checkAuthToken(initialToken) {
        let currentToken = abp.auth.getToken();

        if (initialToken != currentToken) {
            let warningMessage = 'Current user has changed. Page should be reloaded.';
            if (this._appLocalizationService)
                warningMessage = this._appLocalizationService.ls(AppConsts.localization.defaultLocalizationSourceName, 'UserHasChangedWarning');
            abp.message.warn(warningMessage).done(() => location.reload());
        } else {
            this.tokenCheckTimeout = setTimeout(() => this.checkAuthToken(initialToken), 3000);
        }
    }
}
