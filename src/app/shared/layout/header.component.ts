/** Core imports */
import { Component, Injector, OnInit } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { filter, map } from 'rxjs/operators';
import * as _ from 'lodash';

/** Application imports */
import { AbpSessionService } from '@abp/session/abp-session.service';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { LinkedAccountService } from '@app/shared/layout/linked-account.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ChangeUserLanguageDto, LinkedUserDto, ProfileServiceProxy, TenantLoginInfoDtoCustomLayoutType,
    TenantLoginInfoDto, UserLinkServiceProxy, UpdateProfilePictureInput, CommonUserInfoServiceProxy
} from '@shared/service-proxies/service-proxies';
import { LayoutService } from '@app/shared/layout/layout.service';
import { UserHelper } from '../helpers/UserHelper';
import { LinkedAccountsModalComponent } from './linked-accounts-modal.component';
import { LoginAttemptsModalComponent } from './login-attempts-modal.component';
import { ChangePasswordModalComponent } from './profile/change-password-modal.component';
import { MySettingsModalComponent } from './profile/my-settings-modal.component';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { StringHelper } from '@shared/helpers/StringHelper';
import { Observable } from 'rxjs';
import { isEqual } from 'lodash';

@Component({
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.less'],
    selector: 'app-header',
    providers: [CommonUserInfoServiceProxy]
})
export class HeaderComponent extends AppComponentBase implements OnInit {

    customLayoutType = '';
    languages: abp.localization.ILanguageInfo[];
    currentLanguage: abp.localization.ILanguageInfo;
    isImpersonatedLogin = false;
    shownLoginNameTitle = '';
    shownLoginInfo: { fullName, email, tenantName?};
    userCompany$: Observable<string>;

    helpLink = location.protocol + '//' + abp.setting.values['Integrations:Zendesk:AccountUrl'];
    tenancyName = '';
    userName = '';
    profileThumbnailId: string;
    recentlyLinkedUsers: LinkedUserDto[];
    unreadChatMessageCount = 0;
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    chatConnected = false;
    tenant: TenantLoginInfoDto = new TenantLoginInfoDto();

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private _abpSessionService: AbpSessionService,
        private _profileServiceProxy: ProfileServiceProxy,
        private _userLinkServiceProxy: UserLinkServiceProxy,
        private _authService: AppAuthService,
        private _impersonationService: ImpersonationService,
        private _linkedAccountService: LinkedAccountService,
        public _layoutService: LayoutService,
        private _commonUserInfoService:  CommonUserInfoServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.languages = _.filter(this.localization.languages, l => (<any>l).isDisabled === false);
        this.currentLanguage = this.localization.currentLanguage;
        this.isImpersonatedLogin = this._abpSessionService.impersonatorUserId > 0;


        let tenant = this.appSession.tenant;
        if (tenant && tenant.customLayoutType && tenant.customLayoutType != TenantLoginInfoDtoCustomLayoutType.Default)
            this.customLayoutType = _.kebabCase(tenant.customLayoutType);
        this.shownLoginNameTitle = this.isImpersonatedLogin ? this.l('YouCanBackToYourAccount') : '';
        this.getCurrentLoginInformations();
        this.getRecentlyLinkedUsers();
        this.userCompany$ = this._commonUserInfoService.getCompany().pipe(map(x => isEqual(x, {}) ? null : x));

        this.registerToEvents();
    }

    registerToEvents() {
        abp.event.on('profilePictureChanged', (thumbnailId) => {
            this.profileThumbnailId = thumbnailId;
        });

        abp.event.on('app.chat.unreadMessageCountChanged', messageCount => {
            this.unreadChatMessageCount = messageCount;
        });

        abp.event.on('app.chat.connected', () => {
            this.chatConnected = true;
        });
    }

    changeLanguage(languageName: string): void {
        const input = new ChangeUserLanguageDto();
        input.languageName = languageName;

        this._profileServiceProxy.changeLanguage(input).subscribe(() => {
            abp.utils.setCookieValue(
                'Abp.Localization.CultureName',
                languageName,
                new Date(new Date().getTime() + 5 * 365 * 86400000), //5 year
                abp.appPath
            );

            window.location.reload();
        });
    }

    getCurrentLoginInformations(): void {
        this.shownLoginInfo = this.appSession.getShownLoginInfo();
        this.tenant = this.appSession.tenant;
        this.profileThumbnailId = this.appSession.user.profileThumbnailId;
    }

    getShownUserName(linkedUser: LinkedUserDto): string {
        return UserHelper.getShownUserName(linkedUser.username, linkedUser.tenantId, linkedUser.tenancyName);
    }

    getRecentlyLinkedUsers(): void {
        this._userLinkServiceProxy.getRecentlyUsedLinkedUsers().subscribe(result => {
            this.recentlyLinkedUsers = result.items;
        });
    }

    showLoginAttempts(e): void {
        this.dialog.open(LoginAttemptsModalComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    showLinkedAccounts(e): void {
        this.dialog.open(LinkedAccountsModalComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    changePassword(e): void {
        this.dialog.open(ChangePasswordModalComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    changeProfilePicture(e): void {
        this.dialog.open(UploadPhotoDialogComponent, {
            data: {
                source: this.getProfilePictureUrl(this.appSession.user.profilePictureId),
                maxSizeBytes: AppConsts.maxImageSize
            },
            hasBackdrop: true
        }).afterClosed()
            .pipe(filter(result => result))
            .subscribe((result) => {
                const base64OrigImage = StringHelper.getBase64(result.origImage),
                    base64ThumbImage = StringHelper.getBase64(result.thumImage);
                this._profileServiceProxy.updateProfilePicture(UpdateProfilePictureInput.fromJS({
                    originalImage: base64OrigImage,
                    thumbnail: base64ThumbImage
                })).subscribe(res => {
                    this.appSession.user.profilePictureId = res;
                    abp.event.trigger('profilePictureChanged', res);
                });
            });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    changeMySettings(e): void {
        this.dialog.open(MySettingsModalComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    logout(): void {
        this._authService.logout(true, this.feature.isEnabled('PFM.Applications') ? location.origin + '/personal-finance' : undefined);
    }

    backToMyAccount(): void {
        this._impersonationService.backToImpersonator();
    }

    switchToLinkedUser(linkedUser: LinkedUserDto): void {
        this._linkedAccountService.switchToAccount(linkedUser.id, linkedUser.tenantId);
    }

    get chatEnabled(): boolean {
        return (!this._abpSessionService.tenantId || this.feature.isEnabled('App.ChatFeature'));
    }

    get notificationEnabled(): boolean {
        return (!this._abpSessionService.tenantId || this.feature.isEnabled('Notification'));
    }
}
