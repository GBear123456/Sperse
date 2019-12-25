/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';
import * as moment from 'moment-timezone';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import {
    GetMemberInfoOutput,
    SubscriptionShortInfoOutput,
    LayoutType,
    MemberSubscriptionServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';

@Injectable()
export class ProfileService {
    secureId: string;
    
    public bankCodeMemberInfo$: Observable<GetMemberInfoOutput> = this.subscriptionProxy.getMemberInfo('BankCode', undefined, undefined).pipe(
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
    secureId$: Observable<string> = this.bankCodeMemberInfo$.pipe(map((bankCodeMemberInfo: GetMemberInfoOutput) => {
        return bankCodeMemberInfo.secureId;
    }));

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
        return this.bankCodeMemberInfo$.pipe(
            map((memberInfo: GetMemberInfoOutput) => {
                return memberInfo.subscriptions.some((sub: SubscriptionShortInfoOutput) => {
                    return sub.serviceTypeId == serviceTypeId && sub.endDate.diff(moment()) > 0;
                });
            })
        );
    }
}
