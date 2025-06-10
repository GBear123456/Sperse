/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { first, filter, pluck } from 'rxjs/operators';
import { of } from 'rxjs';

/** Application imports */
import { MySettingsModalComponent } from 'app/shared/layout/profile/my-settings-modal.component';
import { UploadPhotoDialogComponent } from 'app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import {
    LayoutType,
    LinkedUserDto,
    ProfileServiceProxy,
    UpdateProfilePictureInput,
    UserLinkServiceProxy
} from 'shared/service-proxies/service-proxies';
import { LinkedAccountsModalComponent } from 'app/shared/layout/linked-accounts-modal/linked-accounts-modal.component';
import { StringHelper } from 'shared/helpers/StringHelper';
import { AppConsts } from 'shared/AppConsts';
import { ChangePasswordModalComponent } from 'app/shared/layout/profile/change-password-modal.component';
import { ImpersonationService } from 'app/admin/users/impersonation.service';
import { AppAuthService } from 'shared/common/auth/app-auth.service';
import { LoginAttemptsModalComponent } from 'app/shared/layout/login-attempts-modal/login-attempts-modal.component';
import { UserHelper } from 'app/shared/helpers/UserHelper';
import { AppSessionService } from 'shared/common/session/app-session.service';
import { LinkedAccountService } from 'app/shared/layout/linked-accounts-modal/linked-account.service';
import { Observable } from '@node_modules/rxjs';
import { FeatureCheckerService } from 'abp-ng2-module';
import { AbpSessionService } from 'abp-ng2-module';
import { environment } from 'environments/environment';
import { AppFeatures } from '@shared/AppFeatures';
import { UserDropdownMenuItemType } from '@shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item-type';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { WizardRightSideComponent } from '@shared/offers-wizard/wizard-right-side/wizard-right-side.component';
import { AppPermissions } from '@shared/AppPermissions';
import { PermissionCheckerService } from 'abp-ng2-module';
import { Router } from '@angular/router';
import { UserDropdownMenuItemModel } from '@shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item.model';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { UploadPhotoData } from '@app/shared/common/upload-photo-dialog/upload-photo-data.interface';
import { UploadPhotoResult } from '@app/shared/common/upload-photo-dialog/upload-photo-result.interface';

