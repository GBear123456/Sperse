/** Core imports */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { 
    LayoutType, InstanceServiceProxy, NotificationServiceProxy, 
    TenantSubscriptionServiceProxy, UserNotificationDto, PaymentPeriodType,
    UserNotificationState, GetNotificationsOutput } from '@shared/service-proxies/service-proxies';
import { IFormattedUserNotification, UserNotificationHelper } from '../UserNotificationHelper';
import { PaymentWizardComponent } from '../../../common/payment-wizard/payment-wizard.component';
import { AppService } from '@app/app.service';
import { NotificationsComponent } from '@app/shared/layout/notifications/notifications.component';
import { AppPermissions } from '@shared/AppPermissions';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PermissionCheckerService } from 'abp-ng2-module';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppConsts } from '@shared/AppConsts';
import { LocalizationResolver } from '@shared/common/localization-resolver';

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
        private localizationResolver: LocalizationResolver,
        public ls: AppLocalizationService,
        public profileService: ProfileService
    ) {}

    ngOnInit(): void {
        this.loadNotifications();
        this.registerToEvents();
        this.getCurrentLoginInformations();

        setInterval(() => this.loadNotifications(), 1000 * 60 * 15 /*Reload every 15min*/);

        if (this.appService.moduleSubscriptions$)
            this.appService.moduleSubscriptions$.subscribe(() => this.getSubscriptionInfo());
        this.getSubscriptionInfo();
    }

    getSubscriptionInfo() {
        let subscriptionName = this.appService.getSubscriptionName();
        if (this.appService.checkSubscriptionIsTrial()) {
            let dayCount = this.appService.getSubscriptionExpiringDayCount();
            this.subscriptionInfoTitle = this.ls.l('YourTrialWillExpire', subscriptionName) + ' '
                + (!dayCount ? this.ls.l('Today') : (dayCount === 1 ? this.ls.l('Tomorrow') : ('in ' + dayCount.toString() + ' ' + this.ls.l('Periods_Day_plural')))).toLowerCase()
                + '!';
        } else if (this.appService.subscriptionInGracePeriod()) {
            let dayCount = this.appService.getGracePeriodDayCount();
            this.subscriptionInfoTitle = this.ls.l('ModuleExpired', subscriptionName, this.appService.getSubscriptionStatusByModuleName());
            this.subscriptionInfoText = this.ls.l('GracePeriodNotification', (
                dayCount
                ? dayCount === 1 ? this.ls.l('Tomorrow') : this.ls.l('PeriodDescription', dayCount.toString(), this.ls.l('Periods_Day_plural'))
                : this.ls.l('Today')
            ).toLowerCase());
        } else if (!this.appService.hasModuleSubscription()) {
            this.subscriptionInfoTitle = this.ls.l('ModuleExpired', subscriptionName, this.appService.getSubscriptionStatusByModuleName());
        } else {
            this.subscriptionInfoTitle = this.ls.l(
                'YouAreUsingPlan',
                subscriptionName
            );
        }
        return this.subscriptionInfoTitle;
    }

    getCurrentLoginInformations(): void {
        this.shownLoginInfo = this.appSession.getShownLoginInfo();
    }

    loadNotifications(): void {
        this.notificationService.getUserNotifications(UserNotificationState.Unread, undefined, undefined, 3, 0).subscribe((result: GetNotificationsOutput) => {
            this.checkLocalizations(result.items).subscribe(() => {
                this.unreadNotificationCount = result.items.length;
                this.notifications = [];
                $.each(result.items, (index, item: UserNotificationDto) => {
                    this.notifications.push(this.userNotificationHelper.format(<any>item));
                });
            });
        });
    }

    checkLocalizations(items: UserNotificationDto[]) : Observable<boolean> {
        let localizationSources = new Set<string>();
        items.filter(v => v.notification.data.type == 'Abp.Notifications.LocalizableMessageNotificationData').forEach(v => {
            var message = v.notification.data['message'] || v.notification.data.properties.Message;
            if (message.sourceName != AppConsts.localization.defaultLocalizationSourceName) {
                localizationSources.add(message.sourceName);
            }
        });

        if (localizationSources.size == 0)
            return of(true);

        let calls: Observable<boolean>[] = [];
        localizationSources.forEach(v => calls.push(this.localizationResolver.checkLoadLocalization(v)));
        return forkJoin(calls).pipe(map(v => true));
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
        return !this.appService.hasUnconventionalSubscription()
            && this.permission.isGranted(AppPermissions.AdministrationTenantSubscriptionManagement)
            && (!this.appSession.tenant.customLayoutType || this.appSession.tenant.customLayoutType == LayoutType.Default);
    }

    prolongButtonVisible(): boolean {
        let subscription = this.appService.getModuleSubscription();
        return !subscription || subscription.statusId == 'C' || this.isOneTimeSubscription();
    }

    isOneTimeSubscription(): boolean {
        let subscription = this.appService.getModuleSubscription();
        return subscription.paymentPeriodType == PaymentPeriodType.OneTime;
    }    

    hideDropDown() {
        let element: any = $('#header_notification_bar');
        let dropDown = element.mDropdown();
        dropDown && dropDown.hide();
    }

    openPaymentWizardDialog(e, showSubscriptions = false) {
        this.hideDropDown();
        this.dialog.open(PaymentWizardComponent, {
            height: '800px',
            width: '1200px',
            id: 'payment-wizard',
            panelClass: ['payment-wizard', 'setup'],
            data: {
                showSubscriptions: showSubscriptions,
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