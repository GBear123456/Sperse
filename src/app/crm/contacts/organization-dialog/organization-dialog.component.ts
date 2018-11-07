/** Core imports */
import { Component, Inject, Injector } from '@angular/core';

/** Third party imports */
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Store, select } from '@ngrx/store';
import * as moment from 'moment';
import * as _ from 'underscore';

/** Application imports */
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import { StringHelper } from '@shared/helpers/StringHelper';
import { AppConsts } from '@shared/AppConsts';
import { InplaceSelectBoxModel } from '@app/shared/common/inplace-select-box/inplace-select-box.model';
import { OrganizationContactInfoDto, UpdateOrganizationInfoInput, OrganizationContactServiceProxy, ContactPhotoServiceProxy, ContactPhotoDto, CreateContactPhotoInput, OrganizationTypeDto } from 'shared/service-proxies/service-proxies';

import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { OrganizationTypeSelectors } from '@app/store/organization-types-store';

@Component({
    selector: 'organization-dialog',
    templateUrl: './organization-dialog.component.html',
    styleUrls: ['./organization-dialog.component.less'],
    providers: [ContactPhotoServiceProxy]
})
export class OrganizationDialogComponent extends AppComponentBase {
    isEditAllowed = false;

    organizationTypes: OrganizationTypeDto[];
    organizationTypesSelectBoxModel: InplaceSelectBoxModel = {
        name: 'typeId',
        options: []
    } as InplaceSelectBoxModel;
    countries: InplaceSelectBoxModel = {
        name: 'contries',
        options: []
    } as InplaceSelectBoxModel;
    states: InplaceSelectBoxModel = {
        name: 'states',
        options: []
    } as InplaceSelectBoxModel;
    companySizeList: any = [
        {id: 0, name: '1 to 9', value: '1-9'},
        {id: 1, name: '10 to 19', value: '10-19'},
        {id: 2, name: '20 to 49', value: '20-49'},
        {id: 3, name: '50 to 99', value: '50-99'},
        {id: 4, name: '100 to 249', value: '100-249'},
        {id: 5, name: '250 to 499', value: '250-499'},
        {id: 6, name: '500 to 999', value: '500-999'},
        {id: 7, name: '1,000 to 2,499', value: '1000-2499'},
        {id: 8, name: '2,500 to 4,999', value: '2500-4999'},
        {id: 9, name: '5,000 to 9,999', value: '5000-9999'},
        {id: 10, name: '10,000 or more', value: '10000-'}
    ];

    sections: any = [
        {
            header: true,
            expandable: false,
            field: 'companyName'
        },
        {
            header: false,
            expandable: false,
            fields: [
                ['shortname', 'formedDate'],
                [
                    'industry',
                    {
                        name: 'type',
                        data: this.organizationTypesSelectBoxModel,
                        onChange: (value) => {
                            if (value !== this.data.organization.typeId) {
                                let item = _.find(this.organizationTypes, item => item.id === value);
                                item && this.updateValue(item.id, 'typeId');
                            }
                        }
                    }
                ],
                [
                    'annualRevenue',
                    {
                        name: 'size',
                        data: {
                            name: 'size',
                            options: this.companySizeList,
                            value: this.getCompanySize()
                        },
                        onChange: (value) => {
                            let item = this.companySizeList[value];
                            item && this.updateValue(item.name, 'size');
                        }
                    }
                ]
            ]
        },
        {
            header: false,
            expandable: true,
            fields: [
                ['ein', 'duns'],
                ['businessSicCode', 'ticker'],
                [
                    {
                        name: 'formedCountryId',
                        data: this.countries,
                        onChange: this.countryChanged.bind(this)
                    },
                    {
                        name: 'formedStateId',
                        data: this.states,
                        onChange: this.stateChanged.bind(this)
                    }
                ],
                ['description', 'productServicesSold']
            ]
    }];

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: OrganizationContactInfoDto,
        public dialog: MatDialog,
        public dialogRef: MatDialogRef<OrganizationDialogComponent>,
        private _orgContactService: OrganizationContactServiceProxy,
        private _contactPhotoServiceProxy: ContactPhotoServiceProxy,
        private store$: Store<RootStore.State>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.isEditAllowed = this.isGranted('Pages.CRM.Customers.Manage');
        this.loadCountries();

