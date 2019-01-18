/** Core imports */
import { Component, Injector, OnInit, ViewEncapsulation } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { filter, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { isEqual } from 'lodash';

/** Application imports */
import { AppConsts } from 'shared/AppConsts';
import {
    ProfileServiceProxy,
    UserLinkServiceProxy,
    UserServiceProxy,
    LinkedUserDto,
    TenantLoginInfoDto,
    SessionServiceProxy,
    CommonUserInfoServiceProxy
} from 'shared/service-proxies/service-proxies';
import { UserHelper } from 'app/shared/helpers/UserHelper';
import { AppComponentBase } from 'shared/common/app-component-base';
import { AppAuthService } from 'shared/common/auth/app-auth.service';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { AppSessionService } from 'shared/common/session/app-session.service';
import { ImpersonationService } from 'app/admin/users/impersonation.service';
import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import { LoginAttemptsModalComponent } from 'app/shared/layout/login-attempts-modal.component';
import { LinkedAccountsModalComponent } from 'app/shared/layout/linked-accounts-modal.component';
import { ChangePasswordModalComponent } from 'app/shared/layout/profile/change-password-modal.component';
import { MySettingsModalComponent } from 'app/shared/layout/profile/my-settings-modal.component';
import { LinkedAccountService } from 'app/shared/layout/linked-account.service';
import { UserNotificationHelper } from 'app/shared/layout/notifications/UserNotificationHelper';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { UpdateProfilePictureInput } from '@shared/service-proxies/service-proxies';
import { StringHelper } from '@shared/helpers/StringHelper';

@Component({
    selector: 'user-management-list',
    templateUrl: './user-management-list.component.html',
    styleUrls: ['./user-management-list.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [ImpersonationService, CommonUserInfoServiceProxy]
})
export class UserManagementListComponent extends AppComponentBase implements OnInit {
    loggedUserId: number;
    shownLoginInfo: { fullName, email, tenantName?};
    tenant: TenantLoginInfoDto = new TenantLoginInfoDto();
    isImpersonatedLogin = false;
    shownLoginNameTitle = '';
    hasPlatformPermissions = false;
    recentlyLinkedUsers: LinkedUserDto[];

    helpLink = location.protocol + '//' + abp.setting.values['Integrations:Zendesk:AccountUrl'];

    dialog: MatDialog;
    private _authService: AppAuthService;
    private _abpSessionService: AbpSessionService;
    private _abpMultiTenancyService: AbpMultiTenancyService;
    private _profileServiceProxy: ProfileServiceProxy;
    private _userLinkServiceProxy: UserLinkServiceProxy;
    private _userServiceProxy: UserServiceProxy;
    private _impersonationService: ImpersonationService;
    private _linkedAccountService: LinkedAccountService;
    private _userNotificationHelper: UserNotificationHelper;
    private _sessionService: SessionServiceProxy;
    private _appSessionService: AppSessionService;
    private _commonUserInfoService: CommonUserInfoServiceProxy;

    constructor(injector: Injector) {
        super(injector);

        this.dialog = injector.get(MatDialog);
        this._authService = injector.get(AppAuthService);
        this._abpSessionService = injector.get(AbpSessionService);
        this._abpMultiTenancyService = injector.get(AbpMultiTenancyService);
        this._profileServiceProxy = injector.get(ProfileServiceProxy);
        this._userLinkServiceProxy = injector.get(UserLinkServiceProxy);
        this._userServiceProxy = injector.get(UserServiceProxy);
        this._impersonationService = injector.get(ImpersonationService);
        this._linkedAccountService = injector.get(LinkedAccountService);
        this._userNotificationHelper = injector.get(UserNotificationHelper);
        this._sessionService = injector.get(SessionServiceProxy);
        this._appSessionService = injector.get(AppSessionService);
        this._commonUserInfoService = injector.get(CommonUserInfoServiceProxy);

        this.loggedUserId = abp.session.userId;
    }

    ngOnInit() {
        this.getCurrentLoginInformations();

        this.isImpersonatedLogin = this._abpSessionService.impersonatorUserId > 0;

        this.shownLoginNameTitle = this.isImpersonatedLogin ? this.l('YouCanBackToYourAccount') : '';
        this.getRecentlyLinkedUsers();

        this.registerToEvents();

        this.hasPlatformPermissions =
            (this.feature.isEnabled('CFO') && this.permission.isGranted('Pages.CFO')) ||
            (this.feature.isEnabled('CRM') && this.permission.isGranted('Pages.CRM')) ||
            (this.feature.isEnabled('Admin') && this.permission.isGranted('Pages.Administration.Users'));
    }

    getShownUserName(linkedUser: LinkedUserDto): string {
        return UserHelper.getShownUserName(linkedUser.username, linkedUser.tenantId, linkedUser.tenancyName);
    }

    getRecentlyLinkedUsers(): void {
        if (this.loggedUserId)
            this._userLinkServiceProxy.getRecentlyUsedLinkedUsers().subscribe(result => {
                this.recentlyLinkedUsers = result.items;
            });
    }

    showLoginAttempts(e): void {
        this.dialog.open(LoginAttemptsModalComponent, {
            panelClass: ['slider', 'user-info'],
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
            panelClass: ['slider', 'user-info'],
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
            panelClass: ['slider', 'user-info'],
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
                if (result.clearPhoto) {
                    this._profileServiceProxy.clearProfilePicture()
                        .subscribe(() => {
                            this.handleProfilePictureChange(null);
                        });
                } else {
                    const base64OrigImage = StringHelper.getBase64(result.origImage),
                        base64ThumbImage = StringHelper.getBase64(result.thumImage);
                    this._profileServiceProxy.updateProfilePicture(UpdateProfilePictureInput.fromJS({
                        originalImage: base64OrigImage,
                        thumbnail: base64ThumbImage
                    })).subscribe(thumbnailId => {
                        this.handleProfilePictureChange(thumbnailId);
                    });
                }
            });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    registerToEvents() {
        abp.event.on('profilePictureChanged', (thumbnailId) => {
            this.appSession.user.profilePictureId = thumbnailId;
        });
    }

    private handleProfilePictureChange(thumbnailId: string) {
        abp.event.trigger('profilePictureChanged', thumbnailId);
    }

    changeMySettings(e): void {
        this.dialog.open(MySettingsModalComponent, {
            panelClass: ['slider', 'user-info'],
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    backToMyAccount(): void {
        this._impersonationService.backToImpersonator();
    }

    switchToLinkedUser(linkedUser: LinkedUserDto): void {
        this._linkedAccountService.switchToAccount(linkedUser.id, linkedUser.tenantId);
    }

    get notificationEnabled(): boolean {
        return (!this._abpSessionService.tenantId || this.feature.isEnabled('Notification'));
    }

    logout(): void {
        this._authService.logout(true, this.feature.isEnabled('PFM.Applications') ? location.origin + '/personal-finance' : undefined);
    }

    getCurrentLoginInformations(): void {
        this.shownLoginInfo = this.appSession.getShownLoginInfo();
        this.tenant = this.appSession.tenant;
    }
}
