/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { EmailTemplateType } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: 'invoice-settings-dialog.component.html',
    styleUrls: [ 'invoice-settings-dialog.component.less' ],
    providers: [ DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceSettingsDialogComponent {
    attachPDF;
    nextInvoiceNumber;
    note;

    constructor(
        private dialogRef: MatDialogRef<InvoiceSettingsDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        data.templateType = EmailTemplateType.Invoice;
        data.title = ls.l('Invoice Settings');
        data.saveTitle = ls.l('Save');

        data.templateSettings = [];
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