import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';

import { 
  ContactAddressServiceProxy,
  MemberServiceProxy,
  CountryStateDto
} from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
  selector: 'edit-address-dialog',
  templateUrl: 'edit-address-dialog.html',
  styleUrls: ['edit-address-dialog.less']
})
export class EditAddressDialog extends AppComponentBase {
  types: any[] = [];
  validator: any;
  action: string;
  address: any;

  states: CountryStateDto[];
  options = {
    types: ['address'],
    componentRestrictions: {
      country: 'US'
    }
  };

  constructor(
    injector: Injector,
    @Inject(MD_DIALOG_DATA) public data: any,
    public dialogRef: MdDialogRef<EditAddressDialog>,
    private _contactAddressService: ContactAddressServiceProxy,
    private _memberService: MemberServiceProxy
  ) { 
    super(injector, AppConsts.localization.CRMLocalizationSourceName);
        
    if (data.city) {
      this.action = 'Edit';
      this.address = [
        data.streetAddress,
        data.city,
        data.state,
        data.country
      ].join(',');
    } else
      this.action = 'Create';

    this.addressTypesLoad();
    this.addressStatesLoad();
  }

  addressStatesLoad(): void {
    this._memberService
      .getCountryStates(this.options.componentRestrictions.country)
      .subscribe(result => {
        this.states = result;
      });
  }

  addressTypesLoad() {
    this._contactAddressService.getAddressUsageTypes().subscribe(result => {      
      this.types = result.items;
    });
  }

  onSave(event) {
    if (!this.data.streetAddress)
      this.data.streetAddress = this.address;
    if (this.validator.validate().isValid && this.data.streetAddress) {
      this.data.countryId = this.options.componentRestrictions.country;
      this.data.stateId = _.findWhere(this.states, {name: this.data.state})['code'];
      this.dialogRef.close(true);
    }
  }

  initValidationGroup(event){
    this.validator = event.component;
  }
}