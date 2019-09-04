/** Core imports */
import { Component, OnInit, Input, Injector, ApplicationRef } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';

/** Application imports */
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
import { AppFeatures } from '@shared/AppFeatures';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { Router } from '@angular/router';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';

@Component({
    selector: 'user-dropdown-menu',
    templateUrl: './user-dropdown-menu.component.html',
    styleUrls: [ '../../../../metronic/m-nav.less', './user-dropdown-menu.component.less'],
    providers: [ CommonUserInfoServiceProxy, ImpersonationService ]
})
export class UserDropdownMenuComponent implements OnInit {
    private impersonationService: ImpersonationService;
    private commonUserInfoService: CommonUserInfoServiceProxy;
    profileThumbnailId = this.appSession.user.profileThumbnailId;
    isImpersonatedLogin = this.abpSessionService.impersonatorUserId > 0;
    shownLoginInfo: { fullName, email, tenantName?};
    recentlyLinkedUsers: LinkedUserDto[];
    hasPlatformPermissions = (this.featureService.isEnabled(AppFeatures.CFO) && this.permissionService.isGranted(AppPermissions.CFO)) ||
                             (this.featureService.isEnabled(AppFeatures.CRM) && this.permissionService.isGranted(AppPermissions.CRM)) ||
                             (this.featureService.isEnabled(AppFeatures.Admin) && this.permissionService.isGranted(AppPermissions.AdministrationUsers));
    menuItemTypes = UserDropdownMenuItemType;
    @Input() subtitle: string;
    @Input() dropdownMenuItems: UserDropdownMenuItemModel[] = [
        {
            name: this.ls.l('BackToMyAccount'),
            visible: this.isImpersonatedLogin,
            id: 'UserProfileBackToMyAccountButton',
            iconSrc: 'assets/common/images/lend-space-dark/icons/back.svg',
            onClick: () => this.userManagementService.backToMyAccount()
        },
        {
            name: this.ls.l('ManageLinkedAccounts'),
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
            name: this.ls.l('My Profile'),
            id: 'UpdateMyProfile',
            iconClass: 'profile-picture',
            visible: this.featureService.isEnabled(AppFeatures.PFM),
            onClick: () => this.updateProfileInformation()
        },
        {
            name: this.ls.l('ChangePassword'),
            id: 'UserProfileChangePasswordLink',
            iconClass: 'change-password',
            onClick: (e) => this.userManagementService.changePassword(e)
        },
        {
            name: this.ls.l('LoginAttempts'),
            id: 'ShowLoginAttemptsLink',
            iconClass: 'login-attempts',
            onClick: (e) => this.userManagementService.showLoginAttempts(e)
        },
        {
            name: this.ls.l('ChangeProfilePicture'),
            id: 'UserProfileChangePictureLink',
            iconClass: 'profile-picture',
            onClick: (e) => this.userManagementService.changeProfilePicture(e)
        },
        {
            name: this.ls.l('MySettings'),
            visible: !this.featureService.isEnabled(AppFeatures.PFM),
            id: 'UserProfileMySettingsLink',
            iconClass: 'settings',
            onClick: (e) => this.userManagementService.changeMySettings(e)
        },
        {
            name: this.ls.l('Help'),
            iconClass: 'help',
            onClick: () => {
                window.open(this.userManagementService.helpLink, '_blank');
            }
        },
        {
            type: UserDropdownMenuItemType.Separator
        },
        {
            name: this.ls.l('Logout'),
            onClick: () => this.userManagementService.logout(),
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
    private rootComponent: any;
    bankCode: string = this.appSession.user.bankCode;

    constructor(
        private injector: Injector,
        private applicationRef: ApplicationRef,
        private dialog: MatDialog,
        private abpSessionService: AbpSessionService,
        private ls: AppLocalizationService,
        private featureService: FeatureCheckerService,
        private permissionService: PermissionCheckerService,
        private router: Router,
        public bankCodeService: BankCodeService,
        public appSession: AppSessionService,
        public userManagementService: UserManagementService
    ) {
        this.impersonationService = injector.get(ImpersonationService);
        this.commonUserInfoService = injector.get(CommonUserInfoServiceProxy);
    }

    ngOnInit() {
        this.shownLoginInfo = this.appSession.getShownLoginInfo();
        this.userManagementService.getRecentlyLinkedUsers().subscribe(
            recentlyLinkedUsers => this.recentlyLinkedUsers = recentlyLinkedUsers
        );
    }

    getScrollHeight() {
        let height = innerHeight - 170 - (this.userManagementService.checkBankCodeFeature() ? 38 : 0);
        return height > 490 ? '100%' : height;
    }

    updateProfileInformation() {
        this.rootComponent =  this.injector.get(this.applicationRef.componentTypes[0]);
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

    getBankCodeDefinition(bankCodeLetter: BankCodeLetter): string {
        let definition: string;
        switch (bankCodeLetter) {
            case BankCodeLetter.B: definition = this.ls.l('BankCode_BluePrint'); break;
            case BankCodeLetter.A: definition = this.ls.l('BankCode_Action'); break;
            case BankCodeLetter.N: definition = this.ls.l('BankCode_Nurturing'); break;
            case BankCodeLetter.K: definition = this.ls.l('BankCode_Knowledge'); break;
        }
        return definition;
    }
}
