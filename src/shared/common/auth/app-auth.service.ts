import { Injectable, OnDestroy } from '@angular/core';
import { AppConsts } from '@shared/AppConsts'

@Injectable()
export class AppAuthService implements OnDestroy {
    private tokenCheckTimeout: any;

    constructor() {
        this.startTokenCheck();
    }

    logout(reload?: boolean, returnUrl?: string): void {
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

    startTokenCheck() {
        clearTimeout(this.tokenCheckTimeout);
        let currentToken = abp.auth.getToken();
        if (currentToken)
            setTimeout(() => this.checkAuthToken(currentToken), 3000);
    }

    stopTokenCheck() {
        clearTimeout(this.tokenCheckTimeout);
    }

    ngOnDestroy(): void {
        this.stopTokenCheck();
    }

    private checkAuthToken(initialToken) {
        var currentToken = abp.auth.getToken();

        if (initialToken != currentToken) {
            abp.message.warn('Current user has changed. Page should be reloaded.', 'Warning').done(() => location.reload());
        }
        else {
            this.tokenCheckTimeout = setTimeout(() => this.checkAuthToken(initialToken), 3000);
        }
    }
}
