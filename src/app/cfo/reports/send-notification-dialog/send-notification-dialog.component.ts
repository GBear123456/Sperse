/** Core imports */
import { Component, Inject, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    InstanceServiceProxy,
    InstanceType,
    ReportsServiceProxy,
    SendReportNotificationInput
} from '@shared/service-proxies/service-proxies';
import { CFOService } from '@shared/cfo/cfo.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { NotifyService } from '@abp/notify/notify.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'send-notification-dialog',
    templateUrl: './send-notification-dialog.component.html',
    styleUrls: [
        '../report-dialog.less',
        './send-notification-dialog.component.less'
    ],
    providers: [ ReportsServiceProxy ]
})
export class SendNotificationDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild('notificationToEmailTextBox') notificationToEmailTextBox: DxTextBoxComponent;
    title = this.ls.l('Reports_SendNotification');
    notificationToEmail: string;
    sendReportInAttachments = false;
    emailRegEx = AppConsts.regexPatterns.email;
    constructor(
        private ls: AppLocalizationService,
        private instanceAppService: InstanceServiceProxy,
        private dialogRef: MatDialogRef<SendNotificationDialogComponent>,
        private reportsProxy: ReportsServiceProxy,
        private notifyService: NotifyService,
        @Inject(MAT_DIALOG_DATA) private data: any,
        public cfoService: CFOService
    ) {
        this.dialogRef['_overlayRef'].hostElement.classList.add('generate-report');
    }

    ngOnInit() {
        this.instanceAppService.getInstanceOwnerEmailAddress(
            this.cfoService.instanceType as InstanceType,
            this.cfoService.instanceId
        ).subscribe((ownerEmail: string) => {
            this.notificationToEmail = ownerEmail;
        });
    }

    get emailIsValidAndNotEmpty(): boolean {
        return this.notificationToEmail && this.notificationToEmailTextBox && this.notificationToEmailTextBox.instance.option('isValid');
    }

    sendNotification() {
        if (this.emailIsValidAndNotEmpty) {
            this.modalDialog.startLoading();
            this.reportsProxy.sendReportNotification(
                this.cfoService.instanceType as InstanceType,
                this.cfoService.instanceId,
                new SendReportNotificationInput({
                    reportId: this.data.reportId,
                    recipientUserEmailAddress: this.notificationToEmail,
                    sendReportInAttachments: this.sendReportInAttachments
                })
            ).pipe(
                finalize(() => this.modalDialog.finishLoading())
            ).subscribe(
                () => {
                    this.modalDialog.close(true);
                    this.notifyService.info(this.ls.l('Reports_SendSuccessfully'));
                },
                () => {
                    this.modalDialog.close(true);
                    this.notifyService.error(this.ls.l('Reports_SendFailed'));
                }
            );
        }
    }

}
