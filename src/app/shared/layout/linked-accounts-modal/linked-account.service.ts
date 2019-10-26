import { Injectable } from '@angular/core';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { AccountServiceProxy, SwitchToLinkedAccountInput, SwitchToLinkedAccountOutput } from '@shared/service-proxies/service-proxies';

@Injectable()
export class LinkedAccountService {

    constructor(
        private accountService: AccountServiceProxy,
        private appUrlService: AppUrlService,
        private authService: AppAuthService
    ) {}

    switchToAccount(userId: number, tenantId?: number): void {

        const input = new SwitchToLinkedAccountInput();
        input.targetUserId = userId;
        input.targetTenantId = tenantId;

        this.accountService.switchToLinkedAccount(input)
            .subscribe((result: SwitchToLinkedAccountOutput) => {
                this.authService.logout(false);
                let targetUrl = this.appUrlService.getAppRootUrlOfTenant(result.tenancyName) + '?switchAccountToken=' + result.switchAccountToken;
                if (input.targetTenantId) {
                    targetUrl = targetUrl + '&tenantId=' + input.targetTenantId;
                }
                location.href = targetUrl;
            });
    }
}
