import { Injectable } from '@angular/core';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { AccountServiceProxy, ImpersonateInput, ImpersonateOutput } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class ImpersonationService {

    constructor(
        private accountService: AccountServiceProxy,
        private appUrlService: AppUrlService,
        private authService: AppAuthService
    ) {}

    impersonate(userId: number, tenantId?: number): void {

        const input = new ImpersonateInput();
        input.userId = userId;
        input.tenantId = tenantId;

        this.accountService.impersonate(input)
            .subscribe((result: ImpersonateOutput) => {
                this.authService.logout(false);

                let targetUrl = AppConsts.appBaseUrl + '?secureId=' + result.impersonationToken;
                if (input.tenantId) {
                    targetUrl = targetUrl + '&tenantId=' + input.tenantId;
                }

                location.href = targetUrl;
            });
    }

    impersonateAsAdmin(tenantId?: number): void {
        this.accountService.impersonateAsAdmin(tenantId)
            .subscribe((result: ImpersonateOutput) => {
                this.authService.logout(false);

                let targetUrl = AppConsts.appBaseUrl + '?secureId=' + result.impersonationToken;
                if (tenantId) {
                    targetUrl = targetUrl + '&tenantId=' + tenantId;
                }

                location.href = targetUrl;
            });
    }

    backToImpersonator(): void {
        this.accountService.backToImpersonator()
            .subscribe((result: ImpersonateOutput) => {
                this.authService.logout(false);

                let targetUrl = AppConsts.appBaseUrl + '?secureId=' + result.impersonationToken;
                if (abp.session.impersonatorTenantId) {
                    targetUrl = targetUrl + '&tenantId=' + abp.session.impersonatorTenantId;
                }

                location.href = targetUrl;
            });
    }
}
