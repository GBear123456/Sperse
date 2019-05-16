import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { TenantLoginInfoDtoCustomLayoutType } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Injectable()
export class ProfileService {
    constructor(private appSession: AppSessionService) {}

    getProfilePictureUrl(id, defaultUrl = AppConsts.imageUrls.profileDefault) {
        let tenant = this.appSession.tenant;
        if (!id)
            return tenant && [TenantLoginInfoDtoCustomLayoutType.LendSpace,
                TenantLoginInfoDtoCustomLayoutType.CFOMembers].indexOf(tenant.customLayoutType) >= 0
                ? AppConsts.imageUrls.profileLendSpace : defaultUrl;

        let tenantId = this.appSession.tenantId;
        return AppConsts.remoteServiceBaseUrl + '/api/Profile/Picture/' + (tenantId || 0) + '/' + id;
    }
}
