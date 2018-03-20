import { Component, Inject, Injector, Input } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { InplaceEditModel } from 'app/shared/common/inplace-edit/inplace-edit.model';
import { InplaceSelectBoxModel, InplaceSelectBoxOption } from '@app/shared/common/inplace-select-box/inplace-select-box.model';
import { OrganizationContactInfoDto, UpdateOrganizationInfoInput, OrganizationContactServiceProxy, CountryServiceProxy, CountryDto, CountryStateDto, OrganizationTypeServiceProxy } from 'shared/service-proxies/service-proxies';

import * as moment from 'moment';
import * as _ from 'underscore';

@Component({
    selector: 'organization-dialog',
    templateUrl: './organization-dialog.component.html',
    styleUrls: ['./organization-dialog.component.less'],
})
export class OrganizationDialogComponent extends AppComponentBase {
    isEditAllowed: boolean = false;

    org = {
        logo_big: '../../../../../assets/common/images/app-logo-on-light.png',
    };

    countries: InplaceSelectBoxModel = {
        name: "contries",
        options: []
    } as InplaceSelectBoxModel;
    states: InplaceSelectBoxModel = {
        name: "states",
        options: []        
    } as InplaceSelectBoxModel;
    orgTypes: InplaceSelectBoxModel = {
        name: "orgTypes",
        options: []        
    } as InplaceSelectBoxModel;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: OrganizationContactInfoDto,
        public dialogRef: MatDialogRef<OrganizationDialogComponent>,
        private _orgContactService: OrganizationContactServiceProxy,
        private _countryService: CountryServiceProxy,
        private _orgTypeService: OrganizationTypeServiceProxy
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
    
    getPropData(value, fieldName, label) {
        let propData = {
            id: this.data.id,
            value: value,
            validationRules: [],
            isEditDialogEnabled: false,
            lEntityName: fieldName
        } as InplaceEditModel;
        return propData;
    }

    getDatePropData(value: moment.Moment, fieldName, label) {
        return this.getPropData(value ? value.format('MMM YYYY') : null, fieldName, label);
    }

    updateValue(newValue, fieldName) {
        this.data.organization[fieldName] = newValue;
        var input = UpdateOrganizationInfoInput.fromJS(this.data.organization);
        input.id = this.data.id;
        this._orgContactService.updateOrganizationInfo(input).subscribe(result => {});
    }
}