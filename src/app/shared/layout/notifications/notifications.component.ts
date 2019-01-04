import { Component, Injector, ViewChild, ViewEncapsulation, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { NotificationServiceProxy, UserNotification } from '@shared/service-proxies/service-proxies';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { IFormattedUserNotification, UserNotificationHelper } from './UserNotificationHelper';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.less'],
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class NotificationsComponent extends ModalDialogComponent implements OnInit {

    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;

    notifications: IFormattedUserNotification[] = [];
    unreadNotificationCount = 0;

    readStateFilter = 'ALL';
    loading = false;

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private _notificationService: NotificationServiceProxy,
        private _userNotificationHelper: UserNotificationHelper
    ) {
        super(injector);
        this.loadNotifications();
        this.registerToEvents();
    }

    ngOnInit() {
        super.ngOnInit();

        this.data.title = this.l('Notifications');
        this.data.editTitle = false;
        this.data.titleClearButton = false;
        this.data.placeholder = this.l('Notifications');

        this.data.buttons = [];
    }

    loadNotifications(): void {
        this._notificationService.getUserNotifications(undefined, 3, 0).subscribe(result => {
            this.unreadNotificationCount = result.unreadCount;
            this.notifications = [];
            $.each(result.items, (index, item: UserNotification) => {
                this.notifications.push(this._userNotificationHelper.format(<any>item, false));
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

    openNotificationSettingsModal(e): void {
        this.dialog.closeAll();
        this._userNotificationHelper.openSettingsModal(e);
    }

    setNotificationAsRead(userNotification: IFormattedUserNotification): void {
        this._userNotificationHelper.setAsRead(userNotification.userNotificationId);
    }

}
