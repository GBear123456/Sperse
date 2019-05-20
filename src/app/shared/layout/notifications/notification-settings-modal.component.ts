/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import map from 'lodash/map';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { GetNotificationSettingsOutput, NotificationServiceProxy, NotificationSubscriptionDto, UpdateNotificationSettingsInput } from '@shared/service-proxies/service-proxies';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'notificationSettingsModal',
    templateUrl: './notification-settings-modal.component.html',
    styleUrls: [ '../../../../shared/metronic/m-checkbox.less' ],
    providers: [ DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationSettingsModalComponent implements OnInit  {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    settings: GetNotificationSettingsOutput;
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('SaveAndClose'),
            class: 'primary menu',
            action: this.save.bind(this)
        }
    ];
    constructor(
        private dialog: MatDialog,
        private _notificationService: NotificationServiceProxy,
        private _notifyService: NotifyService,
        private _dialogRef: MatDialogRef<NotificationSettingsModalComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this.getSettings(() => {});
    }

    onShown(): void {
        $('#ReceiveNotifications').bootstrapSwitch('state', this.settings.receiveNotifications);
        $('#ReceiveNotifications').bootstrapSwitch('onSwitchChange', (el, value) => {
            this.settings.receiveNotifications = value;
        });
    }

    save(): void {
        this.modalDialog.startLoading();
        const input = new UpdateNotificationSettingsInput();
        input.receiveNotifications = this.settings.receiveNotifications;
        input.notifications = map(this.settings.notifications,
            (n) => {
                let subscription = new NotificationSubscriptionDto();
                subscription.name = n.name;
                subscription.isSubscribed = n.isSubscribed;
                return subscription;
            });

        this._notificationService.updateNotificationSettings(input)
            .pipe(finalize(() => this.modalDialog.startLoading()))
            .subscribe(() => {
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this._dialogRef.close();
            });
    }

    private getSettings(callback: () => void) {
        this.modalDialog.startLoading();
        this._notificationService.getNotificationSettings()
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result: GetNotificationSettingsOutput) => {
                this.settings = result;
                callback();
                this._changeDetectorRef.detectChanges();
            });
    }
}
