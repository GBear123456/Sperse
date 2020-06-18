/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, ElementRef } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, first } from 'rxjs/operators';
import findIndex from 'lodash/findIndex';
import * as moment from 'moment';

/** Application imports */
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import {
    MergeLeadMode,
    MergeContactInput,
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
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: 'merge-contact-dialog.component.html',
    styleUrls: [ 'merge-contact-dialog.component.less' ],
    providers: [ PhoneFormatPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MergeContactDialogComponent {
    public readonly MERGE_OPTIONS_FIELD     = 'mergeOptions';
    public readonly CONTACT_FULL_NAME_FIELD = 'fullName';
    public readonly CONTACT_DATE_FIELD      = 'contactDate';
    public readonly CONTACT_PHONES_FIELD    = 'contactPhones';
    public readonly CONTACT_EMAILS_FIELD    = 'contactEmails';
    public readonly CONTACT_ADDRESSES_FIELD = 'contactAddresses';
    public readonly CONTACT_STAGE_FIELD     = 'stage';

    isSameContact = this.data.mergeInfo.contactInfo.id == this.data.mergeInfo.targetContactInfo.id;
    keepSource: boolean = this.data.keepSource !== undefined ? this.data.keepSource : true;
    keepTarget: boolean = this.data.keepTarget !== undefined ? this.data.keepTarget : true;
    fieldsConfig = {
        id: {
            hidden: true
        },
        [this.CONTACT_FULL_NAME_FIELD]: {
            caption: this.ls.l('Contact.FullName'),
            hidden: this.isSameContact
        },
        companyName: {
            caption: this.ls.l('Company'),
            alt: this.ls.l('Alternative', this.ls.l('Companies')),
            hidden: this.isSameContact,
            disabled: true
        },
        [this.CONTACT_PHONES_FIELD]: {
            caption: this.ls.l('PhoneNumber'),
            alt: this.ls.l('Alternative', this.ls.l('Phones')),
            getText: this.getPhoneFieldValue.bind(this),
            hidden: this.isSameContact
        },
        [this.CONTACT_EMAILS_FIELD]: {
            caption: this.ls.l('EmailAddress'),
            alt: this.ls.l('Alternative', this.ls.l('Emails')),
            fieldText: 'emailAddress',
            hidden: this.isSameContact
        },
        [this.CONTACT_ADDRESSES_FIELD]: {
            caption: this.ls.l('Address'),
            alt: this.ls.l('Alternative', this.ls.l('Address')),
            getText: this.getAddressFieldValue,
            hidden: this.isSameContact
        },
        [this.CONTACT_DATE_FIELD]: {
            caption: this.ls.l('Contact.Date'),
            hidden: this.isSameContact
        },
        sourceContactName: {
            caption: this.ls.l('SalesAgent'),
            hidden: this.isSameContact,
            disabled: true
        },
        orderCount: {
            caption: this.ls.l('Orders'),
            hidden: this.isSameContact,
            disabled: true
        },
        [this.MERGE_OPTIONS_FIELD]: {
            name: this.MERGE_OPTIONS_FIELD,
            caption: this.ls.l('LeadSourceInformation'),
            source: {
                values: [{
                    text: this.ls.l('TakeLeadInformation'),
                    selected: this.keepSource
                }]
            },
            target: {
                values: [{
                    text: this.ls.l('KeepLeadInformation'),
                    selected: this.keepTarget
                }]
            },
            result: {
                values: [{
                    text: this.ls.l('KeepBothLeads'),
                    isHidden: () => !this.keepSource || !this.keepTarget,
                    selected: true,
                    disabled: true
                }, {
                    text: this.ls.l('KeepMainLead'),
                    isHidden: () => !this.keepTarget || this.keepSource,
                    selected: true,
                    disabled: true
                }, {
                    text: this.ls.l('TakeDuplicateLead'),
                    isHidden: () => !this.keepSource || this.keepTarget,
                    selected: true,
                    disabled: true
                }]
            }
        },
        leadDate: {
            caption: this.ls.l('LeadRequestDate'),
            disabled: true
        },
        sourceOrganizationUnitName: {
            caption: this.ls.l('Owner'),
            disabled: true
        },
        [this.CONTACT_STAGE_FIELD]:  {
            caption: this.ls.l('Stage'),
            disabled: true
        }
    };
    mergeInfo: GetContactInfoForMergeOutput = this.data.mergeInfo;
    fields = Object.keys(this.fieldsConfig).map((field: string) => {
        let source = { ...this.mergeInfo.contactInfo, ...this.mergeInfo.contactLeadInfo },
            target = { ...this.mergeInfo.targetContactInfo, ...this.mergeInfo.targetContactLeadInfo },
            sourceValues = this.getFieldValues(source, field),
            targetValues = this.getFieldValues(target, field);
        return sourceValues.length || targetValues.length ?
            Object.assign(this.fieldsConfig[field], {
                name: field,
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
        private phonePipe: PhoneFormatPipe,
        private pipelineService: PipelineService,
        private loadingService: LoadingService,
        private contactProxy: ContactServiceProxy,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private dialogRef: MatDialogRef<MergeContactDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        public profileService: ProfileService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        pipelineService.getPipelineDefinitionObservable(
            AppConsts.PipelinePurposeIds.lead,
            data.mergeInfo.contactInfo.groupId
        ).pipe(first()).subscribe();
    }

    getAddressFieldValue(address) {
        return [
            address.streetAddress,
            address.city,
            address.stateName,
            address.zip,
            address.countryId
        ].filter(Boolean).join(', ');
    }

    getPhoneFieldValue(data) {
        return this.phonePipe.transform(data.phoneNumber);
    }

    getFieldValues(contactInfo, field: string) {
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

    getResultFieldValues(field: string, sourceValues, targetValues) {
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
            this.keepSource = field.source.values[0].selected;
            this.keepTarget = field.target.values[0].selected;
            if (!this.keepSource)
                this.keepTarget = field.target.values[0].selected = true;
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
                if (isMultiField && value.hasOwnProperty('id'))
                    value.isPrimary = false;
                this.changeDetectorRef.detectChanges();
            });
            if (isMultiField)
                field.result.values.splice(findIndex(field.result.values,
                    (item: any) => item.hasOwnProperty('id') && item.id == value.id || item == value), 1);
            else {
                let values = field.target.values;
                if (values[0] == value)
                    values = field.source.values;
                values[0].selected = true;
                field.result.values = [values[0]];
            }
        } else {
            if (isMultiField) {
                let index = findIndex(field.result.values,
                    (item: any) => item.text == value.text);
                if (index >= 0)
                    field.result.values.splice(index, 1).some(item => {
                        item.selected = false;
                        if (item.hasOwnProperty('id'))
                            item.isPrimary = false;
                    });

                if (field.target.values[0] == value || field.source.values[0] == value)
                    field.result.values.unshift(value);
                else
                    field.result.values.push(value);
            } else {
                field.result.values.pop().selected = false;
                field.result.values.push(value);
            }
        }
        this.updateResultPrimaryFields(field);
   }

    updateResultPrimaryFields(field) {
        if (this.isMultiField(field))
            field.result.values.forEach((item, index) => {
                item.isPrimary = item.hasOwnProperty('id') && !index;
            });
    }

    getResultPhotoId() {
        return this.getResultFullName() != this.mergeInfo.contactInfo.fullName ?
            this.mergeInfo.targetContactInfo.photoPublicId :
            this.mergeInfo.contactInfo.photoPublicId;
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
        return new MergeContactInput({
            contactId: this.mergeInfo.contactInfo.id,
            contactLeadId: this.mergeInfo.contactLeadInfo.id,
            contactMergeOptions: new ContactMergeOptions(this.isSameContact ? undefined : {
                emailIdsToIgnore: this.getEmailIdsToIgnore(),
                phoneIdsToIgnore: this.getPhoneIdsToIgnore(),
                addressIdsToIgnore: this.getAddressIdsToIgnore(),
                preferredProperties: this.getPreferredProperties()
            }),
            targetContactId: this.mergeInfo.targetContactInfo.id,
            targetContactLeadId: this.mergeInfo.targetContactLeadInfo.id,
            targetContactMergeOptions: new TargetContactMergeOptions({
                emailIdsToRemove: this.getEmailIdsToRemove(),
                phoneIdsToRemove: this.getPhoneIdsToRemove(),
                addressIdsToRemove: this.getAddressIdsToRemove()
            }),
            primaryContactInfo: new PrimaryContactInfo(this.isSameContact ? undefined : {
                primaryEmailId: this.getPrimaryEmailId(),
                primaryPhoneId: this.getPrimaryPhoneId(),
                primaryAddressId: this.getPrimaryAddressId()
            }),
            mergeLeadMode: this.getMergeLeadMode()
        });
    }

    getStageColorByName(stageName: string) {
        let stage = this.pipelineService.getStageByName(AppConsts.PipelinePurposeIds.lead, stageName);
        return this.pipelineService.getStageDefaultColorByStageSortOrder(stage && stage.sortOrder);
    }

    setAsPrimary(field, value) {
        field.result.values[0].isPrimary = false;
        field.result.values.splice(findIndex(
            field.result.values, (item: any) => item == value), 1);
        field.result.values.unshift(value);
        value.isPrimary = true;
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