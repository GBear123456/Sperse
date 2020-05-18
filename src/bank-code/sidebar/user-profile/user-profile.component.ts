/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Observable } from 'rxjs';

/** Application imports */
import { ProfileService } from '../../../shared/common/profile-service/profile.service';
import { AppSessionService } from '../../../shared/common/session/app-session.service';
import { AppLocalizationService } from '../../../app/shared/common/localization/app-localization.service';
import { AppPermissions } from '../../../shared/AppPermissions';
import { PermissionCheckerService } from 'abp-ng2-module/dist/src/auth/permission-checker.service';
import { MySettingsModalComponent } from '../../../app/shared/layout/profile/my-settings-modal.component';
import { MemberAreaLink } from '../../../shared/common/area-navigation/member-area-link.enum';

@Component({
    selector: 'user-profile',
    templateUrl: 'user-profile.component.html',
    styleUrls: ['user-profile.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent {
    accessCode$: Observable<string> = this.profileService.accessCode$;
    navigationItems: MemberAreaLink[] = [
        {
            name: 'My Account',
            onClick: () => {
                this.dialog.open(MySettingsModalComponent, {
                    panelClass: ['slider', 'user-info'],
                    disableClose: true,
                    closeOnNavigation: false,
                    data: {}
                });
            },
            imgUrl: './assets/common/images/bank-code/my-account.png'
        },
        {
            name: 'My Products',
            url: 'code-breaker/products',
            imgUrl: './assets/common/images/bank-code/my-products.png'
        },
        {
            name: 'Resources',
            url: 'code-breaker/resources',
            imgUrl: './assets/common/images/bank-code/resources.png'
        },
        {
            name: 'Events',
            url: 'code-breaker/events',
            imgUrl: './assets/common/images/bank-code/events.png'
        },
        {
            name: 'BCRM',
            url: this.permissionChecker.isGranted(AppPermissions.CRM) ? 'app/crm' : 'code-breaker/products/bankpass',
            imgUrl: './assets/common/images/bank-code/bcrm.png'
        }
    ];
    constructor(
        private dialog: MatDialog,
        private router: Router,
        private permissionChecker: PermissionCheckerService,
        public appSession: AppSessionService,
        public ls: AppLocalizationService,
        public profileService: ProfileService
    ) {}

    navigationItemClick(item: MemberAreaLink, e) {
        if (item.onClick) {
            item.onClick();
        } else {
            this.router.navigateByUrl(item.url);
        }
        e.stopPropagation();
        e.preventDefault();
    }
}