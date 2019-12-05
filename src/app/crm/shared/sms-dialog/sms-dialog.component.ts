/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DxValidationGroupComponent } from 'devextreme-angular/ui/validation-group';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import {
    ContactPhoneDto,
    ContactCommunicationServiceProxy,
    SendSMSToContactInput,
    PersonContactInfoDto
} from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { NotifyService } from '@abp/notify/notify.service';
import { CountryPhoneNumberComponent } from '@shared/common/phone-numbers/country-phone-number.component';

@Component({
    templateUrl: 'sms-dialog.component.html',
    styleUrls: [ 'sms-dialog.component.less' ],
    providers: [ DialogService, PhoneFormatPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SMSDialogComponent {
    @ViewChild(DxValidationGroupComponent) validationGroup: DxValidationGroupComponent;
    @ViewChild(CountryPhoneNumberComponent) countryPhoneNumber: CountryPhoneNumberComponent;
    phonePattern = /^[\d\+\-\(\)\s]{10,24}$/;
    phoneNumber: string;
    phones: string[];
    smsText = '';
    readonly smsMaxLength = 160;
    buttons: IDialogButton[] = [
        {
            id: 'sendSMS',
            title: this.ls.l('Send'),
            class: 'primary',
            iconName: 'send.svg',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private contactCommunicationServiceProxy: ContactCommunicationServiceProxy,
        private dialogRef: MatDialogRef<SMSDialogComponent>,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        private notifyService: NotifyService,
        public phoneFormatPipe: PhoneFormatPipe,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        let person: PersonContactInfoDto = data.contact.personContactInfo,
            primary: ContactPhoneDto = person.details.phones.find(item => item.id == person.primaryPhoneId);
        this.phones = person.details.phones
            .concat(data.contact.organizationContactInfo.details ? data.contact.organizationContactInfo.details.phones : [])
            .map((item: ContactPhoneDto) => item.phoneNumber);
        if (primary)
            this.phoneNumber = primary.phoneNumber;
    }

    save() {
        if (this.validationGroup.instance.validate().isValid && this.countryPhoneNumber.isValid()) {
            this.loadingService.startLoading(this.validationGroup.instance.element());
            this.contactCommunicationServiceProxy.sendSMS(new SendSMSToContactInput({
                contactId: this.data.contact.id,
                message: this.smsText,
                phoneNumber: this.phoneNumber
            })).pipe(
                finalize(() => this.loadingService.finishLoading(this.validationGroup.instance.element()))
            ).subscribe(
                () => this.notifyService.success(this.ls.l('MessageSuccessfullySent'))
            );
        }
    }

    phoneNumberClick(e) {
        e.stopPropagation();
    }
}
