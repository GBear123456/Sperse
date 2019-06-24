/** Core imports */
import { Component, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

/** Third party imports */
import startCase from 'lodash/startCase';
import { Store, select } from '@ngrx/store';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope } from '@shared/AppEnums';
import { NotifyService } from '@abp/notify/notify.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PersonContactServiceProxy, UpdatePersonInfoInput, UpdatePersonInfoInputMaritalStatus, UpdatePersonInfoInputGender,
    PersonInfoDto, UpdatePersonInfoInputPreferredToD, TimingServiceProxy } from 'shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';

@Component({
    templateUrl: './personal-details.component.html',
    styleUrls: ['./personal-details.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalDetailsComponent {
    person: PersonInfoDto;
    isEditAllowed = false;
    startCase = startCase;

    accessConfidentialData = this._permission.isGranted('Pages.CRM.AccessConfidentialData');

    fields = [
        { name: 'citizenship',              type: 'string' },
        { name: 'timeZone',                 type: 'select' },
        { name: 'dob',                      type: 'date'   },
        { name: 'drivingLicense',           type: 'string', confidential: true },
        { name: 'drivingLicenseState',      type: 'select' },
        { name: 'education',                type: 'string' },
        { name: 'gender',                   type: 'select' },
        { name: 'isActiveMilitaryDuty',     type: 'bool'   },
        { name: 'isUSCitizen',              type: 'bool'   },
        { name: 'maritalStatus',            type: 'select' },
        { name: 'marriageDate',             type: 'date'   },
        { name: 'divorceDate',              type: 'date'   },
        { name: 'personalProfile',          type: 'string' },
        { name: 'preferredToD',             type: 'select' },
        { name: 'ssn',                      type: 'string', confidential: true }
    ];

    selectList = {
        timeZone: [],
        drivingLicenseState: [],
        gender: this.getGenderList(),
        maritalStatus: this.getMaritalStatusList(),
        preferredToD: this.getPreferredToD()
    };

    constructor(
        public ls: AppLocalizationService,
        private notifyService: NotifyService,
        private _store$: Store<RootStore.State>,
        private _timingService: TimingServiceProxy,
        private _contactsService: ContactsService,
        private _changeDetector: ChangeDetectorRef,
        private _permission: PermissionCheckerService,
        private _personContactService: PersonContactServiceProxy
    ) {
        this._contactsService.contactInfoSubscribe((contactInfo) => {
            this.person = contactInfo.personContactInfo.person;
            this.isEditAllowed = this._contactsService.checkCGPermission(contactInfo.groupId);
            this._changeDetector.detectChanges();
        });

        this._timingService.getTimezones(AppTimezoneScope.Application).subscribe((res) => {
            this.selectList.timeZone = res.items.map(item => ({id: item.value, name: item.name}));
            this._changeDetector.detectChanges();
        });

        this._store$.dispatch(new StatesStoreActions.LoadRequestAction(AppConsts.defaultCountry));
        this._store$.pipe(select(StatesStoreSelectors.getState, {countryCode: AppConsts.defaultCountry})).subscribe((states) => {
            this.selectList.drivingLicenseState = states.map(item => ({id: item.code, name: item.name}));
        });
    }

    getInputData(field) {
        return {
            id: field,
            value: this.person[field],
            isEditDialogEnabled: false,
            lEntityName: field,
            lEditPlaceholder: this.ls.l('EditValuePlaceholder')
        };
    }

    getSelectData(field) {
        return {
            name: field,
            options: this.selectList[field],
            value: this.person[field]
        }
    }

    getGenderList() {
        return this.getSelectList(['Male', 'Female']);
    }

    getMaritalStatusList() {
        return this.getSelectList([
            'Married',
            'Widowed',
            'Separated',
            'Divorced',
            'Single'
        ]);
    }

    getPreferredToD() {
        return this.getSelectList(Object.keys(UpdatePersonInfoInputPreferredToD));
    }

    getSelectList(items) {
        return items.map(item => ({id: item, name: this.ls.l(item)}));
    }

    updateValue(value, field) {
        this.person[field] = value;
        this._personContactService.updatePersonInfo(new UpdatePersonInfoInput({
            id: this.person.contactId,
            dob: this.person.dob,
            ssn: this.accessConfidentialData ? this.person.ssn : undefined,
            timeZone: this.person.timeZone,
            maritalStatus: UpdatePersonInfoInputMaritalStatus[this.person.maritalStatus],
            marriageDate: this.person.marriageDate,
            divorceDate: this.person.divorceDate,
            gender: UpdatePersonInfoInputGender[this.person.gender],
            isUSCitizen: this.person.isUSCitizen,
            citizenship: this.person.citizenship,
            education: this.person.education,
            personalProfile: this.person.personalProfile,
            preferredToD: UpdatePersonInfoInputPreferredToD[this.person.preferredToD],
            drivingLicense: this.accessConfidentialData ? this.person.drivingLicense : undefined,
            drivingLicenseState: this.person.drivingLicenseState,
            isActiveMilitaryDuty: this.person.isActiveMilitaryDuty,
        })).subscribe(() => {
            this.notifyService.success(this.ls.l('SavedSuccessfully'));
        });
    }

    allowDigitsOnly(event, exceptions = []) {
        let key = event.event.key;
        if (exceptions.indexOf(key) < 0 && key.length == 1 && isNaN(key)) {
            event.event.preventDefault();
            event.event.stopPropagation();
        }
    }
}
