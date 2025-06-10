import { Injectable } from '@angular/core';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { AccountServiceProxy, ImpersonateInput, ImpersonateOutput } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class ImpersonationService {

    constructor(
        private notifyService: NotifyService,
        private accountService: AccountServiceProxy,
        private appUrlService: AppUrlService,
        private ls: AppLocalizationService,
        private authService: AppAuthService
    ) {}

    impersonate(userId: number, tenantId?: number, path?: string): void {

        const input = new ImpersonateInput();
        input.userId = userId;
        input.tenantId = tenantId;

        this.accountService.impersonate(input)
            .subscribe((result: ImpersonateOutput) => {
                let isExternalLogin = path && path.startsWith('http') &&
                    !this.authService.checkCurrentTopDomainByUri(path);
                if (!isExternalLogin)
                    this.authService.logout(false);

                let targetUrl = (path && path.startsWith('http') ? '' : AppConsts.appBaseUrl) +
                    (path ? path : '') + '?secureId=' + result.impersonationToken;
                if (input.tenantId) {
                    targetUrl = targetUrl + '&tenantId=' + input.tenantId;
                }

                if (isExternalLogin) {
                    if (!window.open(targetUrl, '_blank'))
                        this.notifyService.info(this.ls.l('TurnOffPopupBlockerMessage'));
                } else
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
