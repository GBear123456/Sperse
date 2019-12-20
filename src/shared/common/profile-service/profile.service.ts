import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import {
    GetMemberInfoOutput,
    SubscriptionShortInfoOutput,
    LayoutType,
    MemberSubscriptionServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { Observable } from '@node_modules/rxjs';
import { map, publishReplay, refCount } from '@node_modules/rxjs/internal/operators';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import * as moment from 'moment-timezone';

@Injectable()
export class ProfileService {

    public bankCodeSubscriptions$: Observable<GetMemberInfoOutput> = this.subscriptionProxy.getMemberInfo('BankCode', undefined, undefined).pipe(
        /** For debug purpose */
        // map(() => [ new GetUserSubscriptionsOutput({
        //     serviceType: BankCodeServiceType.BANKVault,
        //     serviceTypeId: BankCodeServiceType.BANKVault,
        //     serviceName: null,
        //     serviceId: null,
        //     endDate: moment('2031-12-15T10:10:09Z')
        // }) ]),
        publishReplay(),
        refCount()
    );
    constructor(
        private appSession: AppSessionService,
        private subscriptionProxy: MemberSubscriptionServiceProxy
    ) {}

    getPhoto(photo, gender = null): string {
        if (photo)
            return 'data:image/jpeg;base64,' + photo;
        if (gender)
            return 'assets/common/images/no-photo-' + gender + '.png';

        const tenant = this.appSession.tenant;
        return tenant && tenant.customLayoutType === LayoutType.AdvicePeriod
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

    checkServiceSubscription(serviceTypeId: BankCodeServiceType): Observable<boolean> {
        return this.bankCodeSubscriptions$.pipe(
            map((subscriptions: GetMemberInfoOutput) => {
                return subscriptions.subscriptions.some((sub: SubscriptionShortInfoOutput) => {
                    return sub.serviceTypeId == serviceTypeId && sub.endDate.diff(moment()) > 0;
                });
            })
        );
    }
}
