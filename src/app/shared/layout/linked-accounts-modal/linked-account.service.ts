import { Injectable } from '@angular/core';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AccountServiceProxy, SwitchToLinkedAccountInput, SwitchToLinkedAccountOutput } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class LinkedAccountService {

    constructor(
        private accountService: AccountServiceProxy,
        private appUrlService: AppUrlService,
        private appSession: AppSessionService,
        private authService: AppAuthService
    ) {}

    switchToAccount(userId: number, tenantId?: number): void {

        const input = new SwitchToLinkedAccountInput();
        input.targetUserId = userId;
        input.targetTenantId = tenantId;

        this.accountService.switchToLinkedAccount(input)
            .subscribe((result: SwitchToLinkedAccountOutput) => {
                this.authService.logout(false);
                let baseUrl = tenantId != this.appSession.tenantId ?
                    AppConsts.appConfigOrigin.remoteServiceBaseUrl :
                    this.appUrlService.getAppRootUrlOfTenant(result.tenancyName);
                location.href = baseUrl + '?switchAccountToken=' + result.switchAccountToken +
                    (tenantId ? '&tenantId=' + tenantId : '');
            });
    }
}
