/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import startCase from 'lodash/startCase';
import { select, Store } from '@ngrx/store';
import { filter, first, map } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope } from '@shared/AppEnums';
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
export class PersonalDetailsComponent implements OnDestroy {
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
                    { name: 'isUSCitizen', type: 'bool' },
                    { name: 'isActiveMilitaryDuty', type: 'bool' }
                ] : []
            )
        ], [
            { name: 'Profile Summary', type: 'head', icon: 'blog' },
            { name: 'profileSummary', type: 'string', multiline: true }
        ], [
            { name: 'Experience', type: 'head', icon: 'blog' },
            { name: 'experience', type: 'string', multiline: true }
        ]
    ];

    selectList = {
        timeZone: [],
        citizenship: [],
        drivingLicenseState: [],
        gender: this.getGenderList(),
        maritalStatus: this.getMaritalStatusList(),
        preferredToD: this.getPreferredToD()
    };
    private readonly settingsDialogId = 'personal-details-dialog';

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
        private lifecycleService: LifecycleSubjectsService,
        public dialog: MatDialog,
        private appSessionService: AppSessionService,
        public ls: AppLocalizationService
    ) {
        this.getStates(this.person && this.person.citizenship);
        this.contactsService.contactInfoSubscribe((contactInfo: ContactInfoDto) => {
            this.personContactInfo = contactInfo.personContactInfo;
            this.person = contactInfo.personContactInfo.person;
            this.getStates(this.person && this.person.citizenship);
            this.isEditAllowed = this.permission.checkCGPermission(contactInfo.groupId);
            setTimeout(() => this.updateToolbar());
            if (this.contactsService.settingsDialogOpened.value)
                this.personalDetailsService.togglePersonalDetailsDialog(this.settingsDialogId, false);
            this.changeDetector.markForCheck();
        }, this.ident);

        this.timingService.getTimezones(AppTimezoneScope.Application).subscribe((res) => {
            this.selectList.timeZone = res.items.map(item => ({ id: item.value, name: item.name }));
            this.changeDetector.markForCheck();
        });

        this.loadCountries();
        this.getCountries();
        this.loadStates();
    }

    private updateToolbar() {
        this.contactsService.toolbarUpdate({
            optionButton: {
                name: 'options',
                options: {
                    checkPressed: () => this.contactsService.settingsDialogOpened.value
                },
                action: () => {
                    this.personalDetailsService.togglePersonalDetailsDialog(this.settingsDialogId);
                }
            }
        });
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

    getStates(countryId = AppConsts.defaultCountry): any {
        this.store$.pipe(
            select(StatesStoreSelectors.getCountryStates, {
                countryCode: countryId || AppConsts.defaultCountry
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

    private loadStates(countryId = AppConsts.defaultCountry) {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryId));
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
        return this.accessConfidentialData && value ?
            [value.slice(0, 3), value.slice(3, 5), value.slice(-4)].join('-')
            : value;
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

    updateValue(value: string, field: string) {
        let initialValue = this.person[field];
        if (initialValue != value) {
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
        this.lifecycleService.destroy.next();
    }
}
