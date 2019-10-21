/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: 'email-invoice-dialog.component.html',
    styleUrls: [ 'email-invoice-dialog.component.less' ],
    providers: [ DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailInvoiceDialogComponent {
    attachPDF = {
        key: 'attachPDF',
        value: true
    };
    sendReminders = {
        key: 'sendReminders',
        value: false
    };
    partialPayment = {
        key: 'partialPayment',
        value: false
    };
    autoPayment = {
        key: 'autoPayment',
        value: false
    };
    sendAlerts = {
        key: 'sendAlerts',
        value: false
    };
    dueDate = {
        key: 'dueDate',
        value: null
    };

    constructor(
        private dialogRef: MatDialogRef<EmailInvoiceDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        data.templateSettings = [
            this.attachPDF, 
            this.sendReminders, 
            this.partialPayment,
            this.autoPayment,
            this.sendAlerts,
            this.dueDate
        ];
    }

    allowDigitsOnly(event, exceptions = []) {
        let key = event.event.key;
        if (exceptions.indexOf(key) < 0 && key.length == 1 && isNaN(key)) {
            event.event.preventDefault();
            event.event.stopPropagation();
        }
    }

    save() {
        this.changeDetectorRef.markForCheck();
    }

    templateChanged(data) {
        this.data.templateSettings.forEach(item => {
            let newItem = data.emailTemplateParams
                .find(v => v.key == item.key);
            if (newItem)
                item.value = item.key != 'dueDate' ? JSON.parse(newItem.value) 
                    : (newItem.value == 'null' ? null : newItem.value);
            else
                item.value = null;
        });
        this.changeDetectorRef.markForCheck();
    }
}