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
    ChangeUserLanguageDto, ProfileServiceProxy, LayoutType, CommonUserInfoServiceProxy
} from '@shared/service-proxies/service-proxies';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { AppFeatures } from '@shared/AppFeatures';
import { AppService } from '@app/app.service';
import { UserDropdownMenuItemModel } from '@shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item.model';

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
        private _abpSessionService: AbpSessionService,
        private _profileServiceProxy: ProfileServiceProxy,
        public userManagementService: UserManagementService,
        public appService: AppService,
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
        return (!this._abpSessionService.tenantId || this.feature.isEnabled(AppFeatures.AppChatFeature));
    }

}
