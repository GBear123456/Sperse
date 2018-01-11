import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class AppAuthService {

    logout(reload?: boolean, returnUrl?: string): void {
        abp.auth.clearToken();
        abp.multiTenancy.setTenantIdCookie();
        if (reload !== false) {
            if (returnUrl) {
                location.href = returnUrl;
            } else {
                location.href = AppConsts.appBaseUrl;
            }
        }
    }
}
