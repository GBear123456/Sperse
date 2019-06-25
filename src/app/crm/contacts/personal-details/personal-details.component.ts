/** Core imports */
import { Component, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';

/** Third party imports */
import startCase from 'lodash/startCase';
import { Store, select } from '@ngrx/store';
import { map } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope } from '@shared/AppEnums';
import { NotifyService } from '@abp/notify/notify.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PersonContactServiceProxy, UpdatePersonInfoInput, UpdatePersonInfoInputMaritalStatus, UpdatePersonInfoInputGender, PersonInfoDtoMaritalStatus,
    PersonInfoDtoGender, PersonInfoDto, UpdatePersonInfoInputPreferredToD, TimingServiceProxy } from 'shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';

@Component({
    templateUrl: './personal-details.component.html',
    styleUrls: ['./personal-details.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ AsyncPipe ]
})
export class PersonalDetailsComponent implements OnDestroy {
    person: PersonInfoDto;
    isEditAllowed = false;
    startCase = startCase;

    accessConfidentialData = this._permission.isGranted('Pages.CRM.AccessConfidentialData');

    fields = [
        { name: 'citizenship',              type: 'select'                         },
        { name: 'timeZone',                 type: 'select'                         },
        { name: 'dob',                      type: 'date'                           },
        { name: 'drivingLicense',           type: 'string',     confidential: true },
        { name: 'drivingLicenseState',      type: 'select'                         },
        { name: 'education',                type: 'string'                         },
        { name: 'gender',                   type: 'select'                         },
        { name: 'isActiveMilitaryDuty',     type: 'bool'                           },
        { name: 'isUSCitizen',              type: 'bool'                           },
        { name: 'maritalStatus',            type: 'select'                         },
        { name: 'marriageDate',             type: 'date'                           },
        { name: 'divorceDate',              type: 'date'                           },
        { name: 'personalProfile',          type: 'string'                         },
        { name: 'preferredToD',             type: 'select'                         },
        { name: 'ssn',                      type: 'string',     confidential: true }
    ];

    selectList = {
        timeZone: [],
        citizenship: this._asyncPipe.transform(this._store$.pipe(
            select(CountriesStoreSelectors.getCountries),
            map(countries => this.getSelectListFromObject(countries))
        )),
        drivingLicenseState: this._asyncPipe.transform(this._store$.pipe(
            select(StatesStoreSelectors.getState, {countryCode: AppConsts.defaultCountry}),
            map(states => this.getSelectListFromObject(states))
        )),
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
        private _personContactService: PersonContactServiceProxy,
        private _asyncPipe: AsyncPipe
    ) {
        this._contactsService.contactInfoSubscribe((contactInfo) => {
            this.person = contactInfo.personContactInfo.person;
            this.isEditAllowed = this._contactsService.checkCGPermission(contactInfo.groupId);
            this._changeDetector.markForCheck();
        }, this.constructor.name);

        this._timingService.getTimezones(AppTimezoneScope.Application).subscribe((res) => {
            this.selectList.timeZone = res.items.map(item => ({id: item.value, name: item.name}));
            this._changeDetector.markForCheck();
        });

        this._store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this._store$.dispatch(new StatesStoreActions.LoadRequestAction(AppConsts.defaultCountry));
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
        };
    }

    getGenderList() {
        return this.getSelectList(Object.keys(PersonInfoDtoGender));
    }

    getMaritalStatusList() {
        return this.getSelectList(Object.keys(PersonInfoDtoMaritalStatus));
    }

    getPreferredToD() {
        return this.getSelectList(Object.keys(UpdatePersonInfoInputPreferredToD));
    }

    getSelectList(items) {
        return items.map(item => ({id: item, name: this.ls.l(item)}));
    }

    getSelectListFromObject(collection) {
        return (collection || []).map(item => ({id: item.code, name: item.name}));
    }

    updateValue(value, field) {
        let initialValue = this.person[field];
        if (initialValue != value) {
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
            })).subscribe(result => {
                this.notifyService.success(this.ls.l('SavedSuccessfully'));
            }, () => {
                this.person[field] = initialValue;
                this._changeDetector.markForCheck();
            });
        }
    }

    allowDigitsOnly(event, exceptions = []) {
        let key = event.event.key;
        if (exceptions.indexOf(key) < 0 && key.length == 1 && isNaN(key)) {
            event.event.preventDefault();
            event.event.stopPropagation();
        }
    }

    ngOnDestroy() {
        this._contactsService.unsubscribe(this.constructor.name);
    }
}