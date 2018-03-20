import { Component, Inject, Injector, Input } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { InplaceEditModel } from 'app/shared/common/inplace-edit/inplace-edit.model';
import { InplaceSelectBoxModel, InplaceSelectBoxOption } from '@app/shared/common/inplace-select-box/inplace-select-box.model';
import { OrganizationContactInfoDto, UpdateOrganizationInfoInput, OrganizationContactServiceProxy, 
    CountryServiceProxy, CountryDto, CountryStateDto, OrganizationTypeServiceProxy } from 'shared/service-proxies/service-proxies';

import { UploadPhotoDialogComponent } from '../upload-photo-dialog/upload-photo-dialog.component';
import { MatDialog } from '@angular/material';
                                                                                  

import * as moment from 'moment';
import * as _ from 'underscore';

@Component({
    selector: 'organization-dialog',
    templateUrl: './organization-dialog.component.html',
    styleUrls: ['./organization-dialog.component.less'],
})
export class OrganizationDialogComponent extends AppComponentBase {
    isEditAllowed: boolean = false;

    countries: InplaceSelectBoxModel = {
        name: "contries",
        options: []
    } as InplaceSelectBoxModel;
    states: InplaceSelectBoxModel = {
        name: "states",
        options: []        
    } as InplaceSelectBoxModel;
    companySizeList: any = [
        {id: 0, name: '10 - 25'}, 
        {id: 1, name: '25 - 50'}, 
        {id: 2, name: '50 - 100'}, 
        {id: 3, name: '100 - 1000'}
    ];

    sections: any = [{
        expandable: false,
        fields: [
            ['shortname', 'formedDate'],
            ['industry', 'relationship'],
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
    }, {
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
        private _countryService: CountryServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        
        this.isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');
        this.loadCountries();
    }

    loadCountries() {
        this._countryService.getCountries().subscribe(result => {
            this.countries.options = result.map((v, i, a) => { return { id: v.code, name: v.name } });
            let currentCountry = this.data.organization.formedCountryId;
            if (currentCountry) {
                this.countries.value = currentCountry;
                this.loadStates(currentCountry);
            }
        });    
    }

    loadStates(countryCode) {
        this._countryService.getCountryStates(countryCode).subscribe(result => {
            this.states.options = result.map((v, i, a) => { return { id: v.code, name: v.name } });
            let currentState = this.data.organization.formedStateId;
            if (currentState) {
                this.states.value = currentState;
            }
        });
    }
    
    countryChanged(countryCode) {
        if (countryCode != this.data.organization.formedCountryId) {
            this.data.organization.formedStateId = null;
            this.updateValue(countryCode, "formedCountryId");
            this.loadStates(countryCode);
        }
    }

    stateChanged(stateCode) {
        if (stateCode != this.data.organization.formedStateId) {
            this.updateValue(stateCode, "formedStateId");
        }
    }
    
    getPropData(item) {
        let field = item.name || item,
            value = this.data.organization[field] || '';
        return {
            id: this.data.id,
            value: typeof(value) == 'string' ? 
                value: value.format('MMM YYYY'),
            validationRules: [],
            isEditDialogEnabled: false,
            lEntityName: field,
            lEditPlaceholder: 'Enter value'
        };
    }

    getCompanySize() {
        return this.data.organization['sizeFrom'] + ' - ' + 
            this.data.organization['sizeTo'];
    }

    updateValue(value, field) {
        let fieldName = field.name || field;
        if (fieldName == 'size') {
            let [fromValue, toValue] = value.split(' - ');
            this.data.organization['sizeFrom'] = fromValue;
            this.data.organization['sizeTo'] = toValue;
        } else
            this.data.organization[fieldName] = value;

        this._orgContactService.updateOrganizationInfo(
            UpdateOrganizationInfoInput.fromJS(
                _.extend({id: this.data.id}, this.data.organization))
        ).subscribe(result => {});
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
        });
    }
}