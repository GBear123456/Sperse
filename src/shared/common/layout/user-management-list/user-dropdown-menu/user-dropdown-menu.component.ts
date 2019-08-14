/** Core imports */
import { Component, OnInit, Input, Injector } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';

/** Application imports */
import { AppComponentBase } from 'shared/common/app-component-base';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { ImpersonationService } from 'app/admin/users/impersonation.service';
import {
    CommonUserInfoServiceProxy,
    LinkedUserDto
} from 'shared/service-proxies/service-proxies';
import { UserManagementService } from 'shared/common/layout/user-management-list/user-management.service';
import { UserDropdownMenuItemModel } from 'shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item.model';
import { UserDropdownMenuItemType } from 'shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item-type';
/** @todo Used for chart bar and dropdown. Reimplement in future */
import 'assets/metronic/src/js/framework/base/util.js';
import 'assets/metronic/src/js/framework/components/general/dropdown.js';
import { AppPermissions } from '@shared/AppPermissions';
import { WizardRightSideComponent } from '@shared/offers-wizard/wizard-right-side/wizard-right-side.component';

@Component({
    selector: 'user-dropdown-menu',
    templateUrl: './user-dropdown-menu.component.html',
    styleUrls: [ '../../../../metronic/m-nav.less', './user-dropdown-menu.component.less'],
    providers: [ CommonUserInfoServiceProxy, ImpersonationService ]
})
export class UserDropdownMenuComponent extends AppComponentBase implements OnInit {
    private impersonationService: ImpersonationService;
    private commonUserInfoService: CommonUserInfoServiceProxy;
    profileThumbnailId = this.appSession.user.profileThumbnailId;
    isImpersonatedLogin = this.abpSessionService.impersonatorUserId > 0;
    shownLoginInfo: { fullName, email, tenantName?};
    recentlyLinkedUsers: LinkedUserDto[];
    hasPlatformPermissions = (this.feature.isEnabled('CFO') && this.permission.isGranted(AppPermissions.CFO)) ||
                             (this.feature.isEnabled('CRM') && this.permission.isGranted(AppPermissions.CRM)) ||
                             (this.feature.isEnabled('Admin') && this.permission.isGranted(AppPermissions.AdministrationUsers));
    menuItemTypes = UserDropdownMenuItemType;
    @Input() subtitle: string;
    @Input() dropdownMenuItems: UserDropdownMenuItemModel[] = [
        {
            name: this.l('BackToMyAccount'),
            visible: this.isImpersonatedLogin,
            id: 'UserProfileBackToMyAccountButton',
            iconSrc: 'assets/common/images/lend-space-dark/icons/back.svg',
            onClick: () => this.userManagementService.backToMyAccount()
        },
        {
            name: this.l('ManageLinkedAccounts'),
            iconClass: 'flaticon-user-settings',
            visible: this.isImpersonatedLogin,
            id: 'ManageLinkedAccountsLink',
            onClick: (e) => this.userManagementService.showLinkedAccounts(e),
            submenuItems: {
                items: this.recentlyLinkedUsers,
                id: 'RecentlyUsedLinkedUsers',
                onItemClick: (linkedUser) => this.userManagementService.switchToLinkedUser(linkedUser),
                onItemDisplay: (linkedUser) => this.userManagementService.getShownUserName(linkedUser)
            }
        },
        {
            type: UserDropdownMenuItemType.Separator,
            visible: this.isImpersonatedLogin
        },
        {
            name: this.l('My Profile'),
            id: 'UpdateMyProfile',
            iconClass: 'profile-picture',
            visible: this.feature.isEnabled('PFM'),
            onClick: () => this.updateProfileInformation()
        },
        {
            name: this.l('ChangePassword'),
            id: 'UserProfileChangePasswordLink',
            iconClass: 'change-password',
            onClick: (e) => this.userManagementService.changePassword(e)
        },
        {
            name: this.l('LoginAttempts'),
            id: 'ShowLoginAttemptsLink',
            iconClass: 'login-attempts',
            onClick: (e) => this.userManagementService.showLoginAttempts(e)
        },
        {
            name: this.l('ChangeProfilePicture'),
            id: 'UserProfileChangePictureLink',
            iconClass: 'profile-picture',
            onClick: (e) => this.userManagementService.changeProfilePicture(e)
        },
        {
            name: this.l('MySettings'),
            visible: !this.feature.isEnabled('PFM'),
            id: 'UserProfileMySettingsLink',
            iconClass: 'settings',
            onClick: (e) => this.userManagementService.changeMySettings(e)
        },
        {
            name: this.l('Help'),
            iconClass: 'help',
            onClick: () => {
                window.open(this.userManagementService.helpLink, '_blank');
            }
        },
        {
            type: UserDropdownMenuItemType.Separator
        },
        {
            name: this.l('Logout'),
            onClick: () => this.userManagementService.logout(),
            cssClass: 'bottom-logout',
            iconClass: 'logout'
        },
        {
            name: this.l('BackToPlatform'),
            visible: this.hasPlatformPermissions,
            cssClass: 'bottom-back',
            onClick: () => {
                this._router.navigate(['/app']);
            }
        }
    ];
    private rootComponent: any;

    constructor(
        injector: Injector,
        public userManagementService: UserManagementService,
        private dialog: MatDialog,
        private abpSessionService: AbpSessionService
    ) {
        super(injector);
        this.impersonationService = injector.get(ImpersonationService);
        this.commonUserInfoService = injector.get(CommonUserInfoServiceProxy);
    }

    getScrollHeight() {
        let height = innerHeight - 170;
        return height > 490 ? '100%' : height;
    }

    ngOnInit() {
        this.shownLoginInfo = this.appSession.getShownLoginInfo();
        this.userManagementService.getRecentlyLinkedUsers().subscribe(
            recentlyLinkedUsers => this.recentlyLinkedUsers = recentlyLinkedUsers
        );
    }

    updateProfileInformation() {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.dialog.open(WizardRightSideComponent, {
            id: 'offers-wizard-right',
            panelClass: ['slider', 'user-info'],
            disableClose: true,
            data: {
                campaignId: null
            }
        }).afterClosed().subscribe(() => {
            this.rootComponent.overflowHidden(false);
        });
    }
}
