/** Core imports */
import {
    AfterViewInit,
    ApplicationRef,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Injector,
    Input,
    OnInit,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { Observable, forkJoin, of } from 'rxjs';
import { first, map } from 'rxjs/operators';

/** Application imports */
import { ImpersonationService } from 'app/admin/users/impersonation.service';
import {
    CommonUserInfoServiceProxy,
    LayoutType,
    LinkedUserDto,
    MemberSettingsServiceProxy,
    UpdateUserAffiliateCodeDto
} from 'shared/service-proxies/service-proxies';
import { UserManagementService } from 'shared/common/layout/user-management-list/user-management.service';
import { UserDropdownMenuItemType } from 'shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item-type';
import { UserDropdownMenuItemModel } from 'shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item.model';
/** @todo Used for chart bar and dropdown. Reimplement in future */
import 'assets/metronic/src/js/framework/base/util.js';
import 'assets/metronic/src/js/framework/components/general/dropdown.js';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppFeatures } from '@shared/AppFeatures';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';
import { BankCodeLettersComponent } from '@app/shared/common/bank-code-letters/bank-code-letters.component';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'user-dropdown-menu',
    templateUrl: './user-dropdown-menu.component.html',
    styleUrls: [
        '../../../../../assets/metronic/src/vendors/flaticon/css/flaticon.css',
        '../../../../metronic/m-nav.less',
        './user-dropdown-menu.component.less'
    ],
    providers: [ CommonUserInfoServiceProxy, MemberSettingsServiceProxy, ImpersonationService, ]
})
export class UserDropdownMenuComponent implements AfterViewInit, OnInit {
    @ViewChild('topBarUserProfile') topBarUserProfile: ElementRef;
    @ViewChild(BankCodeLettersComponent) bankCodeLetters: BankCodeLettersComponent;
    @Input() subtitle: string;
    @Input() dropdownMenuItems: UserDropdownMenuItemModel[] = this.getDropDownItems();
    private impersonationService: ImpersonationService;
    private commonUserInfoService: CommonUserInfoServiceProxy;
    profileThumbnailId = this.appSession.user.profileThumbnailId;
    shownLoginInfo: { fullName, email, tenantName? } = this.appSession.getShownLoginInfo();
    menuItemTypes = UserDropdownMenuItemType;
    bankCode: string = this.appSession.user.bankCode;
    bankCodeColor: string = this.bankCode
        ? this.bankCodeService.getBackgroundColorByLetter(this.bankCode[0] as BankCodeLetter)
        : '#000';
    accessCode = this.appSession.user.affiliateCode;
    hasBankCodeFeature: boolean = this.userManagementService.checkBankCodeFeature();
    showAccessCode$: Observable<boolean> = this.appSession.tenant && this.appSession.tenant.customLayoutType === LayoutType.BankCode
        ? forkJoin(
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass),
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKAffiliate),
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKVault)
        ).pipe(
            map((res: boolean[]) => res.some(Boolean))
        )
        : of(false);
    showAccessCode = false;
    isAccessCodeTooltipVisible = false;
    dropdownHeaderStyle: { [key: string]: string } = this.getDropdownHeaderStyle();

    constructor(
        injector: Injector,
        private applicationRef: ApplicationRef,
        private elementRef: ElementRef,
        private featureCheckerService: FeatureCheckerService,
        private changeDetectorRef: ChangeDetectorRef,
        private bankCodeService: BankCodeService,
        private memberSettingsService: MemberSettingsServiceProxy,
        private profileService: ProfileService,
        public appSession: AppSessionService,
        public userManagementService: UserManagementService,
        public ls: AppLocalizationService
    ) {
        this.impersonationService = injector.get(ImpersonationService);
        this.commonUserInfoService = injector.get(CommonUserInfoServiceProxy);
    }

    ngOnInit() {
        this.showAccessCode$.pipe(first()).subscribe((showAccessCode: boolean) => {
            this.showAccessCode = showAccessCode;
        });
    }

    ngAfterViewInit() {
        $(this.topBarUserProfile.nativeElement)['mDropdown']().on('beforeShow', () => {
            if (!this.userManagementService.recentlyLinkedUsers) {
                this.userManagementService.getRecentlyLinkedUsers().subscribe((recentlyLinkedUsers: LinkedUserDto[]) => {
                    this.userManagementService.recentlyLinkedUsers = recentlyLinkedUsers;
                    this.dropdownMenuItems[1].submenuItems.items = this.userManagementService.recentlyLinkedUsers;
                    this.changeDetectorRef.detectChanges();
                });
            }
        });
        $(this.topBarUserProfile.nativeElement)['mDropdown']().on('afterHide', () => {
            this.closeBankCodeDialogs();
        });
    }

    private closeBankCodeDialogs() {
        if (this.bankCodeLetters) {
            this.bankCodeLetters.closeDialog();
        }
    }

    private getDropDownItems() {
        return this.featureCheckerService.isEnabled(AppFeatures.PFMApplications) && this.userManagementService.checkLendSpaceLayout()
            ? this.userManagementService.lendspaceDropDownItems
            : this.userManagementService.defaultDropDownItems;
    }

    menuItemClick(menuItem, event) {
        this.closeBankCodeDialogs();
        menuItem.onClick(event);
        this.elementRef.nativeElement.childNodes[0]
            .classList.remove('m-dropdown--open');
    }

    getScrollHeight() {
        let height = innerHeight - 170 - (this.userManagementService.checkBankCodeFeature() ? 38 : 0);
        return height > 490 ? '100%' : height;
    }

    accessCodeChanged(accessCode: string) {
        this.accessCode = accessCode;
        this.memberSettingsService.updateAffiliateCode(new UpdateUserAffiliateCodeDto({ affiliateCode: accessCode })).subscribe(
            () => {
                abp.notify.info(this.ls.l('AccessCodeUpdated'));
                this.appSession.user.affiliateCode = this.accessCode;
            },
            /** Update back if error comes */
            () => this.accessCode = this.appSession.user.affiliateCode
        );
    }

    onClick(e) {
        this.closeBankCodeDialogs();
        e.stopPropagation();
    }

    getDropdownHeaderStyle(): { [key: string]: string; } {
        let style;
        if (this.hasBankCodeFeature) {
            style = {
                background: (this.bankCode
                    ? this.bankCodeService.getBackgroundColorByLetter(this.bankCode[0] as BankCodeLetter)
                    : '#00aeef'
                ),
                boxShadow: 'none'
            };
        }
        return style;
    }

}
