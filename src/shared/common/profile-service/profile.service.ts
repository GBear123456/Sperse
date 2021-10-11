/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { delay, distinctUntilChanged, map, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';
import * as moment from 'moment-timezone';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import {
    UpdateUserAffiliateCodeDto,
    GetMemberInfoOutput,
    SubscriptionShortInfoOutput,
    LayoutType,
    MemberSubscriptionServiceProxy,
    MemberSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { environment } from '@root/environments/environment';

@Injectable()
export class ProfileService {
    private loadMemberInfo: Subject<null> = new Subject<null>();
    public bankCodeMemberInfo$: Observable<GetMemberInfoOutput> =
        this.loadMemberInfo.pipe(
            delay(3000),
            startWith(null),
            switchMap(() => this.subscriptionProxy.getMemberInfo(
                'General',
                undefined,
                undefined
            )),
            publishReplay(),
            refCount()
        );
    secureId$: Observable<string> = this.bankCodeMemberInfo$.pipe(
        map((bankCodeMemberInfo: GetMemberInfoOutput) => bankCodeMemberInfo.userKey),
        distinctUntilChanged()
    );
    private accessCode: BehaviorSubject<string> = new BehaviorSubject<string>(this.appSession.user ? this.appSession.user.affiliateCode : null);
    accessCode$: Observable<string> = this.accessCode.asObservable();
    trackingLink$: Observable<string> = this.accessCode$.pipe(
        map((accessCode: string) => {
            return (environment.releaseStage === 'production'
                ? (location.href.indexOf('successfactory.com') >= 0
                    ? 'https://sf.crackmycode.com'
                    : 'https://crackmycode.com')
                : 'https://bankpass.bankcode.pro'
            ) + ( accessCode ? '/' + accessCode : '');
        })
    );
    defaultPhotos = {
        [LayoutType.AdvicePeriod]: AppConsts.imageUrls.noPhotoAdvicePeriod,
        [LayoutType.BankCode]: AppConsts.imageUrls.noPhotoBankCode
    };
    defaultProfilePictures = {
        [LayoutType.AdvicePeriod]: AppConsts.imageUrls.profileLendSpace,
        [LayoutType.BankCode]: AppConsts.imageUrls.noPhotoBankCode3x,
        [LayoutType.LendSpace]: AppConsts.imageUrls.profileLendSpace
    };
    defaultContactPhotos = {
        [LayoutType.BankCode]: {
            'small': AppConsts.imageUrls.noPhotoBankCode,
            'large': AppConsts.imageUrls.noPhotoBankCode3x
        }
    };

    get isWhiteLabel(): boolean {
        return this.appSession.tenant ? this.appSession.tenant.isWhiteLabel : false;
    }

    get isAscira(): boolean {
        return this.appSession.tenant.name.toUpperCase() == 'ASCIRA';
    }

    constructor(
        private appSession: AppSessionService,
        private subscriptionProxy: MemberSubscriptionServiceProxy,
        private memberSettingsService: MemberSettingsServiceProxy,
        private ls: AppLocalizationService
    ) {
        const eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
        const messageEvent = window[eventMethod] === 'attachEvent' ? 'onmessage' : 'message';
        window.addEventListener(messageEvent, this.refreshMemberInfo.bind(this), false);
    }

    refreshMemberInfo(e) {
        if (e.data === 'update') {
            this.loadMemberInfo.next();
        }
    }

    getPhoto(photo, gender = null): string {
        if (photo)
            return 'data:image/jpeg;base64,' + photo;
        if (gender)
            return 'assets/common/images/no-photo-' + gender + '.png';

        const tenant = this.appSession.tenant;
        return tenant && this.defaultPhotos[tenant.customLayoutType]
            ? this.defaultPhotos[tenant.customLayoutType]
            : AppConsts.imageUrls.noPhoto;
    }

    getProfilePictureUrl(id, defaultUrl = AppConsts.imageUrls.profileDefault) {
        if (!id) {
            let tenant = this.appSession.tenant;
            return tenant && this.defaultProfilePictures[tenant.customLayoutType]
                ? this.defaultProfilePictures[tenant.customLayoutType]
                : defaultUrl;
        }

        let tenantId = this.appSession.tenantId;
        return AppConsts.remoteServiceBaseUrl + '/api/Profile/Picture/' + (tenantId || 0) + '/' + id;
    }

    getContactPhotoUrl(publicId = null, isThumbnail = true, defaultPhotoSize: 'small' | 'large' = 'small'): string {
        if (publicId) {
            let actionName = isThumbnail ? 'thumbnail' : 'photo';
            let tenantId = this.appSession.tenantId || 0;
            return AppConsts.remoteServiceBaseUrl + '/api/contactPhoto/' + actionName + '/' + tenantId + '/' + publicId;
        }

        const tenant = this.appSession.tenant;
        return tenant && this.defaultContactPhotos[tenant.customLayoutType]
            ? this.defaultContactPhotos[tenant.customLayoutType][defaultPhotoSize]
            : AppConsts.imageUrls.noPhoto;
    }

    checkServiceSubscription(serviceTypeId: BankCodeServiceType): Observable<boolean> {
        return this.bankCodeMemberInfo$.pipe(
            map((memberInfo: GetMemberInfoOutput) => {
                return memberInfo.subscriptions.some((sub: SubscriptionShortInfoOutput) => {
                    return sub.serviceTypeId.toLowerCase() === serviceTypeId.toString().toLowerCase()
                        && (!sub.endDate || sub.endDate.diff(moment()) > 0);
                });
            })
        );
    }

    updateAccessCode(newAccessCode: string) {
        this.accessCode.next(newAccessCode);
        this.memberSettingsService.updateAffiliateCode(new UpdateUserAffiliateCodeDto({ affiliateCode: newAccessCode })).subscribe(
            () => {
                abp.notify.info(this.ls.l('AccessCodeUpdated'));
                this.appSession.user.affiliateCode = newAccessCode;
            },
            /** Update back if error comes */
            () => this.accessCode.next(this.appSession.user.affiliateCode)
        );
    }
}