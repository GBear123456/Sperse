/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    GetNotificationSettingsOutput,
    NotificationServiceProxy,
    NotificationSubscriptionDto,
    NotificationSubscriptionWithDisplayNameDto,
    UpdateNotificationSettingsInput
} from '@shared/service-proxies/service-proxies';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'notificationSettingsModal',
    templateUrl: './notification-settings-modal.component.html',
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
        private notificationService: NotificationServiceProxy,
        private notifyService: NotifyService,
        private dialogRef: MatDialogRef<NotificationSettingsModalComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this.getSettings(() => {});
    }

    save(): void {
        this.modalDialog.startLoading();
        const input = new UpdateNotificationSettingsInput();
        input.receiveNotifications = this.settings.receiveNotifications;
        input.notifications = this.settings.notifications.map((notification: NotificationSubscriptionWithDisplayNameDto) => {
            let subscription = new NotificationSubscriptionDto();
            subscription.name = notification.name;
            subscription.isSubscribed = notification.isSubscribed;
            return subscription;
        });

        this.notificationService.updateNotificationSettings(input)
            .pipe(finalize(() => this.modalDialog.startLoading()))
            .subscribe(() => {
                this.notifyService.info(this.ls.l('SavedSuccessfully'));
                this.dialogRef.close();
            });
    }

    private getSettings(callback: () => void) {
        this.modalDialog.startLoading();
        this.notificationService.getNotificationSettings()
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result: GetNotificationSettingsOutput) => {
                this.settings = result;
                callback();
                this.changeDetectorRef.detectChanges();
            });
    }
}