@Injectable()
export class UserManagementService {
    helpLink = abp.setting.values['Integrations:Zendesk:AccountUrl'] ?
        location.protocol + '//' + abp.setting.values['Integrations:Zendesk:AccountUrl'] : '';
    isImpersonatedLogin = this.abpSessionService.impersonatorUserId > 0;
    recentlyLinkedUsers: LinkedUserDto[];
    hasPlatformPermissions = (this.feature.isEnabled(AppFeatures.CFO) && this.permissionChecker.isGranted(AppPermissions.CFO)) ||
                             (this.feature.isEnabled(AppFeatures.CRM) && this.permissionChecker.isGranted(AppPermissions.CRM)) ||
                             (this.feature.isEnabled(AppFeatures.Admin) && this.permissionChecker.isGranted(AppPermissions.AdministrationUsers));
    defaultDropDownItems: UserDropdownMenuItemModel[] = [
        {
            name: this.ls.l('BackToMyAccount'),
            visible: this.isImpersonatedLogin,
            id: 'UserProfileBackToMyAccountButton',
            iconSrc: 'assets/common/images/lend-space-dark/icons/back.svg',
            onClick: () => this.backToMyAccount()
        },
        {
            name: this.ls.l('ManageLinkedAccounts'),
            iconClass: 'flaticon-user-settings',
            visible: this.feature.isEnabled(AppFeatures.AdminCustomizations),
            id: 'ManageLinkedAccountsLink',
            onClick: (e) => this.showLinkedAccounts(e),
            submenuItems: {
                items: [],
                id: 'RecentlyUsedLinkedUsers',
                onItemClick: (linkedUser) => this.switchToLinkedUser(linkedUser),
                onItemDisplay: (linkedUser) => this.getShownUserName(linkedUser)
            }
        },
        {
            name: this.ls.l('MyOrderHistory'),
            iconClass: 'order-history',
            visible:  this.checkBankCodeFeature() && !this.isLayout(LayoutType.HOA),
            onClick: () => {
                if (AppConsts.appMemberPortalUrl) {
                    this.authService.setTokenBeforeRedirect();
                    location.href = AppConsts.appMemberPortalUrl + '/app/order-history/subscriptions';
                } else
                    this.router.navigateByUrl('code-breaker/order-history/subscriptions');
            }
        },
        {
            name: this.ls.l('ChangePassword'),
            id: 'UserProfileChangePasswordLink',
            iconClass: 'flaticon-more-v6',
            onClick: (e) => this.changePassword(e)
        },
        {
            name: this.ls.l('LoginAttempts'),
            id: 'ShowLoginAttemptsLink',
            iconClass: 'flaticon-list',
            onClick: (e) => this.showLoginAttempts(e)
        },
        {
            name: this.ls.l('ChangeProfilePicture'),
            id: 'UserProfileChangePictureLink',
            iconClass: 'flaticon-profile-1',
            onClick: (e) => this.changeProfilePicture(e)
        },
        {
            name: this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'Navigation_Tasks'),
            id: 'UserProfileTasks',
            iconClass: 'flaticon-calendar-1',
            visible: this.feature.isEnabled(AppFeatures.CRM) 
                && this.permissionChecker.isGranted(AppPermissions.CRM),
            onClick: (e) => {
                this.router.navigateByUrl('app/crm/activity');
            }
        },
        {
            name: this.ls.l('MySettings'),
            id: 'UserProfileMySettingsLink',
            iconClass: 'flaticon-cogwheel',
            onClick: (e) => this.changeMySettings(e)
        },
        {
            name: this.ls.l('Help'),
            iconClass: 'flaticon-info',
            onClick: () => {
                window.open(this.helpLink, '_blank');
            },
            visible: !this.isLayout(LayoutType.BankCode)
        },
        {
            type: UserDropdownMenuItemType.Separator,
        },
        {
            name: this.ls.l('Logout'),
            onClick: () => this.logout(),
            cssClass: 'bottom-logout',
            iconSrc: 'assets/common/icons/logout.svg'
        }
    ];
    lendspaceDropDownItems: UserDropdownMenuItemModel[] = [
        {
            name: this.ls.l('BackToMyAccount'),
            visible: this.isImpersonatedLogin,
            id: 'UserProfileBackToMyAccountButton',
            iconSrc: 'assets/common/images/lend-space-dark/icons/back.svg',
            onClick: () => this.backToMyAccount()
        },
        {
            name: this.ls.l('ManageLinkedAccounts'),
            iconClass: 'flaticon-user-settings',
            visible: this.isImpersonatedLogin,
            id: 'ManageLinkedAccountsLink',
            onClick: (e) => this.showLinkedAccounts(e),
            submenuItems: {
                items: [],
                id: 'RecentlyUsedLinkedUsers',
                onItemClick: (linkedUser) => this.switchToLinkedUser(linkedUser),
                onItemDisplay: (linkedUser) => this.getShownUserName(linkedUser)
            }
        },
        {
            type: UserDropdownMenuItemType.Separator,
            visible: this.isImpersonatedLogin
        },
        {
            name: this.ls.l('My Profile'),
            id: 'UpdateMyProfile',
            iconClass: 'profile-picture',
            visible: this.feature.isEnabled(AppFeatures.PFM),
            onClick: () => this.updateProfileInformation()
        },
        {
            name: this.ls.l('ChangePassword'),
            id: 'UserProfileChangePasswordLink',
            iconClass: 'change-password',
            onClick: (e) => this.changePassword(e)
        },
        {
            name: this.ls.l('LoginAttempts'),
            id: 'ShowLoginAttemptsLink',
            iconClass: 'login-attempts',
            onClick: (e) => this.showLoginAttempts(e)
        },
        {
            name: this.ls.l('ChangeProfilePicture'),
            id: 'UserProfileChangePictureLink',
            iconClass: 'profile-picture',
            onClick: (e) => this.changeProfilePicture(e)
        },
        {
            name: this.ls.l('MySettings'),
            visible: !this.feature.isEnabled(AppFeatures.PFM),
            id: 'UserProfileMySettingsLink',
            iconClass: 'settings',
            onClick: (e) => this.changeMySettings(e)
        },
        {
            name: this.ls.l('Help'),
            iconClass: 'help',
            onClick: () => {
                window.open(this.helpLink, '_blank');
            }
        },
        {
            type: UserDropdownMenuItemType.Separator
        },
        {
            name: this.ls.l('Logout'),
            onClick: () => this.logout(),
            cssClass: 'bottom-logout',
            iconClass: 'logout'
        },
        {
            name: this.ls.l('BackToPlatform'),
            visible: this.hasPlatformPermissions,
            cssClass: 'bottom-back',
            onClick: () => {
                this.router.navigate(['/app']);
            }
        }
    ];
    constructor(
        private impersonationService: ImpersonationService,
        private dialog: MatDialog,
        private authService: AppAuthService,
        private appSession: AppSessionService,
        private linkedAccountService: LinkedAccountService,
        private profileServiceProxy: ProfileServiceProxy,
        private userLinkServiceProxy: UserLinkServiceProxy,
        private feature: FeatureCheckerService,
        private abpSessionService: AbpSessionService,
        private ls: AppLocalizationService,
        private permissionChecker: PermissionCheckerService,
        private router: Router,
        private profileService: ProfileService
    ) {}

    backToMyAccount(): void {
        this.impersonationService.backToImpersonator();
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
        const uploadPhotoData: UploadPhotoData = {
            title: this.ls.l('ChangeProfilePicture'),
            source: this.profileService.getProfilePictureUrl(this.appSession.user.profilePictureId),
            maxSizeBytes: AppConsts.maxImageSize
        };
        this.dialog.open(UploadPhotoDialogComponent, {
            data: uploadPhotoData,
            maxWidth: AppConsts.maxImageDialogWidth,
            hasBackdrop: true
        }).afterClosed()
            .pipe(filter(result => result))
            .subscribe((result: UploadPhotoResult) => {
                if (result.clearPhoto) {
                    this.profileServiceProxy.clearProfilePicture()
                        .subscribe(() => {
                            this.handleProfilePictureChange(null);
                        });
                } else {
                    const base64OrigImage = StringHelper.getBase64(result.origImage),
                        base64ThumbImage = StringHelper.getBase64(result.thumbImage);
                    this.profileServiceProxy.updateProfilePicture(UpdateProfilePictureInput.fromJS({
                        originalImage: base64OrigImage,
                        thumbnail: base64ThumbImage,
                        source: result.source
                    })).subscribe(thumbnailId => {
                        this.appSession.init(true).then(() =>
                            this.handleProfilePictureChange(thumbnailId)
                        );
                    });
                }
            });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    private handleProfilePictureChange(thumbnailId: string) {
        abp.event.trigger('profilePictureChanged', thumbnailId);
    }

    changeMySettings(e): void {
        let dialog = this.dialog.open(MySettingsModalComponent, {
            panelClass: ['slider', 'user-info'],
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        });

        dialog.componentInstance.modalSave.pipe(first()).subscribe(() => {
            dialog.close();
        });

        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    getRecentlyLinkedUsers(): Observable<LinkedUserDto[]> {
        return this.appSession.userId
               ? this.userLinkServiceProxy.getRecentlyUsedLinkedUsers().pipe(pluck('items'))
               : of([]);
    }

    checkLendSpaceLayout(): boolean {
        return this.isLayout(LayoutType.LendSpace);
    }

    checkAdvicePeriodLayout(): boolean {
        return this.isLayout(LayoutType.AdvicePeriod);
    }

    isLayout(layoutType: LayoutType): boolean {
        return !!(this.appSession.tenant && this.appSession.tenant.customLayoutType === layoutType);
    }

    checkBankCodeFeature(): boolean {
        const tenant = this.appSession.tenant;
        return !!tenant && (this.feature.isEnabled(AppFeatures.CRMBANKCode));
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

    logout(): void {
        this.authService.logout(true, this.abpSessionService.impersonatorUserId ? undefined : this.getLogoutUrl());
    }

    getLogoutUrl() {
        let domain = environment.LENDSPACE_DOMAIN;
        if (this.checkLendSpaceLayout() && this.checkSecondDomainLevel(domain))
            return domain;
    }

    checkSecondDomainLevel(domain) {
        return domain.indexOf(location.hostname.split('.').slice(-2).join('.')) >= 0;
    }

    switchToLinkedUser(linkedUser: LinkedUserDto): void {
        this.linkedAccountService.switchToAccount(linkedUser.id, linkedUser.tenantId);
    }

    getShownUserName(linkedUser: LinkedUserDto): string {
        return UserHelper.getShownUserName(linkedUser.username, linkedUser.tenantId, linkedUser.tenancyName);
    }

    get notificationEnabled(): boolean {
        return (!this.abpSessionService.tenantId || this.feature.isEnabled(AppFeatures.Notification));
    }

    updateProfileInformation() {
        this.dialog.open(WizardRightSideComponent, {
            panelClass: ['slider', 'user-info', 'wizard-right'],
            disableClose: true,
            data: {
                campaignId: null
            }
        }).afterClosed().subscribe(() => {});
    }
}