/** Core imports */
import { Component, Injector, OnInit } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import isEqual from 'lodash/isEqual';
import kebabCase from 'lodash/kebabCase';

/** Application imports */
import { AbpSessionService } from '@abp/session/abp-session.service';
import { AppConsts } from '@shared/AppConsts';
import {
    ChangeUserLanguageDto, ProfileServiceProxy, LayoutType, CommonUserInfoServiceProxy
} from '@shared/service-proxies/service-proxies';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { AppFeatures } from '@shared/AppFeatures';
import { AppService } from '@app/app.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { UserDropdownMenuItemModel } from '@shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item.model';

@Component({
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.less'],
    selector: 'app-header',
    providers: [ CommonUserInfoServiceProxy ]
})
export class HeaderComponent implements OnInit {

    customLayoutType = '';
    languages: abp.localization.ILanguageInfo[];
    currentLanguage: abp.localization.ILanguageInfo;
    tenancyName = '';
    userName = '';
    unreadChatMessageCount = 0;
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    chatConnected = false;
    userCompany$: Observable<string>;
    dropdownMenuItems: UserDropdownMenuItemModel[] = this.userManagementService.defaultDropDownItems;

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private abpSessionService: AbpSessionService,
        private profileServiceProxy: ProfileServiceProxy,
        private commonUserInfoService: CommonUserInfoServiceProxy,
        private feature: FeatureCheckerService,
        public appSession: AppSessionService,
        public userManagementService: UserManagementService,
        public appService: AppService,
        public layoutService: LayoutService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.languages = this.ls.languages.filter((l: abp.localization.ILanguageInfo) => l.isDisabled === false);
        this.currentLanguage = this.ls.currentLanguage;
        this.userCompany$ = this.commonUserInfoService.getCompany().pipe(
            map(x => isEqual(x, {}) ? null : x)
        );
        let tenant = this.appSession.tenant;
        if (tenant && tenant.customLayoutType && tenant.customLayoutType != LayoutType.Default)
            this.customLayoutType = kebabCase(tenant.customLayoutType);
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

        this.profileServiceProxy.changeLanguage(input).subscribe(() => {
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
        return !this.abpSessionService.tenantId || this.feature.isEnabled(AppFeatures.AppChatFeature);
    }

}
