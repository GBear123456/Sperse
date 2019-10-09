/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';

@Component({
    templateUrl: 'sms-dialog.component.html',
    styleUrls: [ 'sms-dialog.component.less' ],
    providers: [ DialogService, PhoneFormatPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SMSDialogComponent {
    phonePattern = /^[\d\+\-\(\)\s]{10,24}$/;
    phoneNumber;
    phones;

    buttons: IDialogButton[] = [
        {
            id: 'sendSMS',
            title: this.ls.l('Send'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private dialogRef: MatDialogRef<SMSDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        public phoneFormatPipe: PhoneFormatPipe,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        let person = data.contact.personContactInfo, 
            primary = person.details.phones.find(item => item.id == person.primaryPhoneId);
        this.phones = person.details.phones.concat(data.contact
            .organizationContactInfo.details.phones).map(item => item.phoneNumber);
        if (primary)
            this.phoneNumber = primary.phoneNumber;            
    }

    save() {
    }
}