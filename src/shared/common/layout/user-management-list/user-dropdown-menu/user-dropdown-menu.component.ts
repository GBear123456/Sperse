/** Core imports */
import { Component, OnInit, Input, Injector, ApplicationRef } from '@angular/core';

/** Application imports */
import { AbpSessionService } from '@abp/session/abp-session.service';
import { ImpersonationService } from 'app/admin/users/impersonation.service';
import {
    CommonUserInfoServiceProxy,
    LinkedUserDto
} from 'shared/service-proxies/service-proxies';
import { UserManagementService } from 'shared/common/layout/user-management-list/user-management.service';
import { UserDropdownMenuItemType } from 'shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item-type';
import { UserDropdownMenuItemModel } from 'shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item.model';
/** @todo Used for chart bar and dropdown. Reimplement in future */
import 'assets/metronic/src/js/framework/base/util.js';
import 'assets/metronic/src/js/framework/components/general/dropdown.js';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppFeatures } from '@shared/AppFeatures';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';

@Component({
    selector: 'user-dropdown-menu',
    templateUrl: './user-dropdown-menu.component.html',
    styleUrls: [
        '../../../../../assets/metronic/src/vendors/flaticon/css/flaticon.css',
        '../../../../metronic/m-nav.less',
        './user-dropdown-menu.component.less'
    ],
    providers: [ CommonUserInfoServiceProxy, ImpersonationService ]
})
export class UserDropdownMenuComponent implements OnInit {
    @Input() subtitle: string;
    @Input() dropdownMenuItems: UserDropdownMenuItemModel[] = this.featureCheckerService.isEnabled(AppFeatures.PFMApplications) && this.userManagementService.checkLendSpaceLayout()
        ? this.userManagementService.lendspaceDropDownItems
        : this.userManagementService.defaultDropDownItems;
    private impersonationService: ImpersonationService;
    private commonUserInfoService: CommonUserInfoServiceProxy;
    profileThumbnailId = this.appSession.user.profileThumbnailId;
    shownLoginInfo: { fullName, email, tenantName?};
    recentlyLinkedUsers: LinkedUserDto[];
    menuItemTypes = UserDropdownMenuItemType;

    constructor(
        injector: Injector,
        private applicationRef: ApplicationRef,
        private featureCheckerService: FeatureCheckerService,
        private abpSessionService: AbpSessionService,
        private ls: AppLocalizationService,
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
