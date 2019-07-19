import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Injectable()
export class ProfileService {
    constructor(private appSession: AppSessionService) {}

    getProfilePictureUrl(id, defaultUrl = AppConsts.imageUrls.profileDefault) {
        let tenant = this.appSession.tenant;
        if (!id)
            return tenant && [LayoutType.LendSpace,
                LayoutType.AdvicePeriod].indexOf(tenant.customLayoutType) >= 0
                ? AppConsts.imageUrls.profileLendSpace : defaultUrl;

        let tenantId = this.appSession.tenantId;
        return AppConsts.remoteServiceBaseUrl + '/api/Profile/Picture/' + (tenantId || 0) + '/' + id;
    }
}
