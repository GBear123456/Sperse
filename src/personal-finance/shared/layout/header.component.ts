import { Component, OnInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { UserHelper } from '@app/shared/helpers/UserHelper';
import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import {
    ProfileServiceProxy,
    UserLinkServiceProxy,
    UserServiceProxy,
    LinkedUserDto,
    ChangeUserLanguageDto,
    TenantLoginInfoDto,
    SessionServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';

import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';

import { LoginAttemptsModalComponent } from '@app/shared/layout/login-attempts-modal.component';
import { LinkedAccountsModalComponent } from '@app/shared/layout/linked-accounts-modal.component';
import { ChangePasswordModalComponent } from '@app/shared/layout/profile/change-password-modal.component';
import { ChangeProfilePictureModalComponent } from '@app/shared/layout/profile/change-profile-picture-modal.component';
import { MySettingsModalComponent } from '@app/shared/layout/profile/my-settings-modal.component';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { LinkedAccountService } from '@app/shared/layout/linked-account.service';
import { UserNotificationHelper } from '@app/shared/layout/notifications/UserNotificationHelper';
import { AppConsts } from '@shared/AppConsts';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material';

@Component({
    templateUrl: 'header.component.html',
    styleUrls: ['header.component.less'],
    selector: 'header',
    encapsulation: ViewEncapsulation.None,
    providers: [ImpersonationService]
})
export class HeaderComponent extends AppComponentBase implements OnInit {
    @ViewChild('loginAttemptsModal') loginAttemptsModal: LoginAttemptsModalComponent;
    @ViewChild('linkedAccountsModal') linkedAccountsModal: LinkedAccountsModalComponent;
    @ViewChild('changeProfilePictureModal') changeProfilePictureModal: ChangeProfilePictureModalComponent;

    languages: abp.localization.ILanguageInfo[];
    currentLanguage: abp.localization.ILanguageInfo;
    isImpersonatedLogin = false;
    hasPlatformPermissions = false;

    shownLoginNameTitle = '';
    shownLoginInfo: { fullName, email, tenantName?};
    profileThumbnailId: string;
    recentlyLinkedUsers: LinkedUserDto[];
    unreadChatMessageCount = 0;

    helpLink: string = AppConsts.helpLink;
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;

    chatConnected = false;

    tenant: TenantLoginInfoDto = new TenantLoginInfoDto();

    memberAreaLinks = [
        {
            name: 'creditReportLink',
            imgUrl: 'assets/images/icons/credit-report-icon.svg',
            activeImgUrl: 'assets/images/icons/credit-report-active-icon.svg',
            routerUrl: '/personal-finance/member-area'
        },
        {
            name: 'creditSimulatorLink',
            imgUrl: 'assets/images/icons/credit-simulator-icon.svg',
            activeImgUrl: 'assets/images/icons/credit-simulator-active-icon.svg',
            routerUrl: '/personal-finance/member-area/credit-simulator'
        },
        {
            name: 'creditResources',
            imgUrl: 'assets/images/icons/credit-resources-icon.svg',
            activeImgUrl: 'assets/images/icons/credit-resources-active-icon.svg',
            routerUrl: '/personal-finance/member-area/credit-resources'
        }
    ];
    imgList = [
        {img: 'daily-reports-icon.svg', text: 'CreditMonitorAlerts'},
        {img: 'interactive-tools-icon.svg', text: 'EducationalResources'},
        {img: 'TUmonitoring-icon.svg', text: 'TransUnionMonitoring'}
    ];

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _abpSessionService: AbpSessionService,
        private _abpMultiTenancyService: AbpMultiTenancyService,
        private _profileServiceProxy: ProfileServiceProxy,
        private _userLinkServiceProxy: UserLinkServiceProxy,
        private _userServiceProxy: UserServiceProxy,
        private _authService: AppAuthService,
        private _impersonationService: ImpersonationService,
        private _linkedAccountService: LinkedAccountService,
        private _userNotificationHelper: UserNotificationHelper,
        private _sessionService: SessionServiceProxy,
        private _appSessionService: AppSessionService,
        private _featureChecker: FeatureCheckerService,
        private _permissionChecker: PermissionCheckerService
    ) {
        super(injector);

        if (_featureChecker.isEnabled('CFO.Partner')) {
            this.memberAreaLinks.unshift(
                {
                    name: 'accountsLink',
                    imgUrl: 'assets/images/icons/credit-report-icon.svg',
                    activeImgUrl: 'assets/images/icons/credit-report-active-icon.svg',
                    routerUrl: '/personal-finance/member-area/accounts'
                });
        }

        this.hasPlatformPermissions =
            (this._featureChecker.isEnabled('CFO') && this._permissionChecker.isGranted('Pages.CFO')) ||
            (this._featureChecker.isEnabled('CRM') && this._permissionChecker.isGranted('Pages.CRM')) ||
            (this._featureChecker.isEnabled('Admin') && this._permissionChecker.isGranted('Pages.Administration.Users'));
    }
    get multiTenancySideIsTenant(): boolean {
        return this._abpSessionService.tenantId > 0;
    }

    ngOnInit() {
        this.languages = _.filter(this.localization.languages, l => (<any>l).isDisabled == false);
        this.currentLanguage = this.localization.currentLanguage;
        this.isImpersonatedLogin = this._abpSessionService.impersonatorUserId > 0;

        this.shownLoginNameTitle = this.isImpersonatedLogin ? this.l('YouCanBackToYourAccount') : '';
        this.getCurrentLoginInformations();
        this.getRecentlyLinkedUsers();

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

    showLoginAttempts(): void {
        this.loginAttemptsModal.show();
    }

    showLinkedAccounts(): void {
        this.linkedAccountsModal.show();
    }

    changePassword(): void {
        this.dialog.open(ChangePasswordModalComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        });
    }

    changeProfilePicture(): void {
        this.changeProfilePictureModal.show();
    }

    changeMySettings(): void {
        this.dialog.open(MySettingsModalComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        });
    }

    logout(): void {
        this._authService.logout();
    }

    onMySettingsModalSaved(): void {
        this.shownLoginInfo = this.appSession.getShownLoginInfo();
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

    subscriptionStatusBarVisible(): boolean {
        return false;
        //return this._appSessionService.tenantId > 0 && (this._appSessionService.tenant.isInTrialPeriod || this.subscriptionIsExpiringSoon());
    }

    subscriptionIsExpiringSoon(): boolean {
        return false;
    }

    getSubscriptionExpiringDayCount(): number {
        return 0;
    }

    getExpireNotification(localizationKey: string): string {
        return abp.utils.formatString(this.l(localizationKey), this.getSubscriptionExpiringDayCount());
    }
}
