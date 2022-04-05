/** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, ViewEncapsulation, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import DataSource from 'devextreme/data/data_source';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { NotificationServiceProxy, UserNotificationDto } from '@shared/service-proxies/service-proxies';
import { IFormattedUserNotification, UserNotificationHelper } from './UserNotificationHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { GetNotificationsOutput, UserNotificationState } from '../../../../shared/service-proxies/service-proxies';
import { DataGridService } from '../../common/data-grid.service/data-grid.service';
import { DxDataGridComponent } from 'devextreme-angular';

@Component({
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.less'],
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

    totalCount: number;
    readStateFilter: UserNotificationState;
    loading = false;
    selectBoxList = [
        { value: undefined, text: this.ls.l('All') },
        { value: UserNotificationState._0, text: this.ls.l('Unread') },
        { value: UserNotificationState._1, text: this.ls.l('Read') }
    ];
    notificationsDataSource = new DataSource({
        key: 'userNotificationId',
        load: (loadOptions) => {
            this.modalDialog.startLoading();
            this.processToalCountRequest();
            return this.notificationService.getUserNotifications(
                this.readStateFilter,
                loadOptions.take,
                loadOptions.skip
            ).pipe(
                finalize(() => this.modalDialog.finishLoading())
            ).toPromise().then((notificationsOutput: GetNotificationsOutput) => {
                let notifications = [];
                notificationsOutput.items.forEach((item: UserNotificationDto) => {
                    notifications.push(this.userNotificationHelper.format(<any>item, false));
                });
                return notifications;
            });
        },
        totalCount: (loadOptions: any) => {
            return this.totalCount || loadOptions.take;
        }
    });
    defaultGridPagerConfig = DataGridService.defaultGridPagerConfig;

    private readonly CONTACT_ENTITY_TYPE = 'Sperse.CRM.Contacts.Entities.Contact';
    private readonly COMMUNICATION_MESSAGE_ENTITY_TYPE = 'Sperse.CRM.Contacts.Communication.CommunicationMessage';

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private itemDetailsService: ItemDetailsService,
        private notificationService: NotificationServiceProxy,
        public userNotificationHelper: UserNotificationHelper,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.registerToEvents();
    }

    processToalCountRequest() {
        if (!this.totalCount)
            this.notificationService.getUserNotificationCount(
                this.readStateFilter
            ).subscribe(totalCount => {
                this.notificationsDataSource['_totalCount'] = this.totalCount = totalCount;
                this.dataGrid.instance.repaint();
            });
    }

    loadNotifications(): void {
        this.totalCount = undefined;
        this.dataGrid.instance.refresh();
    }

    registerToEvents() {
        abp.event.on('abp.notifications.received', userNotification => {
            this.userNotificationHelper.show(userNotification);
            this.loadNotifications();
        });
                                          
        abp.event.on('app.notifications.read', (userNotificationId: number) => {
            /** If we show only unread - then reload list */
            if (this.readStateFilter === UserNotificationState._0) {
                this.loadNotifications();
            } else {
                /** Else just mark grid row as read */
                this.dataGrid.instance.cellValue(
                    this.dataGrid.instance.getRowIndexByKey(userNotificationId),
                    'state',
                    'READ'
                );
            }
        });
    }

    setAllNotificationsAsRead(e): void {
        this.userNotificationHelper.setAllAsRead(() => {
            this.dataGrid.instance.getVisibleRows().forEach(row => {
                row.data.state = abp.notifications.getUserNotificationStateAsString(Number(UserNotificationState._1));
                row.data.isUnread = false;
            });
            this.dataGrid.instance.repaint();
        });
        e.preventDefault();
        e.stopPropagation();
    }

    openNotificationSettingsModal(e): void {
        this.dialog.closeAll();
        this.userNotificationHelper.openSettingsModal(e);
    }

    setNotificationAsRead(e, userNotification: IFormattedUserNotification): void {
        this.userNotificationHelper.setAsRead(userNotification.userNotificationId);
        e.preventDefault();
        e.stopPropagation();
    }

    notificationClick(e) {
        let notification: IFormattedUserNotification = e.data;
        if (notification.entityId) {
            if (notification.entityTypeName == this.CONTACT_ENTITY_TYPE) {
                this.router.navigate(['app/crm/contact', notification.entityId]);
                setTimeout(() => this.itemDetailsService.clearItemsSource());
                this.dialog.closeAll();
            } else if (notification.entityTypeName == this.COMMUNICATION_MESSAGE_ENTITY_TYPE) {
                this.userNotificationHelper.navigateToUserInbox(notification);
                setTimeout(() => this.itemDetailsService.clearItemsSource());
                this.dialog.closeAll();
            }
        } else if (notification.url)
            this.gotoUrl(notification.url);
    }

    gotoUrl(url: string): void {
        if (url) {
            this.router.navigateByUrl(url);
            this.dialog.closeAll();
        }
    }
}