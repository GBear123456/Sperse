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
import { Tags } from './sms-tags.enums';
import { AppSessionService } from '@root/shared/common/session/app-session.service';
import { AppConsts } from '@root/shared/AppConsts';

@Component({
    templateUrl: 'sms-dialog.component.html',
    styleUrls: [ 'sms-dialog.component.less' ],
    providers: [ DialogService, PhoneFormatPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SMSDialogComponent {
    @ViewChild(DxValidationGroupComponent, { static: true }) validationGroup: DxValidationGroupComponent;
    @ViewChild(CountryPhoneNumberComponent, { static: true }) countryPhoneNumber: CountryPhoneNumberComponent;
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
    tags: Record<Tags, string> = {
        [Tags.LegalName]: "",
        [Tags.ClientFirstName]: "",
        [Tags.ClientLastName]: ""
    };

    tagNames = Object.keys(this.tags).map(x => Tags[x]);

    constructor(
        private contactCommunicationServiceProxy: ContactCommunicationServiceProxy,
        private dialogRef: MatDialogRef<SMSDialogComponent>,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        private notifyService: NotifyService,
        public phoneFormatPipe: PhoneFormatPipe,
        public ls: AppLocalizationService,
        appSession: AppSessionService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        let person: PersonContactInfoDto = data.contact.personContactInfo,
            primary: ContactPhoneDto = person.details.phones.find(item => item.id == person.primaryPhoneId);
        this.phones = person.details.phones
            .concat(data.contact.organizationContactInfo.details ? data.contact.organizationContactInfo.details.phones : [])
            .map((item: ContactPhoneDto) => item.phoneNumber);
        if (primary)
            this.phoneNumber = primary.phoneNumber;

        this.tags[Tags.LegalName] = appSession.tenant ? appSession.tenant.name : AppConsts.defaultTenantName;
        this.tags[Tags.ClientFirstName] = person.person.firstName;
        this.tags[Tags.ClientLastName] = person.person.lastName;
    }

    save() {
        if (this.countryPhoneNumber.isEmpty()) {
            /** Clear select box widget value */
            this.phoneNumber = '';
        }
        setTimeout(() => {
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
        });
    }

    insertTag(event, container, tooltip) {
        let tag = this.tags[Tags[event.itemData]];

        let value = container.instance.option('value'),
            textarea = container.instance.element().getElementsByTagName('textarea')[0];
        container.instance.option('value', !textarea || isNaN(textarea.selectionStart) ? value + tag :
            textarea.value.slice(0, textarea.selectionStart) + tag + textarea.value.slice(textarea.selectionStart));
        tooltip.instance.option('visible', false);
    }

    phoneNumberClick(e) {
        e.stopPropagation();
    }
}