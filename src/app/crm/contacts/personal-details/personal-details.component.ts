/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, AfterViewInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import startCase from 'lodash/startCase';
import { select, Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, first, map, debounceTime, takeUntil } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope, Country } from '@shared/AppEnums';
import { DateHelper } from '@shared/helpers/DateHelper';
import { NotifyService } from '@abp/notify/notify.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { CountriesStoreActions, CountriesStoreSelectors, RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    ContactInfoDto,
    CountryStateDto,
    DictionaryServiceProxy,
    Gender,
    LayoutType,
    MaritalStatus,
    NameValueDtoListResultDto,
    PersonContactInfoDto,
    PersonContactServiceProxy,
    PersonInfoDto,
    TimeOfDay,
    TimingServiceProxy,
    UpdatePersonInfoInput
} from 'shared/service-proxies/service-proxies';
import { PersonalDetailsService } from './personal-details.service';
import { ContactsService } from '../contacts.service';
import { AppPermissions } from '@shared/AppPermissions';
import { InplaceEditModel } from '@app/shared/common/inplace-edit/inplace-edit.model';
import { InplaceSelectBox } from '@app/shared/common/inplace-select-box/inplace-select-box.interface';
import { SelectListItem } from '@app/crm/contacts/personal-details/select-list-item.interface';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: './personal-details.component.html',
    styleUrls: ['./personal-details.component.less'],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalDetailsComponent implements AfterViewInit, OnDestroy {
    contactInfo: ContactInfoDto;
    person: PersonInfoDto;
    isEditAllowed = false;
    startCase = startCase;
    personContactInfo: PersonContactInfoDto;
    accessConfidentialData = this.permission.isGranted(AppPermissions.CRMAccessConfidentialData);
    private readonly ident = 'PersonalDetails';
    columns = [
        [
            { name: 'General', type: 'head', icon: 'profile' },
            { name: 'gender', type: 'select' },
            { name: 'dob', type: 'date' },
            { name: 'timeZone', type: 'select' },
            { name: 'preferredToD', type: 'select' },
            { name: 'interests', type: 'list', source: this.dictionaryProxy.getInterests() }
        ], [
            ...( !this.appSessionService.tenant || this.appSessionService.tenant.customLayoutType !== LayoutType.BankCode ?
                [
                    { name: 'Personal Info', type: 'head', icon: 'social' },
                    { name: 'maritalStatus', type: 'select' },
                    { name: 'marriageDate', type: 'date' },
                    { name: 'divorceDate', type: 'date', isVisible: () => this.person.marriageDate },
                    { name: 'drivingLicense', type: 'string', confidential: true },
                    { name: 'drivingLicenseState', type: 'select' },
                    { name: 'ssn', type: 'string', confidential: true },
                    { name: 'citizenship', type: 'select' },
                    { name: 'isUSCitizen', type: 'bool', isVisible: () => !this.isDefaultCountryCanada },
                    { name: 'isActiveMilitaryDuty', type: 'bool', isVisible: () => !this.isDefaultCountryCanada }
                ] : []
            )
        ], [
            { name: 'Profile Summary', type: 'head', icon: 'blog' },
            { name: 'profileSummary', type: 'html', multiline: true }
        ], [
            { name: 'Experience', type: 'head', icon: 'blog' },
            { name: 'experience', type: 'string', multiline: true }
        ]
    ];
    ckConfig: any = {
        enterMode: 3, /*CKEDITOR.ENTER_DIV*/
        toolbar: [
            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strikethrough', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat'] },
            { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language'] },
            { name: 'insert', items: ['Table', 'HorizontalRule', 'Smiley'] },
            { name: 'tools', items: ['Maximize'] }
        ],
        removePlugins: 'elementspath',
        skin: 'moono-lisa', //kama,moono,moono-lisa
        height: "70px"
    };
    get isDefaultCountryCanada() {
        return AppConsts.defaultCountryCode == Country.Canada;
    }
    get ssnMask() {
        return AppConsts.defaultCountryCode == Country.Canada ? AppConsts.masks.sin : AppConsts.masks.ssn;
    }

    selectList = {
        timeZone: [],
        citizenship: [],
        drivingLicenseState: [],
        gender: this.getGenderList(),
        maritalStatus: this.getMaritalStatusList(),
        preferredToD: this.getPreferredToD()
    };
    private readonly settingsDialogId = 'personal-details-dialog';
    settingsDialog$: Subscription;

    htmlFieldOrignValue: string;

    constructor(
        private notifyService: NotifyService,
        private store$: Store<RootStore.State>,
        private timingService: TimingServiceProxy,
        private contactsService: ContactsService,
        private changeDetector: ChangeDetectorRef,
        private permission: AppPermissionService,
        private personContactService: PersonContactServiceProxy,
        private dictionaryProxy: DictionaryServiceProxy,
        private clipboardService: ClipboardService,
        private personalDetailsService: PersonalDetailsService,
        private lifeCycleService: LifecycleSubjectsService,
        public dialog: MatDialog,
        private appSessionService: AppSessionService,
        public ls: AppLocalizationService
    ) {
        this.getStates(this.person && this.person.citizenship);
        this.contactsService.invalidateSubscribe(() => {
            this.person = undefined;
            this.changeDetector.detectChanges();
        }, this.ident);

        this.contactsService.contactInfoSubscribe((contactInfo: ContactInfoDto) => {
            if (contactInfo) {
                this.personContactInfo = contactInfo.personContactInfo;
                this.person = contactInfo.personContactInfo.person;
                this.getStates(this.person && this.person.citizenship);
                this.isEditAllowed = this.permission.checkCGPermission(contactInfo.groups);
                setTimeout(() => this.updateToolbar(contactInfo));
                if (contactInfo.parentId)
                    this.contactsService.closeSettingsDialog(false);
                this.changeDetector.markForCheck();
            }
        }, this.ident);

        this.timingService.getTimezones(AppTimezoneScope.Application).subscribe((res: NameValueDtoListResultDto) => {
            this.selectList.timeZone = res.items.map(item => ({ id: item.value, name: item.name }));
            this.changeDetector.markForCheck();
        });

        this.loadCountries();
        this.getCountries();
        this.loadStates();
    }

    ngAfterViewInit() {
        this.contactsService.settingsDialogOpened$.pipe(
            takeUntil(this.lifeCycleService.destroy$),
            debounceTime(1000)
        ).subscribe(opened => {
            let isOpened = this.contactInfo && this.contactInfo.parentId ? false : opened;
            this.personalDetailsService.togglePersonalDetailsDialog(this.settingsDialogId, isOpened);
        });
    }

    private updateToolbar(contactInfo: ContactInfoDto) {
        let toolbarConfig = {
            optionButton: {
                name: 'options',
                options: {
                    checkPressed: () => this.contactsService.settingsDialogOpened.value
                },
                action: () => {
                    this.contactsService.toggleSettingsDialog();
                }
            }
        };

        this.contactsService.toolbarUpdate(contactInfo && !contactInfo.parentId ? toolbarConfig : null);
    }

    private getCountries() {
        this.store$.pipe(
            select(CountriesStoreSelectors.getCountries),
            filter(Boolean),
            first(),
            map((countries: CountryStateDto[]) => this.getSelectListFromObject(countries))
        ).subscribe((countries: SelectListItem[]) => {
            this.selectList.citizenship = countries;
        });
    }

    getStates(countryId = AppConsts.defaultCountryCode): any {
        this.store$.pipe(
            select(StatesStoreSelectors.getCountryStates, {
                countryCode: countryId || AppConsts.defaultCountryCode
            }),
            filter(Boolean),
            first(),
            map(states => this.getSelectListFromObject(states))
        ).subscribe((states: SelectListItem[]) => {
            this.selectList.drivingLicenseState = states;
        });
    }

    private loadCountries() {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
    }

    private loadStates(countryCode = AppConsts.defaultCountryCode) {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
    }

    getInputData(field): InplaceEditModel {
        let value = (this.person[field] || '').trim();
        return {
            id: field,
            value: value,
            displayValue: field == 'ssn' ?
                this.getSsnMasked(value) : '',
            isEditDialogEnabled: false,
            lEntityName: field,
            editPlaceholder: this.ls.l('EditValuePlaceholder')
        };
    }

    getSelectData(field): InplaceSelectBox {
        return {
            name: field,
            options: this.selectList[field],
            value: this.person[field]
        };
    }

    getSsnMasked(value) {
        if (this.accessConfidentialData && value) {
            let mask = this.ssnMask;
            let blocks = mask.split('-');
            let valueBlocks: string[] = [];
            let index = 0;
            for (let i = 0; i < blocks.length; i++) {
                valueBlocks.push(value.slice(index, index + blocks[i].length));
                index += blocks[i].length;
            }
            return valueBlocks.join('-');
        }

        return value;
    }

    getGenderList() {
        return this.getSelectList(Object.keys(Gender));
    }

    getMaritalStatusList() {
        return this.getSelectList(Object.keys(MaritalStatus));
    }

    getPreferredToD() {
        return this.getSelectList(Object.keys(TimeOfDay));
    }

    getSelectList(items) {
        return items.map(item => ({ id: item, name: this.ls.l(item) }));
    }

    getSelectListFromObject(collection): SelectListItem[] {
        return (collection || []).map(item => ({ id: item.code, name: item.name }));
    }

    focusinBindValue(field: string) {
        this.htmlFieldOrignValue = this.person[field];
    }

    focusoutBindValue(field: string) {
        if (this.htmlFieldOrignValue != this.person[field])
            this.updateValue(this.person[field], field, false);
    }

    updateValue(value: string, field: string, checkInitialValue = true) {
        if (!this.isEditAllowed || !this.person)
            return ;
        if (value == '') value = null;
        let initialValue = this.person[field];
        if (checkInitialValue && initialValue == value)
            return;

        this.person[field] = value;
        /** If field is citizenship - then load its states, changed select list and clear the value */
        if (field === 'citizenship') {
            this.loadStates(value);
            this.getStates(this.person && this.person.citizenship);
            this.person.drivingLicenseState = null;
        }
        if (!this.person.marriageDate)
            this.person.divorceDate = null;
        this.personContactService.updatePersonInfo(new UpdatePersonInfoInput({
            id: this.person.contactId,
            dob: this.getDateWithoutTime(this.person.dob),
            ssn: this.accessConfidentialData ? this.person.ssn : undefined,
            bankCode: this.person.bankCode,
            timeZone: this.person.timeZone,
            maritalStatus: MaritalStatus[this.person.maritalStatus],
            marriageDate: this.getDateWithoutTime(this.person.marriageDate),
            divorceDate: this.getDateWithoutTime(this.person.divorceDate),
            gender: Gender[this.person.gender],
            isUSCitizen: this.person.isUSCitizen,
            citizenship: this.person.citizenship,
            experience: this.person.experience,
            profileSummary: this.person.profileSummary,
            preferredToD: TimeOfDay[this.person.preferredToD],
            drivingLicense: this.accessConfidentialData ? this.person.drivingLicense : undefined,
            drivingLicenseState: this.person.drivingLicenseState,
            isActiveMilitaryDuty: this.person.isActiveMilitaryDuty,
            interests: this.person.interests
        })).subscribe(
            () => this.notifyService.success(this.ls.l('SavedSuccessfully')),
            () => {
                this.person[field] = initialValue;
                this.changeDetector.markForCheck();
            });
    }

    getDateWithoutTime(value) {
        return value ? DateHelper.removeTimezoneOffset(new Date(value), false, 'from') : value;
    }

    allowDigitsOnly(event, exceptions = []) {
        let key = event.event.key;
        if (exceptions.indexOf(key) < 0 && key.length == 1 && isNaN(key)) {
            event.event.preventDefault();
            event.event.stopPropagation();
        }
    }

    saveToClipboard(event, value) {
        event.preventDefault();
        event.stopPropagation();
        this.clipboardService.copyFromContent(value);
        this.notifyService.info(this.ls.l('SavedToClipboard'));
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.ident);
        this.lifeCycleService.destroy.next();
    }
}
