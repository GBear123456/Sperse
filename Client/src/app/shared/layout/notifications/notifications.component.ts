import { Component, OnInit, Injector, ViewChild, ElementRef, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { NotificationServiceProxy, GetNotificationsOutput, UserNotification, State } from '@shared/service-proxies/service-proxies';
import { UserNotificationHelper, IFormattedUserNotification } from './UserNotificationHelper';
import { JTableHelper } from '@shared/helpers/JTableHelper';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppUserNotificationState } from '@shared/AppEnums';

import * as moment from 'moment';

@Component({
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.less'],
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class NotificationsComponent extends AppComponentBase implements AfterViewInit {

    @ViewChild('table') table: ElementRef;
    private _$table: JQuery;

    readStateFilter: string = 'ALL';
    loading: boolean = false;

    constructor(
        injector: Injector,
        private _notificationService: NotificationServiceProxy,
        private _userNotificationHelper: UserNotificationHelper
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        this._$table = $(this.table.nativeElement);
        this._$table.jtable({
            title: this.l('Notifications'),
            paging: true,

            actions: {
                listAction: (postData, jtParams: JTableParams) => {
                    return JTableHelper.toJTableListAction(
                        this._notificationService.getUserNotifications(
                            this.readStateFilter === 'ALL' ? undefined : AppUserNotificationState.Unread,
                            jtParams.jtPageSize,
                            jtParams.jtStartIndex
                        )
                    );
                }
            },

            fields: {
                id: {
                    key: true,
                    list: false
                },
                actions: {
                    title: this.l('Actions'),
                    width: '10%',
                    sorting: false,
                    listClass: 'text-center',
                    display: (data: JTableFieldOptionDisplayData<UserNotification>) => {
                        const $span = $('<span></span>');
                        var $button = $('<button class="btn btn-xs btn-primary blue" title="' + this.l('SetAsRead') + '"></button>')
                            .click((e) => {
                                e.preventDefault();
                                this.setNotificationAsRead(data.record, () => {
                                    $button.find('i')
                                        .removeClass('fa-circle-o')
                                        .addClass('fa-check');
                                    $button.attr('disabled', 'disabled');
                                });
                            }).appendTo($span);

                        var $i = $('<i class="fa" >').appendTo($button);

                        var notificationState = this._userNotificationHelper.format(<any>data.record).state;

                        if (notificationState === 'READ') {
                            $button.attr('disabled', 'disabled');
                            $i.addClass('fa-check');
                        }

                        if (notificationState === 'UNREAD') {
                            $i.addClass('fa-circle-o');
                        }

                        return $span;
                    }
                },
                notification: {
                    title: this.l('Notification'),
                    width: '70%',
                    display: (data: JTableFieldOptionDisplayData<UserNotification>) => {
                        var formattedRecord = this._userNotificationHelper.format(<any>data.record, false);
                        var rowClass = this.getRowClass(formattedRecord);

                        if (formattedRecord.url) {
                            return $('<a href="' + formattedRecord.url + '" class="' + rowClass + '">' + abp.utils.truncateStringWithPostfix(formattedRecord.text, 120) + '</a>');
                        } else {
                            return $('<span title="' + formattedRecord.text + '" class="' + rowClass + '">' + abp.utils.truncateStringWithPostfix(formattedRecord.text, 120) + '</span>');
                        }
                    }
                },
                creationTime: {
                    title: this.l('CreationTime'),
                    width: '20%',
                    display: (data: JTableFieldOptionDisplayData<UserNotification>) => {
                        var formattedRecord = this._userNotificationHelper.format(<any>data.record);
                        var rowClass = this.getRowClass(formattedRecord);
                        var $span = $('<span title="' + moment(data.record.notification.creationTime).format("llll") + '" class="' + rowClass + '">' + moment(data.record.notification.creationTime).fromNow() + '</span> &nbsp;');
                        $span.timeago();
                        return $span;
                    }
                }
            }
        });
        this.getNotifications();
    }

    getNotifications(): void {
        this._$table.jtable('load');
    }

    setAllNotificationsAsRead(): void {
        this._userNotificationHelper.setAllAsRead(() => {
            this.getNotifications();
        });
    }

    openNotificationSettingsModal(): void {
        this._userNotificationHelper.openSettingsModal();
    }

    setNotificationAsRead(userNotification: UserNotification, callback: () => void): void {
        this._userNotificationHelper
            .setAsRead(userNotification.id, () => {
                callback && callback();
            });
    }

    private getRowClass(formattedRecord: IFormattedUserNotification): string {
        return formattedRecord.state === 'READ' ? 'notification-read' : '';
    }
}