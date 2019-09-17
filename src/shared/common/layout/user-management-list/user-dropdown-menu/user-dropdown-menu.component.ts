/** Core imports */
import { Component, OnInit, Input, Injector, ElementRef } from '@angular/core';

/** Application imports */
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
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppFeatures } from '@shared/AppFeatures';
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
        private elementRef: ElementRef,
        private featureCheckerService: FeatureCheckerService,
        public appSession: AppSessionService,
        public userManagementService: UserManagementService,
    ) {
        this.impersonationService = injector.get(ImpersonationService);
        this.commonUserInfoService = injector.get(CommonUserInfoServiceProxy);
    }

    getScrollHeight() {
        let height = innerHeight - 170;
        return height > 490 ? '100%' : height;
    }

    menuItemClick(menuItem, event) {
        menuItem.onClick(event);
        this.elementRef.nativeElement.childNodes[0]
            .classList.remove('m-dropdown--open');
    }

    ngOnInit() {
        this.shownLoginInfo = this.appSession.getShownLoginInfo();
        this.userManagementService.getRecentlyLinkedUsers().subscribe(
            recentlyLinkedUsers => this.recentlyLinkedUsers = recentlyLinkedUsers
        );
    }

}
