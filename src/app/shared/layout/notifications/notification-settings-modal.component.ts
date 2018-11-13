import { Component, Injector, ViewChild, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { GetNotificationSettingsOutput, NotificationServiceProxy, NotificationSubscriptionDto, UpdateNotificationSettingsInput } from '@shared/service-proxies/service-proxies';
import * as _ from 'lodash';
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'notificationSettingsModal',
    templateUrl: './notification-settings-modal.component.html',
    providers: [DialogService]
})
export class NotificationSettingsModalComponent extends ModalDialogComponent implements OnInit  {
    saving = false;

    settings: GetNotificationSettingsOutput;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _notificationService: NotificationServiceProxy
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
    }

    ngOnInit() {
        super.ngOnInit();

        this.data.title = this.l("NotificationSettings");
        this.data.editTitle = false;
        this.data.titleClearButton = false;
        this.data.placeholder = this.l('NotificationSettings');

        this.data.buttons = [{
            title: this.l('SaveAndClose'),
            class: 'primary menu',
            action: this.save.bind(this)
        }];

        this.getSettings(() => {});
    }

    onShown(): void {
        $('#ReceiveNotifications').bootstrapSwitch('state', this.settings.receiveNotifications);
        $('#ReceiveNotifications').bootstrapSwitch('onSwitchChange', (el, value) => {
            this.settings.receiveNotifications = value;
        });
    }

    save(): void {
        const input = new UpdateNotificationSettingsInput();
        input.receiveNotifications = this.settings.receiveNotifications;
        input.notifications = _.map(this.settings.notifications,
            (n) => {
                let subscription = new NotificationSubscriptionDto();
                subscription.name = n.name;
                subscription.isSubscribed = n.isSubscribed;
                return subscription;
            });

        this.saving = true;
        this._notificationService.updateNotificationSettings(input)
            .pipe(finalize(() => this.saving = false))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
            });
    }
    
    private getSettings(callback: () => void) {
        this._notificationService.getNotificationSettings().subscribe((result: GetNotificationSettingsOutput) => {
            this.settings = result;
            callback();
        });
    }
}
