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
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, zip } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { AppService } from '@app/app.service';
import { ImpersonationService } from 'app/admin/users/impersonation.service';
import {
    CommonUserInfoServiceProxy,
    LayoutType,
    LinkedUserDto,
    UnlinkUserInput,
    MemberSettingsServiceProxy,
    UserLinkServiceProxy
} from 'shared/service-proxies/service-proxies';
import { UserNotificationHelper } from '@app/shared/layout/notifications/UserNotificationHelper';
import { LinkedAccountService } from '@app/shared/layout/linked-accounts-modal/linked-account.service';
import { UserManagementService } from 'shared/common/layout/user-management-list/user-management.service';
import { UserDropdownMenuItemType } from 'shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item-type';
import { UserDropdownMenuItemModel } from 'shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item.model';
/** @todo Used for chart bar and dropdown. Reimplement in future */
import 'assets/metronic/src/js/framework/base/util.js';
import 'assets/metronic/src/js/framework/components/general/dropdown.js';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppFeatures } from '@shared/AppFeatures';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { AppPermissions } from '@shared/AppPermissions';
import { PermissionCheckerService } from 'abp-ng2-module';
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';
import { PaymentWizardComponent } from '@app/shared/common/payment-wizard/payment-wizard.component';
import { CreateEntityDialogComponent } from '@shared/common/create-entity-dialog/create-entity-dialog.component';
import { BankCodeLettersComponent } from '@app/shared/common/bank-code-letters/bank-code-letters.component';
import { LinkAccountModalComponent } from '@app/shared/layout/link-account-modal/link-account-modal.component';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { environment } from '@root/environments/environment';
import { UserHelper } from '@app/shared/helpers/UserHelper';
import { AppConsts } from '@shared/AppConsts';

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
    @Input() showSquareIcon: boolean = false;
    @Input() dropdownMenuItems: UserDropdownMenuItemModel[] = this.getDropDownItems();
    private impersonationService: ImpersonationService;
    private commonUserInfoService: CommonUserInfoServiceProxy;

    appFeatures = AppFeatures;
    appPermissions = AppPermissions;
    calendlyUri = AppConsts.calendlyUri;
    isHostTenant = abp.session.tenantId;

    isListScrollInProgress = false;
    profileThumbnailId = this.appSession.user.profileThumbnailId;
    shownLoginInfo: { fullName, email, tenantName? } = this.appSession.getShownLoginInfo();
    menuItemTypes = UserDropdownMenuItemType;
    bankCode: string = this.appSession.user.bankCode;
    bankCodeColor: string = this.bankCode
        ? this.bankCodeService.getBackgroundColorByLetter(this.bankCode[0] as BankCodeLetter)
        : '#000';
    accessCode$ = this.profileService.accessCode$;
    accessCodeValidationRules = [
        {
            type: 'pattern',
            pattern: AppConsts.regexPatterns.affiliateCode,
            message: this.ls.l('AccessCodeIsNotValid')
        },
        {
            type: 'stringLength',
            max: AppConsts.maxAffiliateCodeLength,
            message: this.ls.l('MaxLengthIs', AppConsts.maxAffiliateCodeLength)
        }
    ];
    hasBankCodeFeature: boolean = this.userManagementService.checkBankCodeFeature();
    showAccessCode$: Observable<boolean> = this.appSession.tenant && this.appSession.tenant.customLayoutType === LayoutType.BankCode
        ? zip(
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass),
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKAffiliate),
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKVault),
            this.profileService.checkServiceSubscription(BankCodeServiceType.Connect)
        ).pipe(
            map((res: boolean[]) => res.some(Boolean))
        )
        : of(false);
    showAccessCode = false;
    isAccessCodeTooltipVisible = false;
    dropdownHeaderStyle: { [key: string]: string } = this.getDropdownHeaderStyle();
    linkedAccountsCount: number;
    linkedAccounts: LinkedUserDto[]; 

    actionEvent: any;
    actionMenuGroups: ActionMenuItem[] = [
        {
            text: this.ls.l('Login'),
            class: 'login',
            action: () => {
                this.switchToUser(this.actionEvent);
            }
        },
        {
            text: this.ls.l('Unlink'),
            class: 'delete',
            action: () => {
                this.deleteLinkedUser(this.actionEvent);
            }
        }
    ];
    isCustomLayout = this.appSession.tenant && 
        this.appSession.tenant.customLayoutType &&
        this.appSession.tenant.customLayoutType != LayoutType.Default;
    subscriptions: string;

    isAccountSettingsEnabled = 
        this.permissionChecker.isGranted(AppPermissions.AdministrationTenantSettings) ||
        this.permissionChecker.isGranted(AppPermissions.AdministrationHostSettings) || 
        this.permissionChecker.isGranted(AppPermissions.AdministrationTenantHosts);

    enabledAdminCustomizations = this.featureCheckerService.isEnabled(AppFeatures.AdminCustomizations);
    enabledPortal = this.featureCheckerService.isEnabled(AppFeatures.Portal);

    appMemberPortalUrl = 
        (this.enabledAdminCustomizations && AppConsts.appMemberPortalUrl) || 
        (this.enabledPortal && environment.portalUrl);

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private elementRef: ElementRef,
        private applicationRef: ApplicationRef,
        public featureCheckerService: FeatureCheckerService,
        public permissionChecker: PermissionCheckerService,
        private changeDetectorRef: ChangeDetectorRef,
        private bankCodeService: BankCodeService,
        private memberSettingsService: MemberSettingsServiceProxy,
        private userLinkService: UserLinkServiceProxy,
        private linkedAccountService: LinkedAccountService,
        public router: Router,
        public appService: AppService,
        public userManagementService: UserManagementService,
        public userNotificationHelper: UserNotificationHelper,
        public profileService: ProfileService,
        public appSession: AppSessionService,
        public layoutService: LayoutService,
        public ls: AppLocalizationService
    ) {
        this.impersonationService = injector.get(ImpersonationService);
        this.commonUserInfoService = injector.get(CommonUserInfoServiceProxy);

        this.initLinkedUsers();
    }

    ngOnInit() {
        if (this.appService.moduleSubscriptions$)
            this.appService.moduleSubscriptions$.subscribe(
                () => this.initSubscriptionInfo());

        this.showAccessCode$.subscribe((showAccessCode: boolean) => {
            this.showAccessCode = showAccessCode;
        });
    }

    initSubscriptionInfo() {
        if (this.appService.moduleSubscriptions)
            this.subscriptions = this.appService.moduleSubscriptions.filter(
                sub => sub.statusId == 'A').map(sub => sub.productName).join(', ');
    }

    ngAfterViewInit() {
        let dialog = $(this.topBarUserProfile.nativeElement)['mDropdown']();
        dialog.on('beforeShow', () => {
            if (!this.userManagementService.recentlyLinkedUsers) {
                this.userManagementService.getRecentlyLinkedUsers().subscribe((recentlyLinkedUsers: LinkedUserDto[]) => {
                    this.userManagementService.recentlyLinkedUsers = recentlyLinkedUsers;
                    let linkedAccountsMenu = this.dropdownMenuItems[1];
                    linkedAccountsMenu.submenuItems.items = this.userManagementService.recentlyLinkedUsers;
                    linkedAccountsMenu.disabled = !linkedAccountsMenu.visible;
                    linkedAccountsMenu.visible = !!recentlyLinkedUsers &&
                        !!recentlyLinkedUsers.length || linkedAccountsMenu.visible;
                    this.changeDetectorRef.detectChanges();
                });
            }
        });
        dialog.on('beforeHide', (e) => {
            if (this.isListScrollInProgress) {
                return this.isListScrollInProgress = false;
            }
            return this.closeBankCodeDialogs();
        });
    }
    
    private closeBankCodeDialogs() {
        if (this.bankCodeLetters) {
            if (this.bankCodeLetters.editPopupIsOpened) {
                return false;
            }
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
        this.close();
    }

    getScrollHeight() {
        let height = innerHeight - 170 - (this.userManagementService.checkBankCodeFeature() ? 38 : 0);
        return height > 490 ? '100%' : height;
    }

    accessCodeChanged(accessCode: string) {
        this.profileService.updateAccessCode(accessCode);
    }

    onClick(e) {
        this.closeBankCodeDialogs();
        e.stopPropagation();
    }

    onInstructionsClick(e) {
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

    bankCodeChange() {
        this.dropdownHeaderStyle = this.getDropdownHeaderStyle();
    }

    getUserNameFirstLatters(name?: string) {
        let parts = (name || this.shownLoginInfo.fullName).split(' ');
        return (parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '');
    }

    initLinkedUsers() {
        this.userLinkService.getLinkedUsers(100, 0, '').subscribe(result => {
            this.linkedAccountsCount = result.totalCount;
            this.linkedAccounts = result.items;
        });
    }

    getShownLinkedUserName(linkedUser: LinkedUserDto): string {
        return UserHelper.getShownUserName(linkedUser.username, linkedUser.tenantId, linkedUser.tenancyName);
    }

    deleteLinkedUser(linkedUser: LinkedUserDto): void {
        abp.message.confirm(
            this.ls.l('LinkedUserDeleteWarningMessage', linkedUser.username), '',
            isConfirmed => {
                if (isConfirmed) {
                    const unlinkUserInput = new UnlinkUserInput();
                    unlinkUserInput.userId = linkedUser.id;
                    unlinkUserInput.tenantId = linkedUser.tenantId;
                    this.userLinkService.unlinkUser(unlinkUserInput)
                        .subscribe(() => {
                            abp.notify.success(this.ls.l('SuccessfullyUnlinked'));
                        });
                }
            }
        );
    }

    openPaymentWizardDialog(showPayments: boolean = false) {
        this.dialog.closeAll();
        this.dialog.open(PaymentWizardComponent, {
            height: '800px',
            width: '1200px',
            id: 'payment-wizard',
            panelClass: ['payment-wizard', 'setup'],
            data: {
                showPaymentsTab: showPayments,
                showSubscriptions: true
            }
        });
        this.close();
    }

    manageLinkedAccounts(): void {
        this.dialog.open(LinkAccountModalComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        }).afterClosed().subscribe(() => {
            this.initLinkedUsers();
        });
        this.close();
    }

    onListScroll() {
        this.isListScrollInProgress = true;
    }

    switchToUser(linkedUser: LinkedUserDto): void {
        this.linkedAccountService.switchToAccount(linkedUser.id, linkedUser.tenantId);
    }

    openLinkedAccountMenu(event, item) {
        this.actionEvent = item;
        event.stopPropagation();
    }

    onMenuHidden(event) {
        this.actionEvent = null;
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionEvent = null;
    }

    openLink(url) {
        window.open(url, '_blank');
        this.close();
    }

    close() {
        this.elementRef.nativeElement.childNodes[0]
            .classList.remove('m-dropdown--open');
    }
}