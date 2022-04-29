/** Core imports */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { InstanceServiceProxy, NotificationServiceProxy, TenantSubscriptionServiceProxy, UserNotificationDto, UserNotificationState, GetNotificationsOutput } from '@shared/service-proxies/service-proxies';
import { IFormattedUserNotification, UserNotificationHelper } from '../UserNotificationHelper';
import { PaymentWizardComponent } from '../../../common/payment-wizard/payment-wizard.component';
import { AppService } from '@app/app.service';
import { NotificationsComponent } from '@app/shared/layout/notifications/notifications.component';
import { AppPermissions } from '@shared/AppPermissions';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PermissionCheckerService } from 'abp-ng2-module';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { ConfigInterface } from '@app/shared/common/config.interface';

@Component({
    templateUrl: './header-notifications.component.html',
    styleUrls: [
        '../../../../../shared/metronic/m-card-user.less',
        '../header-notifications/header-notifications.component.less'
    ],
    selector: '[headerNotifications]',
    encapsulation: ViewEncapsulation.None,
    providers: [ InstanceServiceProxy, TenantSubscriptionServiceProxy ]
})
export class HeaderNotificationsComponent implements OnInit {
    notifications: IFormattedUserNotification[] = [];
    get unreadNotificationCount(): number {
        return this.userNotificationHelper.unreadNotificationCount;
    }
    set unreadNotificationCount(val: number) {
        this.userNotificationHelper.unreadNotificationCount = val;
    }
    shownLoginInfo: { fullName, email, tenantName?};
    tenancyName = '';
    userName = '';
    subscriptionInfoTitle: string;
    subscriptionInfoText: string;
    subscriptionExpiringDayCount = null;

    private readonly CONTACT_ENTITY_TYPE = 'Sperse.CRM.Contacts.Entities.Contact';
    private readonly COMMUNICATION_MESSAGE_ENTITY_TYPE = 'Sperse.CRM.Contacts.Communication.CommunicationMessage';

    constructor(
        private dialog: MatDialog,
        private notificationService: NotificationServiceProxy,
        private userNotificationHelper: UserNotificationHelper,
        private itemDetailsService: ItemDetailsService,
        private appService: AppService,
        private appSession: AppSessionService,
        private permission: PermissionCheckerService,
        private router: Router,
        public ls: AppLocalizationService,
        public profileService: ProfileService
    ) {}

    ngOnInit(): void {
        this.loadNotifications();
        this.registerToEvents();
        this.getCurrentLoginInformations();

        setInterval(() => this.loadNotifications(), 1000 * 60 * 15 /*Reload every 15min*/);

        if (this.appService.moduleSubscriptions$) {
            this.appService.subscribeModuleChange((config: ConfigInterface) => this.getSubscriptionInfo(config.name));
            this.appService.moduleSubscriptions$.subscribe(() => this.getSubscriptionInfo());
        }
        this.getSubscriptionInfo();
    }

    getSubscriptionInfo(module = null) {
        this.subscriptionExpiringDayCount = -1;
        module = module || this.appService.getModule().toUpperCase();
        let subscriptionName = this.appService.getSubscriptionName(module);
        if (this.appService.checkSubscriptionIsFree(module)) {
            this.subscriptionInfoTitle = this.ls.l('YouAreUsingTheFreePlan', subscriptionName);
            this.subscriptionInfoText = this.ls.l('UpgradeToUnlockAllOurFeatures');
        } else if (this.appService.subscriptionInGracePeriod(module)) {
            let dayCount = this.appService.getGracePeriodDayCount(module);
            this.subscriptionInfoTitle = this.ls.l('ModuleExpired', subscriptionName, this.appService.getSubscriptionStatusByModuleName(module));
            this.subscriptionInfoText = this.ls.l('GracePeriodNotification', (
                dayCount
                ? dayCount === 1 ? this.ls.l('Tomorrow') : this.ls.l('PeriodDescription', dayCount.toString(), this.ls.l('Periods_Day_plural'))
                : this.ls.l('Today')
            ).toLowerCase());
        } else if (!this.appService.hasModuleSubscription(module)) {
            this.subscriptionInfoTitle = this.ls.l('ModuleExpired', subscriptionName, this.appService.getSubscriptionStatusByModuleName(module));
            this.subscriptionInfoText = this.ls.l('ChoosePlanToContinueService');
        } else {
            let dayCount = this.appService.getSubscriptionExpiringDayCount(module);
            if (!dayCount && dayCount !== 0) {
                this.subscriptionExpiringDayCount = null;
            } else {
                if (dayCount >= 0 && dayCount <= 15) {
                    this.subscriptionInfoText = this.ls.l('ChoosePlanThatsRightForYou');
                    this.subscriptionInfoTitle = this.ls.l('YourTrialWillExpire', subscriptionName) + ' '
                        + (!dayCount ? this.ls.l('Today') : (dayCount === 1 ? this.ls.l('Tomorrow') : ('in ' + dayCount.toString() + ' ' + this.ls.l('Periods_Day_plural')))).toLowerCase()
                        + '!';
                } else {
                    const subscription = this.appService.getModuleSubscription(module);
                    if (subscription) {
                        this.subscriptionInfoText = this.ls.l('UpgradOrChangeYourPlanAnyTime');
                        this.subscriptionInfoTitle = this.ls.l(
                            'YouAreUsingPlan',
                            subscription.editionName
                        );
                    } else {
                        this.subscriptionExpiringDayCount = null;
                    }
                }
            }
        }
        if (this.appService.subscriptionIsLocked(module)) {
            this.subscriptionInfoText = this.ls.l('SubscriptionWillBeRenewed');
        }
        return this.subscriptionInfoTitle;
    }