        this.store$.pipe(select(OrganizationTypeSelectors.getOrganizationTypes))
            .subscribe(result => {
                this.organizationTypes = result;
                var otherItem = _.find(this.organizationTypes, item => item.id === 'O');
                this.organizationTypes = _.filter(this.organizationTypes, item => item.id !== 'O');
                this.organizationTypes.push(otherItem);

                this.organizationTypesSelectBoxModel.options = this.organizationTypes;
                var item = _.find(this.organizationTypes, item => item.id === this.data.organization['typeId']);
                this.organizationTypesSelectBoxModel.value = item ? item.id : null;
            });
    }

    loadCountries() {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe(result => {
            this.countries.options = result.map((v, i, a) => { return { id: v.code, name: v.name }; });
            let currentCountry = this.data.organization.formedCountryId;
            if (currentCountry) {
                this.countries.value = currentCountry;
                this.loadStates(currentCountry);
            }
        });
    }

    loadStates(countryCode) {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode }))
            .subscribe(result => {
                this.states.options = result.map((v, i, a) => { return {id: v.code, name: v.name}; });
                let currentState = this.data.organization.formedStateId;
                if (currentState) {
                    this.states.value = currentState;
                }
            });
    }

    countryChanged(countryCode) {
        if (countryCode != this.data.organization.formedCountryId) {
            this.data.organization.formedStateId = null;
            this.updateValue(countryCode, 'formedCountryId');
            this.loadStates(countryCode);
        }
    }

    stateChanged(stateCode) {
        if (stateCode != this.data.organization.formedStateId) {
            this.updateValue(stateCode, 'formedStateId');
        }
    }

    getPropData(item) {
        let field = item.name || item,
            value = this.data.organization[field] || '';

        //MB: need to include validation rules into item
        let validationRules = [];
        if (field == 'ein'  || field == 'productServicesSold' || field == 'businessSicCode')
            validationRules.push({type: 'numeric', message: this.l('ValueShouldBeNumeric')});
        if (field == 'ein')
            validationRules.push({type: 'stringLength', max: 9, message: this.l('ValueMaxLength', 9)});
        return {
            id: this.data.id,
            value: value instanceof moment ?
                value.format('MMM YYYY') : value,
            validationRules: validationRules,
            isEditDialogEnabled: false,
            lEntityName: field,
            lEditPlaceholder: this.l('EditValuePlaceholder')
        };
    }

    getCompanySize() {
        let companySizeStr = this.data.organization['sizeFrom'] + '-' +
            (this.data.organization['sizeTo'] || '');
        let item = this.companySizeList.find(x => x.value == companySizeStr);
        return item ? item.id : null;
    }

    updateValue(value, field) {
        let fieldName = field.name || field;
        if (fieldName == 'size') {
            let item = this.companySizeList.find(x => x.name == value);
            let [fromValue, toValue] = item.value.split('-');
            this.data.organization['sizeFrom'] = fromValue;
            this.data.organization['sizeTo'] = toValue;
        } else
            this.data.organization[fieldName] = value;

        this._orgContactService.updateOrganizationInfo(
            UpdateOrganizationInfoInput.fromJS(
                _.extend({id: this.data.id}, this.data.organization))
        ).subscribe(result => {
            if (field == 'companyName')
                this.data.fullName = value;
        });
    }

    toggleMoreFields($event) {
        let element = $event.target;
        [element, element.nextSibling].forEach(
            (e) => e.classList.toggle('collapsed')
        );
    }

    showUploadPhotoDialog($event) {
        $event.stopPropagation();
        this.dialog.open(UploadPhotoDialogComponent, {
          data: this.data,
          hasBackdrop: true
        }).afterClosed().subscribe(result => {
            if (result) {
                let base64OrigImage = StringHelper.getBase64(result.origImage);
                let base64Thumbnail = StringHelper.getBase64(result.thumImage);
                this._contactPhotoServiceProxy.createContactPhoto(
                    CreateContactPhotoInput.fromJS({
                        contactId: this.data.id,
                        originalImage: base64OrigImage,
                        thumbnail: base64Thumbnail
                    })
                ).subscribe((result) => {
                    this.data.primaryPhoto = ContactPhotoDto.fromJS({
                        original: base64OrigImage,
                        thumbnail: base64Thumbnail
                    });
                });
            }
        });
        event.stopPropagation();
    }
}
