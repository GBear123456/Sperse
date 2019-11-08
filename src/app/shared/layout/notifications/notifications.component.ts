/** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, ViewEncapsulation, OnInit, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { NotificationServiceProxy, UserNotificationDto } from '@shared/service-proxies/service-proxies';
import { IFormattedUserNotification, UserNotificationHelper } from './UserNotificationHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.less'],
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;
    notifications: IFormattedUserNotification[] = [];
    unreadNotificationCount = 0;
    readStateFilter = 'ALL';
    loading = false;
    selectBoxList = [
        { value: 'ALL', text: this.ls.l('All') },
        { value: 'UNREAD', text: this.ls.l('Unread') }
    ];

    constructor(
        private dialog: MatDialog,
        private notificationService: NotificationServiceProxy,
        private userNotificationHelper: UserNotificationHelper,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.loadNotifications();
        this.registerToEvents();
    }

    loadNotifications(): void {
        this.modalDialog.startLoading();
        this.notificationService.getUserNotifications(undefined, 3, 0)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(result => {
                this.unreadNotificationCount = result.unreadCount;
                this.notifications = [];
                $.each(result.items, (index, item: UserNotificationDto) => {
                    this.notifications.push(this.userNotificationHelper.format(<any>item, false));
                });
                this.changeDetectorRef.detectChanges();
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
            for (let i = 0; i < this.notifications.length; i++) {
                if (this.notifications[i].userNotificationId === userNotificationId) {
                    this.notifications[i].state = 'READ';
                }
            }

            this.unreadNotificationCount -= 1;
            this.changeDetectorRef.detectChanges();
        });
    }

    setAllNotificationsAsRead(): void {
        this.userNotificationHelper.setAllAsRead();
    }

    openNotificationSettingsModal(e): void {
        this.dialog.closeAll();
        this.userNotificationHelper.openSettingsModal(e);
    }

    setNotificationAsRead(userNotification: IFormattedUserNotification): void {
        this.userNotificationHelper.setAsRead(userNotification.userNotificationId);
    }

    gotoUrl(url): void {
        if (url) {
            location.href = url;
        }
    }
}
