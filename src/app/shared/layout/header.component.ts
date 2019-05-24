/** Core imports */
import { Component, Injector, OnInit } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import filter from 'lodash/filter';
import isEqual from 'lodash/isEqual';
import kebabCase from 'lodash/kebabCase';

/** Application imports */
import { AbpSessionService } from '@abp/session/abp-session.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ChangeUserLanguageDto, LinkedUserDto, ProfileServiceProxy, TenantLoginInfoDtoCustomLayoutType, CommonUserInfoServiceProxy
} from '@shared/service-proxies/service-proxies';
import { UserManagementService } from '@root/shared/common/layout/user-management-list/user-management.service';
import { UserDropdownMenuItemType } from '@root/shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item-type';
import { UserDropdownMenuItemModel } from '@root/shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item.model';
import { LayoutService } from '@app/shared/layout/layout.service';

@Component({
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.less'],
    selector: 'app-header',
    providers: [ CommonUserInfoServiceProxy ]
})
export class HeaderComponent extends AppComponentBase implements OnInit {

    customLayoutType = '';
    languages: abp.localization.ILanguageInfo[];
    currentLanguage: abp.localization.ILanguageInfo;
    isImpersonatedLogin = this._abpSessionService.impersonatorUserId > 0;
    tenancyName = '';
    userName = '';
    recentlyLinkedUsers: LinkedUserDto[];
    unreadChatMessageCount = 0;
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    chatConnected = false;
    userCompany$: Observable<string>;
    dropdownMenuItems: UserDropdownMenuItemModel[] = [
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
            name: this.l('ChangePassword'),
            id: 'UserProfileChangePasswordLink',
            iconClass: 'flaticon-more-v6',
            onClick: (e) => this.userManagementService.changePassword(e)
        },
        {
            name: this.l('LoginAttempts'),
            id: 'ShowLoginAttemptsLink',
            iconClass: 'flaticon-list',
            onClick: (e) => this.userManagementService.showLoginAttempts(e)
        },
        {
            name: this.l('ChangeProfilePicture'),
            id: 'UserProfileChangePictureLink',
            iconClass: 'flaticon-profile-1',
            onClick: (e) => this.userManagementService.changeProfilePicture(e)
        },
        {
            name: this.l('MySettings'),
            id: 'UserProfileMySettingsLink',
            iconClass: 'flaticon-cogwheel',
            onClick: (e) => this.userManagementService.changeMySettings(e)
        },
        {
            name: this.l('VisualSettings'),
            visible: !this.isGranted('Pages.Administration.UiCustomization'),
            iconClass: 'flaticon-medical',
            onClick: () => this._router.navigate(['app/admin/ui-customization'])
        },
        {
            name: this.l('Help'),
            iconClass: 'flaticon-info',
            onClick: () => {
                window.open(this.userManagementService.helpLink, '_blank');
            }
        },
        {
            type: UserDropdownMenuItemType.Separator,
        },
        {
            name: this.l('Logout'),
            onClick: (e) => this.userManagementService.logout(),
            cssClass: 'bottom-logout',
            iconSrc: 'assets/common/icons/logout.svg'
        }
    ];
    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private _abpSessionService: AbpSessionService,
        private _profileServiceProxy: ProfileServiceProxy,
        public userManagementService: UserManagementService,
        public layoutService: LayoutService,
        private commonUserInfoService: CommonUserInfoServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.languages = filter(this.localization.languages, l => (<any>l).isDisabled === false);
        this.currentLanguage = this.localization.currentLanguage;
        this.userCompany$ = this.commonUserInfoService.getCompany().pipe(
            map(x => isEqual(x, {}) ? null : x)
        );
        let tenant = this.appSession.tenant;
        if (tenant && tenant.customLayoutType && tenant.customLayoutType != TenantLoginInfoDtoCustomLayoutType.Default)
            this.customLayoutType = kebabCase(tenant.customLayoutType);
        this.userManagementService.getRecentlyLinkedUsers().subscribe(
            recentlyLinkedUsers => this.recentlyLinkedUsers = recentlyLinkedUsers
        );

        this.registerToEvents();
    }

    registerToEvents() {

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


    get chatEnabled(): boolean {
        return (!this._abpSessionService.tenantId || this.feature.isEnabled('App.ChatFeature'));
    }

}
