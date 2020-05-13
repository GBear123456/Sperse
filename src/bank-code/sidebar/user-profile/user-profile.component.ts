/** Core imports */
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Observable, zip } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

/** Application imports */
import { ProfileService } from '../../../shared/common/profile-service/profile.service';
import { AppSessionService } from '../../../shared/common/session/app-session.service';
import { AppLocalizationService } from '../../../app/shared/common/localization/app-localization.service';
import { AppPermissions } from '../../../shared/AppPermissions';
import { PermissionCheckerService } from 'abp-ng2-module/dist/src/auth/permission-checker.service';
import { MySettingsModalComponent } from '../../../app/shared/layout/profile/my-settings-modal.component';
import { MemberAreaLink } from '../../../shared/common/area-navigation/member-area-link.enum';
import { BankCodeServiceType } from '../../products/bank-code-service-type.enum';
import { LifecycleSubjectsService } from '../../../shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    selector: 'user-profile',
    templateUrl: 'user-profile.component.html',
    styleUrls: ['user-profile.component.less'],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent implements OnInit, OnDestroy {
    accessCode$: Observable<string> = this.profileService.accessCode$;
    navigationItems: MemberAreaLink[] = this.getNavigationItems();
    constructor(
        private dialog: MatDialog,
        private router: Router,
        private permissionChecker: PermissionCheckerService,
        private lifeCycleSubjectService: LifecycleSubjectsService,
        public appSession: AppSessionService,
        public ls: AppLocalizationService,
        public profileService: ProfileService
    ) {}

    ngOnInit() {
        if (this.appSession.user) {
            zip(
                this.profileService.checkServiceSubscription(BankCodeServiceType.BANKAffiliate),
                this.profileService.checkServiceSubscription(BankCodeServiceType.BANKTrainer)
            ).pipe(
                takeUntil(this.lifeCycleSubjectService.destroy$),
                map((subscriptions: boolean[]) => subscriptions.some(Boolean))
            ).subscribe((showResourcesLink: boolean) => {
                this.navigationItems = this.getNavigationItems(showResourcesLink);
            });
        }
    }


    navigationItemClick(item: MemberAreaLink, e) {
        if (item.onClick) {
            item.onClick();
        } else {
            this.router.navigateByUrl(item.url);
        }
        e.stopPropagation();
        e.preventDefault();
    }

    getNavigationItems(showResourcesLink = false) {
        return [
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
                imgUrl: './assets/common/images/bank-code/resources.png',
                hidden: !showResourcesLink
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
    }

    ngOnDestroy() {
        this.lifeCycleSubjectService.destroy.next();
    }
}