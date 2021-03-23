/** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, ViewEncapsulation, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import DataSource from 'devextreme/data/data_source';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { appModuleAnimation } from '@shared/animations/routerTransition';
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
            return this.notificationService.getUserNotifications(
                this.readStateFilter,
                loadOptions.take,
                loadOptions.skip
            ).pipe(
                finalize(() => this.modalDialog.finishLoading()),
            ).toPromise().then((notificationsOutput: GetNotificationsOutput) => {
                let notifications = [];
                notificationsOutput.items.forEach((item: UserNotificationDto) => {
                    notifications.push(this.userNotificationHelper.format(<any>item, false));
                });
                return {
                    data: notifications,
                    totalCount: notifications.length //TODO: separate AIP call needed for that (on grid view only)
                };
            });
        }
    });
    defaultGridPagerConfig = DataGridService.defaultGridPagerConfig;

    constructor(
        private dialog: MatDialog,
        private notificationService: NotificationServiceProxy,
        private userNotificationHelper: UserNotificationHelper,
        private router: Router,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.registerToEvents();
    }

    loadNotifications(): void {
        this.dataGrid.instance.refresh();
    }

    registerToEvents() {
        abp.event.on('abp.notifications.received', userNotification => {
            this.userNotificationHelper.show(userNotification);
            this.loadNotifications();
        });

        abp.event.on('app.notifications.refresh', () => {
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
        this.userNotificationHelper.setAllAsRead();
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
        this.gotoUrl(e.data.url);
    }

    gotoUrl(url: string): void {
        if (url) {
            this.router.navigateByUrl(url);
            this.dialog.closeAll();
        }
    }
}
