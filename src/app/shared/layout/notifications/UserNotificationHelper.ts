/** Core imports */
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import * as Push from 'push.js'; // if using ES6
import * as moment from 'moment';

/** Application imports */
import { GuidEntityDto, NotificationServiceProxy } from '@shared/service-proxies/service-proxies';
import { NotificationSettingsModalComponent } from './notification-settings-modal/notification-settings-modal.component';

export interface IFormattedUserNotification {
    userNotificationId: string;
    text: string;
    time: string;
    creationTime: Date;
    icon: string;
    state: String;
    data: any;
    url: string;
    isUnread: boolean;
}

@Injectable()
export class UserNotificationHelper {
    constructor(
        private dialog: MatDialog,
        private notificationService: NotificationServiceProxy,
        private router: Router
    ) {}

    private static getUrl(userNotification: abp.notifications.IUserNotification): string {
        switch (userNotification.notification.notificationName) {
            case 'App.NewUserRegistered':
                return '/app/admin/users?filterText=' + userNotification.notification.data.properties.emailAddress;
            case 'App.NewTenantRegistered':
                return '/app/admin/tenants?name=' + userNotification.notification.data.properties.tenancyName;
            //Add your custom notification names to navigate to a URL when user clicks to a notification.
        }

        //No url for this notification
        return '';
    }

    private static getUiIconBySeverity(severity: abp.notifications.severity): string {
        switch (severity) {
            case abp.notifications.severity.SUCCESS:
                return 'fa fa-check';
            case abp.notifications.severity.WARN:
                return 'fa fa-warning';
            case abp.notifications.severity.ERROR:
                return 'fa fa-bolt';
            case abp.notifications.severity.FATAL:
                return 'fa fa-bomb';
            case abp.notifications.severity.INFO:
            default:
                return 'fa fa-info';
        }
    }

    /* PUBLIC functions ******************************************/

    format(userNotification: abp.notifications.IUserNotification, truncateText?: boolean): IFormattedUserNotification {
        let formatted: IFormattedUserNotification = {
            userNotificationId: userNotification.id,
            text: abp.notifications.getFormattedMessageFromUserNotification(userNotification),
            time: moment(userNotification.notification.creationTime).format('YYYY-MM-DD HH:mm:ss'),
            creationTime: userNotification.notification.creationTime,
            icon: UserNotificationHelper.getUiIconBySeverity(userNotification.notification.severity),
            state: abp.notifications.getUserNotificationStateAsString(userNotification.state),
            data: userNotification.notification.data,
            url: UserNotificationHelper.getUrl(userNotification),
            isUnread: userNotification.state === abp.notifications.userNotificationState.UNREAD
        };

        if (truncateText || truncateText === undefined) {
            formatted.text = abp.utils.truncateStringWithPostfix(formatted.text, 100);
        }

        return formatted;
    }

    show(userNotification: abp.notifications.IUserNotification): void {

        //Application notification
        abp.notifications.showUiNotifyForUserNotification(userNotification, {
            'onclick': () => {
                //Take action when user clicks to live toastr notification
                let url = UserNotificationHelper.getUrl(userNotification);
                if (url) {
                    this.router.navigateByUrl(url);
                }
            }
        });

        //Desktop notification
        Push.create('Platform', {
            body: this.format(userNotification).text,
            icon: './assets/common/images/app-logo-small.png',
            timeout: 6000,
            onClick: function () {
                window.focus();
                this.close();
            }
        });
    }

    setAllAsRead(callback?: () => void): void {
        this.notificationService.setAllNotificationsAsRead().subscribe(() => {
            abp.event.trigger('app.notifications.refresh');
            if (callback) {
                callback();
            }
        });
    }

    setAsRead(userNotificationId: string, callback?: (userNotificationId: string) => void): void {
        const input = new GuidEntityDto();
        input.id = userNotificationId;
        this.notificationService.setNotificationAsRead(input).subscribe(() => {
            abp.event.trigger('app.notifications.read', userNotificationId);
            if (callback) {
                callback(userNotificationId);
            }
        });
    }

    openSettingsModal(e): void {
        this.dialog.open(NotificationSettingsModalComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }
}
