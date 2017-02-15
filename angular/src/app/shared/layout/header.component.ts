import { Component, OnInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { LocalizationService } from '@abp/localization/localization.service';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import {
    ProfileServiceProxy,
    UserLinkServiceProxy,
    UserServiceProxy,
    LinkedUserDto,
    ChangeUserLanguageDto
} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';

import { LoginAttemptsModalComponent } from './login-attempts-modal.component';
import { LinkedAccountsModalComponent } from './linked-accounts-modal.component';
import { ChangePasswordModalComponent } from './profile/change-password-modal.component';
import { ChangeProfilePictureModalComponent } from './profile/change-profile-picture-modal.component';
import { MySettingsModalComponent } from './profile/my-settings-modal.component'
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppAuthService } from '@app/shared/common/auth/app-auth.service';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { LinkedAccountService } from '@app/shared/layout/linked-account.service';
import { NotificationSettingsModalCompoent } from '@app/shared/layout/notifications/notification-settings-modal.component';
import { UserNotificationHelper } from '@app/shared/layout/notifications/UserNotificationHelper';

@Component({
    templateUrl: './header.component.html',
    selector: 'header',
    encapsulation: ViewEncapsulation.None
})
export class HeaderComponent extends AppComponentBase implements OnInit {

    @ViewChild('notificationSettingsModal') notificationSettingsModal: NotificationSettingsModalCompoent;

    @ViewChild('loginAttemptsModal') loginAttemptsModal: LoginAttemptsModalComponent;
    @ViewChild('linkedAccountsModal') linkedAccountsModal: LinkedAccountsModalComponent;
    @ViewChild('changePasswordModal') changePasswordModal: ChangePasswordModalComponent;
    @ViewChild('changeProfilePictureModal') changeProfilePictureModal: ChangeProfilePictureModalComponent;
    @ViewChild('mySettingsModal') mySettingsModal: MySettingsModalComponent;

    languages: abp.localization.ILanguageInfo[];
    currentLanguage: abp.localization.ILanguageInfo;
    isImpersonatedLogin: boolean = false;

    shownLoginNameTitle: string = "";
    shownLoginName: string = "";
    profilePicture: string = "/assets/common/images/default-profile-picture.png";
    recentlyLinkedUsers: LinkedUserDto[];
    unreadChatMessageCount = 0;

    chatConnected = false;

    constructor(
        injector: Injector,
        public appSessionService: AppSessionService,
        private sessionService: AbpSessionService,
        private abpMultiTenancyService: AbpMultiTenancyService,
        private profileServiceProxy: ProfileServiceProxy,
        private userLinkServiceProxy: UserLinkServiceProxy,
        private userServiceProxy: UserServiceProxy,
        private _authService: AppAuthService,
        private _impersonationService: ImpersonationService,
        private _linkedAccountService: LinkedAccountService,
        private _userNotificationHelper: UserNotificationHelper
    ) {
        super(injector);
    }

    ngOnInit() {
        this._userNotificationHelper.settingsModal = this.notificationSettingsModal;

        this.languages = this.localization.languages;
        this.currentLanguage = this.localization.currentLanguage;
        this.isImpersonatedLogin = this.sessionService.impersonatorUserId > 0;

        this.shownLoginNameTitle = this.isImpersonatedLogin ? this.l("YouCanBackToYourAccount") : "";
        this.getCurrentLoginInformations();
        this.getProfilePicture();
        this.getRecentlyLinkedUsers();

        this.registerToEvents();
    }

    registerToEvents() {
        abp.event.on("profilePictureChanged", () => {
            this.getProfilePicture();
        });

        abp.event.on('app.chat.unreadMessageCountChanged', messageCount => {
            this.unreadChatMessageCount = messageCount;
        });

        abp.event.on('app.chat.connected', () => {
            this.chatConnected = true;
        });
    }

    changeLanguage(languageName: string): void {
        let input = new ChangeUserLanguageDto();
        input.languageName = languageName;

        this.userServiceProxy.changeLanguage(input).subscribe(() => {
            abp.utils.setCookieValue("Abp.Localization.CultureName", languageName);
            window.location.reload();
        });
    }

    getCurrentLoginInformations(): void {
        this.shownLoginName = this.appSessionService.getShownLoginName();
    }

    getShownUserName(linkedUser: LinkedUserDto): string {
        if (!this.abpMultiTenancyService.isEnabled) {
            return linkedUser.username;
        }

        return (linkedUser.tenantId ? linkedUser.tenancyName : ".") + "\\" + linkedUser.username;
    }

    getProfilePicture(): void {
        this.profileServiceProxy.getProfilePicture().subscribe(result => {
            if (result && result.profilePicture) {
                this.profilePicture = 'data:image/jpeg;base64,' + result.profilePicture;
            }
        });
    }

    getRecentlyLinkedUsers(): void {
        this.userLinkServiceProxy.getRecentlyUsedLinkedUsers().subscribe(result => {
            this.recentlyLinkedUsers = result.items;
        });
    }

    showLoginAttempts(): void {
        this.loginAttemptsModal.show();
    }

    showLinkedAccounts(): void {
        this.linkedAccountsModal.show();
    }

    changePassword(): void {
        this.changePasswordModal.show();
    }

    changeProfilePicture(): void {
        this.changeProfilePictureModal.show();
    }

    changeMySettings(): void {
        this.mySettingsModal.show();
    }

    logout(): void {
        this._authService.logout();
    }

    onMySettingsModalSaved(): void {
        this.shownLoginName = this.appSessionService.getShownLoginName();
    }

    backToMyAccount(): void {
        this._impersonationService.backToImpersonator();
    }

    switchToLinkedUser(linkedUser: LinkedUserDto): void {
        this._linkedAccountService.switchToAccount(linkedUser.id, linkedUser.tenantId);
    }

    get chatEnabled(): boolean {
        return !this.sessionService.tenantId || this.feature.isEnabled("App.ChatFeature");
    }
}