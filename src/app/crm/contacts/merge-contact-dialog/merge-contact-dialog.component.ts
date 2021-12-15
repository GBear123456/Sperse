/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, AfterViewInit, ElementRef } from '@angular/core';

/** Third party imports */
import { select, Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, first, map } from 'rxjs/operators';
import findIndex from 'lodash/findIndex';
import * as moment from 'moment';

/** Application imports */
import { RootStore,
    AddressUsageTypesStoreActions,
    AddressUsageTypesStoreSelectors,
    EmailUsageTypesStoreActions,
    EmailUsageTypesStoreSelectors,
    PhoneUsageTypesStoreActions,
    PhoneUsageTypesStoreSelectors
} from '@root/store';
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
import { NotifyService } from 'abp-ng2-module';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MessageService } from 'abp-ng2-module';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup } from '@shared/AppEnums';

@Component({
    templateUrl: 'merge-contact-dialog.component.html',
    styleUrls: [ 'merge-contact-dialog.component.less' ],
    providers: [ PhoneFormatPipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MergeContactDialogComponent implements AfterViewInit {
    public readonly COLUMN_SOURCE_FIELD       = 'source';
    public readonly COLUMN_TARGET_FIELD       = 'target';
    public readonly COLUMN_RESULT_FIELD       = 'result';

    public readonly MERGE_OPTIONS_FIELD       = 'mergeOptions';
    public readonly CONTACT_FULL_NAME_FIELD   = 'fullName';
    public readonly CONTACT_DATE_FIELD        = 'contactDate';
    public readonly CONTACT_PHONES_FIELD      = 'contactPhones';
    public readonly CONTACT_EMAILS_FIELD      = 'contactEmails';
    public readonly CONTACT_ADDRESSES_FIELD   = 'contactAddresses';
    public readonly CONTACT_BANK_CODE         = 'bankCode';
    public readonly LEAD_STAGE_FIELD          = 'stage';
    public readonly LEAD_OWNER_FIELD          = 'sourceOrganizationUnitName';
    public readonly LEAD_REQUEST_DATE_FIELD   = 'leadDate';
    public readonly LEAD_COMPLETED_DATE_FIELD = 'dateCompleted';
    public readonly LEAD_SOURCE_FIELD         = 'sourceContactName';
    public readonly ASSIGNED_USER_EMAIL       = 'userEmailAddress';

    tenantHasBankCodeFeature = this.userManagementService.checkBankCodeFeature();
    isSameContact = this.data.mergeInfo.contactInfo.id == this.data.mergeInfo.targetContactInfo.id;
    keepSource: boolean = this.data.keepSource !== undefined ? this.data.keepSource : true;
    keepTarget: boolean = this.data.keepTarget !== undefined ? this.data.keepTarget : true;
    fieldsConfig = {
        [this.CONTACT_FULL_NAME_FIELD]: {
            caption: this.ls.l('Contact.FullName'),
            hidden: this.isSameContact
        },
        companyName: {
            caption: this.ls.l('Company'),
            alt: this.ls.l('Alternative', this.ls.l('Companies')),
            hidden: true,
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
            alt: this.ls.l('Alternative', this.ls.l('Addresses')),
            getText: this.getAddressFieldValue,
            hidden: this.isSameContact
        },
        [this.CONTACT_DATE_FIELD]: {
            caption: this.ls.l('Contact.Date'),
            hidden: this.isSameContact
        },
        assignedToUserName: {
            caption: this.ls.l('Contact.AssignedUserName'),
            hidden: this.isSameContact,
            disabled: true
        },
        [this.ASSIGNED_USER_EMAIL]: {
            caption: this.ls.l('UserInformations'),
            disabled: true
        },
        [this.CONTACT_BANK_CODE]: {
            caption: this.ls.l('BankCode'),
            hidden: !this.tenantHasBankCodeFeature,
            disabled: false
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
                    selected: true
                }, {
                    text: this.ls.l('KeepMainLead'),
                    isHidden: () => !this.keepTarget || this.keepSource,
                    selected: true
                }, {
                    text: this.ls.l('TakeDuplicateLead'),
                    isHidden: () => !this.keepSource || this.keepTarget,
                    selected: true
                }]
            }
        },
        [this.LEAD_STAGE_FIELD]:  {
            caption: this.ls.l('Stage'),
            disabled: true
        },
        [this.LEAD_OWNER_FIELD]: {
            caption: this.ls.l('Owner'),
            disabled: true
        },
        [this.LEAD_SOURCE_FIELD]: {
            caption: this.ls.l('SourceContactName'),
            disabled: true
        },
        [this.LEAD_REQUEST_DATE_FIELD]: {
            caption: this.ls.l('Lead') + ' ' + this.ls.l('Date'),
            disabled: true
        },
        [this.LEAD_COMPLETED_DATE_FIELD]: {
            caption: this.ls.l('CompletedDate'),
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

    usageTypes = {
        contactAddresses: {},
        contactPhones: {},
        contactEmails: {}
    };

    constructor(
        private elementRef: ElementRef,
        private phonePipe: PhoneFormatPipe,
        private pipelineService: PipelineService,
        private loadingService: LoadingService,
        private contactProxy: ContactServiceProxy,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private userManagementService: UserManagementService,
        private dialogRef: MatDialogRef<MergeContactDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        private store$: Store<RootStore.State>,
        public profileService: ProfileService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.updateLeadResultFields();
        pipelineService.getPipelineDefinitionObservable(
            AppConsts.PipelinePurposeIds.lead,
            data.contactGroupId
        ).pipe(first()).subscribe();

        this.store$.dispatch(new AddressUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(select(AddressUsageTypesStoreSelectors.getAddressUsageTypes))
            .pipe(map(this.getUsageTypeDictionary.bind(this)))
            .subscribe(types => this.usageTypes.contactAddresses = types);

        this.store$.dispatch(new EmailUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(select(EmailUsageTypesStoreSelectors.getEmailUsageTypes))
            .pipe(map(this.getUsageTypeDictionary.bind(this)))
            .subscribe(types => this.usageTypes.contactEmails = types);

        this.store$.dispatch(new PhoneUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(select(PhoneUsageTypesStoreSelectors.getPhoneUsageTypes))
            .pipe(map(this.getUsageTypeDictionary.bind(this)))
            .subscribe(types => this.usageTypes.contactPhones = types);
    }

    ngAfterViewInit() {
        setTimeout(() => this.changeDetectorRef.markForCheck(), 100);
    }

    getUsageTypeDictionary(types) {
        return types && types.reduce((acc, val) => {
            acc[val.id] = val.name;
            return acc;
        }, {dt: this.ls.l('General')});
    }

    getAddressFieldValue(address) {
        return [
            address.streetAddress,
            address.city,
            address.stateName,
            address.zip,
            address.countryId
        ].filter(Boolean).join(', ') + ' ';
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
                        usageTypeId: item.usageTypeId,
                        text: method ? method(item) :
                            item[this.fieldsConfig[field].fieldText]
                    };
                });
            else {
                let value = '';
                if (['string', 'number'].indexOf(typeof(data)) >= 0)
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
        return targetValues.filter(value => {
            if (field == this.CONTACT_BANK_CODE) {
                let sourceContact = this.data.mergeInfo.contactInfo,
                    targetContact = this.data.mergeInfo.targetContactInfo;
                return targetContact.bankCodeDate > sourceContact.bankCodeDate;
            } else
                return !!value;
        }).concat(sourceValues.map(item => {
            if (isMultiField) {
                if (targetValues.some(source => source.text == item.text))
                    return null;
            } else if (this.checkSingleField(field, targetValues))
                return null;
            return item;
        }).filter(Boolean)).map((item, index) => {
            item.isPrimary = item.id && !index;
            item.selected = true;
            return item;
        });
    }

    checkSingleField(field, targetValues) {
        if (field == this.ASSIGNED_USER_EMAIL)
            return targetValues.length;
        else if (field == this.CONTACT_BANK_CODE) {
            let sourceContact = this.data.mergeInfo.contactInfo,
                targetContact = this.data.mergeInfo.targetContactInfo;
            return sourceContact.bankCodeDate < targetContact.bankCodeDate;
        } else
            return (targetValues.length || !this.keepSource);
    }

    setLeadInfoFields(column, fields, forced = false) {
        fields.forEach(field => {
            let data = this.fieldsConfig[field][column];
            if (data && (forced || data.values && data.values.length))
                this.fieldsConfig[field][this.COLUMN_RESULT_FIELD].values = data.values;
        });
    }

    setActiveLeadInfo(column, forced = true) {
        this.setLeadInfoFields(column, [
            this.LEAD_STAGE_FIELD,
            this.LEAD_REQUEST_DATE_FIELD,
            this.LEAD_COMPLETED_DATE_FIELD
        ], forced);
    }

    setImportantLeadInfo(column, forced = false) {
        this.setLeadInfoFields(column, [
            this.LEAD_OWNER_FIELD,
            this.LEAD_SOURCE_FIELD
        ], forced);
    }

    onMergeOptionChange(field: any, value: any) {
        let sourceInput = field.source.values[0],
            targetInput = field.target.values[0];

        setTimeout(() => {
            if (!field.result.values.some((item, index) => {
                item.selected = true;
                if (item == value) {
                    this.keepTarget = !index || index == 2;
                    this.keepSource = index == 1;
                    return true;
                }
            })) {
                let sourceAction = sourceInput == value,
                    sourceSelect = (sourceAction ? sourceInput : targetInput).selected;
                sourceSelect = sourceAction ? sourceSelect : !sourceSelect;
                this.keepSource = this.isSameContact ? sourceSelect : sourceInput.selected;
                this.keepTarget = this.isSameContact ? !sourceSelect : targetInput.selected;
            }

            sourceInput.selected = this.keepSource;
            targetInput.selected = this.keepTarget;

            this.updateLeadResultFields();
            this.changeDetectorRef.detectChanges();
        });
    }

    updateLeadResultFields() {
        if (this.keepSource) {
            this.setImportantLeadInfo(this.COLUMN_SOURCE_FIELD);
            if (this.keepTarget) {
                this.setImportantLeadInfo(this.COLUMN_TARGET_FIELD);
                this.setActiveLeadInfo(this.COLUMN_SOURCE_FIELD, false);
                this.setActiveLeadInfo(this.COLUMN_TARGET_FIELD, false);
            } else
                this.setActiveLeadInfo(this.COLUMN_SOURCE_FIELD);
        } else {
            this.fieldsConfig[this.MERGE_OPTIONS_FIELD].target
                .values[0].selected = this.keepTarget = true;
            this.setImportantLeadInfo(this.COLUMN_SOURCE_FIELD);
            this.setImportantLeadInfo(this.COLUMN_TARGET_FIELD);
            this.setActiveLeadInfo(this.COLUMN_TARGET_FIELD);
        }
    }

    onSelectChange(field: any, value: any) {
        if (field.name == this.MERGE_OPTIONS_FIELD)
            return this.onMergeOptionChange(field, value);

        let isMultiField = this.isMultiField(field);
        if (value && value.selected) {
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
                let target = field.target.values[0];
                if (target == value)
                    target = field.source.values[0];
                if (target) {
                    target.selected = true;
                    field.result.values = [target];
                } else
                    field.result.values = [];
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
                let result = field.result.values.pop();
                if (result) result.selected = false;
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
        return this.mergeInfo.targetContactInfo.photoPublicId ||
            this.mergeInfo.contactInfo.photoPublicId;
    }

    getResultFullName() {
        return this.fields[0].result.values[0].text;
    }

    getMergeLeadMode() {
        if (this.keepTarget && this.keepSource)
            return MergeLeadMode.KeepBoth;
        else if (this.keepSource)
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
        return this.getFieldIdsToIgnore(this.CONTACT_EMAILS_FIELD, this.COLUMN_SOURCE_FIELD);
    }

    getPhoneIdsToIgnore() {
        return this.getFieldIdsToIgnore(this.CONTACT_PHONES_FIELD, this.COLUMN_SOURCE_FIELD);
    }

    getAddressIdsToIgnore() {
        return this.getFieldIdsToIgnore(this.CONTACT_ADDRESSES_FIELD, this.COLUMN_SOURCE_FIELD);
    }

    getEmailIdsToRemove() {
        return this.getFieldIdsToIgnore(this.CONTACT_EMAILS_FIELD, this.COLUMN_TARGET_FIELD);
    }

    getPhoneIdsToRemove() {
        return this.getFieldIdsToIgnore(this.CONTACT_PHONES_FIELD, this.COLUMN_TARGET_FIELD);
    }

    getAddressIdsToRemove() {
        return this.getFieldIdsToIgnore(this.CONTACT_ADDRESSES_FIELD, this.COLUMN_TARGET_FIELD);
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
        let data = this.fieldsConfig[field][source];
        return data && data.values[index]
            && data.values[index].selected;
    }

    getPreferredProperties() {
        return (this.isFieldSelected(this.CONTACT_FULL_NAME_FIELD, this.COLUMN_SOURCE_FIELD) ? PreferredProperties._1 : 0)
            | (this.isFieldSelected(this.CONTACT_DATE_FIELD, this.COLUMN_SOURCE_FIELD) ? PreferredProperties._2 : 0)
            | (this.isFieldSelected(this.CONTACT_BANK_CODE, this.COLUMN_SOURCE_FIELD) ? PreferredProperties._4 : 0);
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
        return this.pipelineService.getStageColorByName(stageName, ContactGroup.Client);
    }

    setAsPrimary(field, value) {
        field.result.values[0].isPrimary = false;
        field.result.values.splice(findIndex(
            field.result.values, (item: any) => item == value), 1);
        field.result.values.unshift(value);
        value.isPrimary = true;
    }

    getAltCaptionTop(element) {
        const defaultTop = 10;
        let field = element && element.querySelector('.contact-field.contactAddresses > .result > div:first-child');
        return (field ? Math.max(defaultTop, field.offsetHeight - defaultTop) : defaultTop) + 'px';
    }

    getActiveUserEmail(value, column) {
        let sourceContact = this.data.mergeInfo.contactInfo,
            targetContact = this.data.mergeInfo.targetContactInfo;
        if (column == this.COLUMN_SOURCE_FIELD)
            value.text = sourceContact.userEmailAddress;
        else if (column == this.COLUMN_TARGET_FIELD)
            value.text = targetContact.userEmailAddress;
        else if (column == this.COLUMN_RESULT_FIELD) {
            if (targetContact.userIsActive && targetContact.userEmailAddress)
                value.text = targetContact.userEmailAddress;
            else if (sourceContact.userIsActive && sourceContact.userEmailAddress)
                value.text = sourceContact.userEmailAddress;
            else
                value.text = targetContact.userEmailAddress || sourceContact.userEmailAddress;
        }
        return value.text;
    }

    checkUserActive(column) {
        let sourceContact = this.data.mergeInfo.contactInfo,
            targetContact = this.data.mergeInfo.targetContactInfo;
        if (column == this.COLUMN_SOURCE_FIELD)
            return sourceContact.userIsActive;
        else if (column == this.COLUMN_TARGET_FIELD)
            return targetContact.userIsActive;
        else
            return targetContact.userIsActive || sourceContact.userIsActive;
    }

    getUserLastLoginTime(column) {
        let sourceContact = this.data.mergeInfo.contactInfo,
            targetContact = this.data.mergeInfo.targetContactInfo;
        if (column == this.COLUMN_SOURCE_FIELD)
            return sourceContact.userLastLoginTime;
        else if (column == this.COLUMN_TARGET_FIELD)
            return targetContact.userLastLoginTime;
        else if (column == this.COLUMN_RESULT_FIELD) {
            if (targetContact.userIsActive && targetContact.userEmailAddress)
                return targetContact.userLastLoginTime;
            else if (sourceContact.userIsActive && sourceContact.userEmailAddress)
                return sourceContact.userLastLoginTime;
            else
                return targetContact.userLastLoginTime || sourceContact.userLastLoginTime;
        }
    }

    getBankCodeDate(column) {
        let sourceContact = this.data.mergeInfo.contactInfo,
            targetContact = this.data.mergeInfo.targetContactInfo;
        if (column == this.COLUMN_SOURCE_FIELD)
            return sourceContact.bankCodeDate;
        else if (column == this.COLUMN_TARGET_FIELD)
            return targetContact.bankCodeDate;
        else if (column == this.COLUMN_RESULT_FIELD) {
            if (this.isFieldSelected('bankCode', 'target'))
                return targetContact.bankCodeDate;
            else if (this.isFieldSelected('bankCode', 'source'))
                return sourceContact.bankCodeDate;
            else if (targetContact.bankCodeDate > sourceContact.bankCodeDate)
                return targetContact.bankCodeDate;
            else  if (sourceContact.bankCodeDate > targetContact.bankCodeDate)
                return sourceContact.bankCodeDate;
            else
                return targetContact.bankCodeDate || sourceContact.bankCodeDate;
        }
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