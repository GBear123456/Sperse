import { Component, Injector, OnInit, ViewEncapsulation } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { NotificationServiceProxy, UserNotification } from '@shared/service-proxies/service-proxies';
import { IFormattedUserNotification, UserNotificationHelper } from './UserNotificationHelper';
import { PaymentWizardComponent } from '../../common/payment-wizard/payment-wizard.component';
import { AppService } from '@app/app.service';
import { MatDialog } from '@angular/material';

@Component({
    templateUrl: './header-notifications.component.html',
    styleUrls: ['./header-notifications.component.less'],
    selector: '[headerNotifications]',
    encapsulation: ViewEncapsulation.None
})
export class HeaderNotificationsComponent extends AppComponentBase implements OnInit {

    notifications: IFormattedUserNotification[] = [];
    unreadNotificationCount = 0;

    shownLoginInfo: { fullName, email, tenantName?};
    tenancyName = '';
    userName = '';

    subscriptionInfoTitle: string;
    subscriptionInfoText: string;

    profileThumbnailId: string;
    defaultLogo = './assets/common/images/app-logo-on-' + this.ui.getAsideSkin() + '.png';
    subscriptionExpiringDayCount = null;

    constructor(
        injector: Injector,
        private _dialog: MatDialog,
        private _notificationService: NotificationServiceProxy,
        private _userNotificationHelper: UserNotificationHelper,
        private _appService: AppService,
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.loadNotifications();
        this.registerToEvents();
        this.getCurrentLoginInformations();

        if (this._appService.moduleSubscriptions$) {
            this._appService.subscribeModuleChange((config) => this.getSubscriptionInfo(config['name']));
            this._appService.moduleSubscriptions$.subscribe(() => this.getSubscriptionInfo());
        }
        this.getSubscriptionInfo();
    }

    getSubscriptionInfo(module = null) {
        this.subscriptionExpiringDayCount = -1;
        module = module || this._appService.getModule().toUpperCase();
        if (this._appService.checkSubscriptionIsFree(module)) {
            this.subscriptionInfoTitle = this.l("YouAreUsingTheFreePlan", module);
            this.subscriptionInfoText = this.l("UpgradeToUnlockAllOurFeatures");
        } else if (!this._appService.hasModuleSubscription(module)) {
            this.subscriptionInfoTitle = this.l("YourTrialHasExpired", module);
            this.subscriptionInfoText = this.l("ChoosePlanToContinueService");
        } else if (this._appService.subscriptionInGracePeriod(module)) {
            let dayCount = this._appService.getGracePeriodDayCount(module);
            this.subscriptionInfoTitle = this.l("YourTrialHasExpired", module);
            this.subscriptionInfoText = this.l("GracePeriodNotification", (dayCount ?
                (this.l('PeriodDescription', dayCount,
                    this.l(dayCount === 1 ? 'Tomorrow' : 'Periods_Day_plural'))
                ) : this.l('Today')).toLowerCase());
        } else {
            let dayCount = this._appService.getSubscriptionExpiringDayCount(module);
            if (!dayCount && dayCount !== 0) {
                this.subscriptionExpiringDayCount = null;
            } else {
                if (dayCount >= 0 && dayCount <= 15) {
                    this.subscriptionInfoText = this.l("ChoosePlanThatsRightForYou");
                    this.subscriptionInfoTitle = this.l("YourTrialWillExpire", module) + " "
                        + (!dayCount ? this.l("Today") : (dayCount === 1 ? this.l("Tomorrow") : ("in " + dayCount.toString() + " " + this.l("Periods_Day_plural")))).toLowerCase()
                        + "!";
                } else {
                    var subscription = this._appService.getModuleSubscription(module);
                    if (subscription) {
                        this.subscriptionInfoText = this.l("UpgradOrChangeYourPlanAnyTime");
                        this.subscriptionInfoTitle = this.l("YouAreUsingPlan", subscription.editionName);
                    }
                    else {
                        this.subscriptionExpiringDayCount = null;
                    }
                }
            }
        }
        return this.subscriptionInfoTitle;
    }

    getCurrentLoginInformations(): void {
        this.shownLoginInfo = this.appSession.getShownLoginInfo();
        this.profileThumbnailId = this.appSession.user.profileThumbnailId;
    }

    hideDropDown() {
        let element: any = $('#header_notification_bar');
        let dropDown = element.mDropdown();
        dropDown && dropDown.hide();
    }

    loadNotifications(): void {
        this._notificationService.getUserNotifications(undefined, 3, 0).subscribe(result => {
            this.unreadNotificationCount = result.unreadCount;
            this.notifications = [];
            $.each(result.items, (index, item: UserNotification) => {
                this.notifications.push(this._userNotificationHelper.format(<any>item));
            });
        });
    }

    registerToEvents() {
        abp.event.on('abp.notifications.received', userNotification => {
            this._userNotificationHelper.show(userNotification);
            this.loadNotifications();
        });

        abp.event.on('app.notifications.refresh', () => {
            this.loadNotifications();
        });

        abp.event.on('app.notifications.read', userNotificationId => {
            for (let i = 0; i < this.notifications.length; i++) {
                if (this.notifications[i].userNotificationId === userNotificationId) {
                    this.notifications[i].state = 'READ';
                }
            }

            this.unreadNotificationCount -= 1;
        });
    }

    setAllNotificationsAsRead(): void {
        this._userNotificationHelper.setAllAsRead();
    }

    openNotificationSettingsModal(): void {
        this._userNotificationHelper.openSettingsModal();
    }

    setNotificationAsRead(userNotification: IFormattedUserNotification): void {
        this._userNotificationHelper.setAsRead(userNotification.userNotificationId);
    }

    gotoUrl(url): void {
        if (url) {
            location.href = url;
        }
    }

    subscriptionStatusBarVisible(): boolean {
        return this._appService.checkModuleSubscriptionEnabled() && this.subscriptionExpiringDayCount && this.permission.isGranted("Pages.Administration.Tenant.SubscriptionManagement");
    }

    openPaymentWizardDialog() {
        this._dialog.open(PaymentWizardComponent, {
            height: '655px',
            width: '980px',
            id: 'payment-wizard',
            panelClass: ['payment-wizard', 'setup'],
            data: { module: this._appService.getModule().toUpperCase() }
        }).afterClosed().subscribe(result => { });
    }
}
