/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { of } from 'rxjs';
import { pluck } from 'rxjs/operators';

/** Application imports */
import { MySettingsModalComponent } from 'app/shared/layout/profile/my-settings-modal.component';
import { UploadPhotoDialogComponent } from 'app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import {
    LinkedUserDto, ProfileServiceProxy,
    TenantLoginInfoDtoCustomLayoutType,
    UpdateProfilePictureInput, UserLinkServiceProxy
} from 'shared/service-proxies/service-proxies';
import { LinkedAccountsModalComponent } from 'app/shared/layout/linked-accounts-modal.component';
import { filter } from '@node_modules/rxjs/operators';
import { StringHelper } from 'shared/helpers/StringHelper';
import { AppConsts } from 'shared/AppConsts';
import { ChangePasswordModalComponent } from 'app/shared/layout/profile/change-password-modal.component';
import { ImpersonationService } from 'app/admin/users/impersonation.service';
import { AppAuthService } from 'shared/common/auth/app-auth.service';
import { LoginAttemptsModalComponent } from 'app/shared/layout/login-attempts-modal.component';
import { UserHelper } from 'app/shared/helpers/UserHelper';
import { AppSessionService } from 'shared/common/session/app-session.service';
import { LinkedAccountService } from 'app/shared/layout/linked-account.service';
import { Observable } from '@node_modules/rxjs';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { environment } from 'environments/environment';

@Injectable()
export class UserManagementService {
    helpLink = location.protocol + '//' + abp.setting.values['Integrations:Zendesk:AccountUrl'];
    constructor(
        private impersonationService: ImpersonationService,
        private dialog: MatDialog,
        private authService: AppAuthService,
        private appSession: AppSessionService,
        private linkedAccountService: LinkedAccountService,
        private profileServiceProxy: ProfileServiceProxy,
        private userLinkServiceProxy: UserLinkServiceProxy,
        private feature: FeatureCheckerService,
        private abpSessionService: AbpSessionService
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
                    this.profileServiceProxy.clearProfilePicture()
                        .subscribe(() => {
                            this.handleProfilePictureChange(null);
                        });
                } else {
                    const base64OrigImage = StringHelper.getBase64(result.origImage),
                        base64ThumbImage = StringHelper.getBase64(result.thumImage);
                    this.profileServiceProxy.updateProfilePicture(UpdateProfilePictureInput.fromJS({
                        originalImage: base64OrigImage,
                        thumbnail: base64ThumbImage,
                        source: result.source
                    })).subscribe(thumbnailId => {
                        this.handleProfilePictureChange(thumbnailId);
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

    getRecentlyLinkedUsers(): Observable<LinkedUserDto[]> {
        return this.appSession.userId
               ? this.userLinkServiceProxy.getRecentlyUsedLinkedUsers().pipe(pluck('items'))
               : of([]);
    }

    checkLendSpaceLayout() {
        let tenant = this.appSession.tenant;
        return tenant && (tenant.customLayoutType == TenantLoginInfoDtoCustomLayoutType.LendSpace);
    }

    checkAdvicePeriodLayout() {
        let tenant = this.appSession.tenant;
        return tenant && (tenant.customLayoutType == TenantLoginInfoDtoCustomLayoutType.AdvicePeriod);
    }

    getProfilePictureUrl(id, defaultUrl = AppConsts.imageUrls.profileDefault) {
        return id ? AppConsts.remoteServiceBaseUrl + '/api/Profile/Picture/' + (this.appSession.tenantId || 0) + '/' + id
            : (this.checkLendSpaceLayout() || this.checkAdvicePeriodLayout() ? AppConsts.imageUrls.profileLendSpace : defaultUrl);
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
        return (!this.abpSessionService.tenantId || this.feature.isEnabled('Notification'));
    }
}
