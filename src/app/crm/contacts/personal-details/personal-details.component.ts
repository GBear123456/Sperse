/** Core imports */
import { Component, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import startCase from 'lodash/startCase';
import { Store, select } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope } from '@shared/AppEnums';
import { NotifyService } from '@abp/notify/notify.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PersonContactServiceProxy, UpdatePersonInfoInput, MaritalStatus, Gender, PersonContactInfoDto,
    DictionaryServiceProxy, PersonInfoDto, TimeOfDay, TimingServiceProxy } from 'shared/service-proxies/service-proxies';
import { PersonalDetailsDialogComponent } from './personal-details-dialog/personal-details-dialog.component';
import { ContactsService } from '../contacts.service';
import { AppPermissions } from '@shared/AppPermissions';
import { InplaceEditModel } from '@app/shared/common/inplace-edit/inplace-edit.model';

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
    personContactInfo: PersonContactInfoDto;
    interests$ = this._dictionaryProxy.getInterests();
    accessConfidentialData = this._permission.isGranted(AppPermissions.CRMAccessConfidentialData);

    columns = [
        [
            { name: 'citizenship',          type: 'select'                                              },
            { name: 'timeZone',             type: 'select'                                              },
            { name: 'dob',                  type: 'date'                                                },
            { name: 'drivingLicense',       type: 'string', confidential: true                          },
            { name: 'drivingLicenseState',  type: 'select'                                              },
            { name: 'experience',           type: 'string', multiline:    true                          },
            { name: 'gender',               type: 'select'                                              },
            { name: 'interests',            type: 'list',   multiline:    true, source: this.interests$ },
        ], [
            { name: 'isActiveMilitaryDuty', type: 'bool'                                                },
            { name: 'isUSCitizen',          type: 'bool'                                                },
            { name: 'maritalStatus',        type: 'select'                                              },
            { name: 'marriageDate',         type: 'date'                                                },
            { name: 'divorceDate',          type: 'date'                                                },
            { name: 'profileSummary',       type: 'string', multiline:    true                          },
            { name: 'preferredToD',         type: 'select'                                              },
            { name: 'ssn',                  type: 'string', confidential: true                          }
        ]
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
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        private notifyService: NotifyService,
        private _store$: Store<RootStore.State>,
        private _timingService: TimingServiceProxy,
        private contactsService: ContactsService,
        private _changeDetector: ChangeDetectorRef,
        private _permission: AppPermissionService,
        private _personContactService: PersonContactServiceProxy,
        private _dictionaryProxy: DictionaryServiceProxy,
        private clipboardService: ClipboardService,
        private _asyncPipe: AsyncPipe
    ) {
        this.contactsService.contactInfoSubscribe((contactInfo) => {
            this.personContactInfo = contactInfo.personContactInfo;
            this.person = contactInfo.personContactInfo.person;
            this.isEditAllowed = this.contactsService.checkCGPermission(contactInfo.groupId);
            setTimeout(() => this.contactsService.toolbarUpdate({
                optionButton: {
                    name: 'options',
                    action: this.showPersonalDetailsDialog.bind(this)
                }
            }));
            this._changeDetector.markForCheck();
        }, this.constructor.name);

        this._timingService.getTimezones(AppTimezoneScope.Application).subscribe((res) => {
            this.selectList.timeZone = res.items.map(item => ({id: item.value, name: item.name}));
            this._changeDetector.markForCheck();
        });

        this._store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this._store$.dispatch(new StatesStoreActions.LoadRequestAction(AppConsts.defaultCountry));
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

    getSelectData(field) {
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
                bankCode: this.person.bankCode,
                timeZone: this.person.timeZone,
                maritalStatus: MaritalStatus[this.person.maritalStatus],
                marriageDate: this.person.marriageDate,
                divorceDate: this.person.divorceDate,
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
            })).subscribe(() => {
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

    showPersonalDetailsDialog() {
        setTimeout(() =>
            this.dialog.open(PersonalDetailsDialogComponent, {
                panelClass: ['slider'],
                disableClose: false,
                hasBackdrop: false,
                closeOnNavigation: true,
                data: {}
            })
        );
    }

    saveToClipboard(event, value) {
        event.preventDefault();
        event.stopPropagation();
        this.clipboardService.copyFromContent(value);
        this.notifyService.info(this.ls.l('SavedToClipboard'));
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.constructor.name);
    }
}