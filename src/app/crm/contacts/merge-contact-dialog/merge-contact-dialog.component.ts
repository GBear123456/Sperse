/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, ElementRef } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import findIndex from 'lodash/findIndex';
import * as moment from 'moment';

/** Application imports */
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import {
    MergeLeadMode,
    MergeContactInfo,
    ContactMergeOptions,
    ContactServiceProxy,
    PreferredProperties,
    TargetContactMergeOptions,
    PrimaryContactInfo,
    GetContactInfoForMergeOutput
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MessageService } from '@abp/message/message.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: 'merge-contact-dialog.component.html',
    styleUrls: [ 'merge-contact-dialog.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MergeContactDialogComponent {
    private readonly MERGE_OPTIONS_FIELD     = 'mergeOptions';
    private readonly CONTACT_FULL_NAME_FIELD = 'fullName';
    private readonly CONTACT_DATE_FIELD      = 'contactDate';
    private readonly CONTACT_PHONES_FIELD    = 'contactPhones';
    private readonly CONTACT_EMAILS_FIELD    = 'contactEmails';
    private readonly CONTACT_ADDRESSES_FIELD = 'contactAddresses';
    fieldsConfig = {
        id: {
            hidden: true
        },
        [this.CONTACT_FULL_NAME_FIELD]: {
            caption: this.ls.l('FullNamePlaceholder')
        },
        companyName: {
            caption: this.ls.l('Company'),
            alt: this.ls.l('Alt company'),
            disabled: true
        },
        [this.CONTACT_PHONES_FIELD]: {
            caption: this.ls.l('PhoneNumber'),
            alt: this.ls.l('Alt phone'),
            fieldText: 'phoneNumber'
        },
        [this.CONTACT_EMAILS_FIELD]: {
            caption: this.ls.l('EmailAddress'),
            alt: this.ls.l('Alt email'),
            fieldText: 'emailAddress'
        },
        [this.CONTACT_ADDRESSES_FIELD]: {
            caption: this.ls.l('Address'),
            alt: this.ls.l('Alt address'),
            getText: this.getAddressFieldValue
        },
        [this.CONTACT_DATE_FIELD]: {
            caption: this.ls.l('Contact.Date')
        },
        sourceContactName: {
            caption: this.ls.l('Sales agent'),
            disabled: true
        },
        orderCount: {
            caption: this.ls.l('Orders'),
            disabled: true
        },
        [this.MERGE_OPTIONS_FIELD]: {
            name: this.MERGE_OPTIONS_FIELD,
            caption: this.ls.l('Leads Merge Options'),
            source: {values: [{
                text: this.ls.l('Keep Source'),
                selected: true
            }]},
            target: {values: [{
                text: this.ls.l('Keep Target'),
                selected: true
            }]},
            result: {values: [{
                text: this.ls.l('Keep Both'),
                selected: true
            }]}
        },
        leadDate: {
            caption: this.ls.l('Date'),
            disabled: true
        },
        sourceOrganizationUnitName: {
            caption: this.ls.l('Abp.Organizations.OrganizationUnit'),
            disabled: true
        },
        stage:  {
            caption: this.ls.l('Stage'),
            disabled: true
        }
    };
    mergeInfo: GetContactInfoForMergeOutput = this.data.mergeInfo;
    fields = Object.keys(this.fieldsConfig).map(field => {
        let source = this.data.mergeInfo.contactInfo,
            target = this.data.mergeInfo.targetContactInfo,
            sourceValues = this.getFieldValues(source, field),
            targetValues = this.getFieldValues(target, field);
        return sourceValues.length || targetValues.length ?
            Object.assign(this.fieldsConfig[field], {
                source: { values: sourceValues },
                target: { values: targetValues },
                result: { values: this.getResultFieldValues(field, sourceValues, targetValues) }
            }) : (source.hasOwnProperty(field) ? null : this.fieldsConfig[field]);
    }).filter(Boolean);
    buttons: IDialogButton[] = [
        {
            id: 'Cancel',
            title: this.ls.l('Cancel'),
            class: 'default',
            action: () => this.dialogRef.close()
        },
        {
            id: 'Merge',
            title: this.ls.l('Merge'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private elementRef: ElementRef,
        private loadingService: LoadingService,
        private contactProxy: ContactServiceProxy,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private dialogRef: MatDialogRef<MergeContactDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        public profileService: ProfileService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    getAddressFieldValue(address) {
        return [
            address.streetAddress,
            address.city,
            address.stateName,
            address.zip,
            address.countryId
        ].filter(Boolean).join(', ');
    }

    getFieldValues(contactInfo, field) {
        let data = contactInfo[field];
        if (data) {
            if (data instanceof Array)
                return data.sort((prev) => prev.isPrimary ? -1 : 1).map(item => {
                    let method = this.fieldsConfig[field].getText;
                    return {
                        id: item.id,
                        selected: false,
                        isPrimary: item.isPrimary,
                        text: method ? method(item) :
                            item[this.fieldsConfig[field].fieldText]
                    };
                });
            else {
                let value = '';
                if (typeof(data) == 'string')
                    value = data;
                else if (data instanceof moment)
                    value = data.format(AppConsts.formatting.fieldDateTime);

                return value ? [{
                    text: value,
                    selected: false
                }] : [];
            }
        } else
            return [];
    }

    isMultiField(field) {
        return field.hasOwnProperty('alt');
    }

    getResultFieldValues(field, sourceValues, targetValues) {
        let isMultiField = this.isMultiField(this.fieldsConfig[field]);
        return targetValues.concat(sourceValues.map(item => {
            if (isMultiField) {
                if (targetValues.some(source => source.text == item.text))
                    return null;
            } else if (targetValues.length)
                return null;
            return item;
        }).filter(Boolean)).map((item, index) => {
            item.isPrimary = item.id && !index;
            item.selected = true;
            return item;
        });
    }

    onMergeOptionChange(field: any, value: any) {
        setTimeout(() => {
            if (field.result.values[0] == value) {
                field.target.values[0].selected = true;
                field.source.values[0].selected = value.selected;
            } else {
                field.result.values[0].selected =
                    field.source.values[0].selected &&
                    field.target.values[0].selected;
                if (!field.source.values[0].selected)
                    field.target.values[0].selected = true;
            }
            this.changeDetectorRef.detectChanges();
        });
    }

    onSelectChange(field: any, value: any) {
        if (field.name == this.MERGE_OPTIONS_FIELD)
            return this.onMergeOptionChange(field, value);

        let isMultiField = this.isMultiField(field);
        if (value.selected) {
            setTimeout(() => {
                value.selected = false;
                this.changeDetectorRef.detectChanges();
            });
            if (isMultiField)
                field.result.values.splice(findIndex(field.result.values,
                    (item: any) => item.hasOwnProperty('id') && item.id == value.id || item.text == value.text), 1);
            else {
                let values = field.target.values;
                if (values[0] == value)
                    values = field.source.values;
                values[0].selected = true;
                field.result.values = [values[0]];
            }
        } else {
            if (isMultiField)
                field.result.values.push(value);
            else {
                field.result.values.pop().selected = false;
                field.result.values.push(value);
            }
        }
        this.updateResultPrimaryFields(field);
   }

    updateResultPrimaryFields(field) {
        if (this.isMultiField(field))
            field.result.values.forEach((item, index) => {
                item.isPrimary = item.id && !index;
            });
    }

    getResultPhotoId() {
        return this.getResultFullName() != this.data.mergeInfo.contactInfo.fullName ?
            this.data.mergeInfo.targetContactInfo.photoPublicId :
            this.data.mergeInfo.contactInfo.photoPublicId;
    }

    getResultFullName() {
        return this.fields[0].result.values[0].text;
    }

    getMergeLeadMode() {
        let mergeOption = this.fieldsConfig[this.MERGE_OPTIONS_FIELD];
        if (mergeOption.result.values[0].selected)
            return MergeLeadMode.KeepBoth;
        else if (mergeOption.source.values[0].selected)
            return MergeLeadMode.KeepSource;
        else
            return MergeLeadMode.KeepTarget;
    }

    getFieldIdsToIgnore(field, source) {
        let config = this.fieldsConfig[field][source];
        return config && config.values.map(item => {
            return item.selected ? null : item.id;
        }).filter(Boolean);
    }

    getEmailIdsToIgnore() {
        return this.getFieldIdsToIgnore(this.CONTACT_EMAILS_FIELD, 'source');
    }

    getPhoneIdsToIgnore() {
        return this.getFieldIdsToIgnore(this.CONTACT_PHONES_FIELD, 'source');
    }

    getAddressIdsToIgnore() {
        return this.getFieldIdsToIgnore(this.CONTACT_ADDRESSES_FIELD, 'source');
    }

    getEmailIdsToRemove() {
        return this.getFieldIdsToIgnore(this.CONTACT_EMAILS_FIELD, 'target');
    }

    getPhoneIdsToRemove() {
        return this.getFieldIdsToIgnore(this.CONTACT_PHONES_FIELD, 'target');
    }

    getAddressIdsToRemove() {
        return this.getFieldIdsToIgnore(this.CONTACT_ADDRESSES_FIELD, 'target');
    }

    getPrimaryFieldId(field) {
        let config = this.fieldsConfig[field].result;
        return config && config.values[0] && config.values[0].id;
    }

    getPrimaryEmailId() {
        return this.getPrimaryFieldId(this.CONTACT_EMAILS_FIELD);
    }

    getPrimaryPhoneId() {
        return this.getPrimaryFieldId(this.CONTACT_PHONES_FIELD);
    }

    getPrimaryAddressId() {
        return this.getPrimaryFieldId(this.CONTACT_ADDRESSES_FIELD);
    }

    isFieldSelected(field, source, index = 0) {
        return this.fieldsConfig[field][source].values[index].selected;
    }

    getPreferredProperties() {
        return (this.isFieldSelected(this.CONTACT_FULL_NAME_FIELD, 'source') ? PreferredProperties._1 : 0)
            | (this.isFieldSelected(this.CONTACT_DATE_FIELD, 'source') ? PreferredProperties._2 : 0);
    }

    getMergeContactInput() {
        let sourceInfo = this.data.mergeInfo.contactInfo,
            targetInfo = this.data.mergeInfo.targetContactInfo;
        return new MergeContactInfo({
            contactId: sourceInfo.id,
            contactLeadId: sourceInfo.leadId,
            contactMergeOptions: new ContactMergeOptions({
                emailIdsToIgnore: this.getEmailIdsToIgnore(),
                phoneIdsToIgnore: this.getPhoneIdsToIgnore(),
                addressIdsToIgnore: this.getAddressIdsToIgnore(),
                preferredProperties: this.getPreferredProperties()
            }),
            targetContactId: targetInfo.id,
            targetContactLeadId: targetInfo.leadId,
            targetContactMergeOptions: new TargetContactMergeOptions({
                emailIdsToRemove: this.getEmailIdsToRemove(),
                phoneIdsToRemove: this.getPhoneIdsToRemove(),
                addressIdsToRemove: this.getAddressIdsToRemove()
            }),
            primaryContactInfo: new PrimaryContactInfo({
                primaryEmailId: this.getPrimaryEmailId(),
                primaryPhoneId: this.getPrimaryPhoneId(),
                primaryAddressId: this.getPrimaryAddressId()
            }),
            mergeLeadMode: this.getMergeLeadMode()
        });
    }

    save() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.contactProxy.mergeContact(
            this.getMergeContactInput()
        ).pipe(
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).subscribe(() => {
            this.dialogRef.close(true);
        });
    }
}