import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Injectable()
export class ProfileService {
    constructor(private appSession: AppSessionService) {}

    getPhoto(photo, gender = null): string {
        if (photo)
            return 'data:image/jpeg;base64,' + photo;
        if (gender)
            return 'assets/common/images/no-photo-' + gender + '.png';

        const tenant = this.appSession.tenant;
        return tenant.customLayoutType === LayoutType.AdvicePeriod
            ? AppConsts.imageUrls.noPhotoAdvicePeriod
            : AppConsts.imageUrls.noPhoto;
    }

    getProfilePictureUrl(id, defaultUrl = AppConsts.imageUrls.profileDefault) {
        if (!id) {
            let tenant = this.appSession.tenant;
            return tenant && [LayoutType.LendSpace, LayoutType.AdvicePeriod].indexOf(tenant.customLayoutType) >= 0
                ? AppConsts.imageUrls.profileLendSpace
                : defaultUrl;
        }

        let tenantId = this.appSession.tenantId;
        return AppConsts.remoteServiceBaseUrl + '/api/Profile/Picture/' + (tenantId || 0) + '/' + id;
    }

    getContactPhotoUrl(publicId, isThumbnail = true): string {
        if (publicId) {
            let actionName = isThumbnail ? 'thumbnail' : 'photo';
            let tenantId = this.appSession.tenantId || 0;
            return AppConsts.remoteServiceBaseUrl + '/api/contact/' + actionName + '/' + tenantId + '/' + publicId;
        }

        return AppConsts.imageUrls.noPhoto;
    }
}