    getCurrentLoginInformations(): void {
        this.shownLoginInfo = this.appSession.getShownLoginInfo();
    }

    loadNotifications(): void {
        this.notificationService.getUserNotifications(UserNotificationState.Unread, undefined, undefined, 3, 0).subscribe((result: GetNotificationsOutput) => {
            this.unreadNotificationCount = result.items.length;
            this.notifications = [];
            $.each(result.items, (index, item: UserNotificationDto) => {
                this.notifications.push(this.userNotificationHelper.format(<any>item));
            });
        });
    }

    registerToEvents() {
        abp.event.on('abp.notifications.received', userNotification => {
            this.userNotificationHelper.show(userNotification);
            this.loadNotifications();
        });

        abp.event.on('app.notifications.refresh', () => {
            this.loadNotifications();
        });

        abp.event.on('app.notifications.read', userNotificationId => {
            this.unreadNotificationCount -= 1;
            if (this.unreadNotificationCount <= 0)
                this.loadNotifications();
            else {
                this.notifications.some(notification => {
                    if (notification.userNotificationId === userNotificationId) {
                        notification.isUnread = false;
                        notification.state = 'READ';
                        return true;
                    }
                });
            }
        });
    }

    setAllNotificationsAsRead(): void {
        this.userNotificationHelper.setAllAsRead();
    }

    openNotificationSettingsModal(e): void {
        this.hideDropDown();
        this.userNotificationHelper.openSettingsModal(e);
    }

    setNotificationAsRead(userNotification: IFormattedUserNotification): void {
        this.userNotificationHelper.setAsRead(userNotification.userNotificationId);
    }

    onNotificationClick(notification: any): void {
        if (notification.entityId) {
            if (notification.entityTypeName == this.CONTACT_ENTITY_TYPE) {
                this.router.navigate(['app/crm/contact', notification.entityId]);
                setTimeout(() => this.itemDetailsService.clearItemsSource());
            } else if (notification.entityTypeName == this.COMMUNICATION_MESSAGE_ENTITY_TYPE) {
                this.userNotificationHelper.navigateToUserInbox(notification);
                setTimeout(() => this.itemDetailsService.clearItemsSource());
            }
        } else if (notification.url) {
            this.router.navigateByUrl(notification.url);
        }
        this.hideDropDown();
    }

    subscriptionStatusBarVisible(): boolean {
        const moduleSubscription = this.appService.getModuleSubscription();
        return this.appService.checkModuleSubscriptionEnabled() && this.subscriptionExpiringDayCount && this.permission.isGranted(AppPermissions.AdministrationTenantSubscriptionManagement) && moduleSubscription && moduleSubscription.isUpgradable && !this.appService.hasRecurringBilling(moduleSubscription);
    }

    hideDropDown() {
        let element: any = $('#header_notification_bar');
        let dropDown = element.mDropdown();
        dropDown && dropDown.hide();
    }

    openPaymentWizardDialog(e) {
        this.hideDropDown();
        this.dialog.open(PaymentWizardComponent, {
            height: '800px',
            width: '1200px',
            id: 'payment-wizard',
            panelClass: ['payment-wizard', 'setup'],
            data: {
                module: this.appService.getModuleSubscription().module,
                title: this.subscriptionInfoTitle,
                subtitle: this.subscriptionInfoText
            }
        }).afterClosed().subscribe(() => { });
        e.stopPropagation && e.stopPropagation();
    }

    openAllNotifications(e): void {
        this.hideDropDown();
        this.dialog.open(NotificationsComponent, {
            panelClass: ['slider', 'notification-modal'],
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }
}
