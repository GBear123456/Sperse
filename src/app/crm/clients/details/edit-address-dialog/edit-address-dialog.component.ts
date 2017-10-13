import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, ElementRef } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';

import { 
  ContactAddressServiceProxy,
  CountryServiceProxy,
  CountryStateDto, CountryDto
} from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
  selector: 'edit-address-dialog',
  templateUrl: 'edit-address-dialog.html',
  styleUrls: ['edit-address-dialog.less'],
  host: {
    '(document:mouseup)': "mouseUp($event)",
    '(document:mousemove)': "mouseMove($event)"
  }
})
export class EditAddressDialog extends AppComponentBase {
  types: any[] = [];
  validator: any;
  action: string;
  address: any;
  movePos: any;
  isEditAllowed: boolean = false;
  states: CountryStateDto[];
  countries: CountryDto[];

  googleAutoComplete: Boolean;

  constructor(
    injector: Injector,
    private elementRef: ElementRef,
    @Inject(MD_DIALOG_DATA) public data: any,
    public dialogRef: MdDialogRef<EditAddressDialog>,
    private _contactAddressService: ContactAddressServiceProxy,
    private _countryService: CountryServiceProxy
  ) { 
    super(injector, AppConsts.localization.CRMLocalizationSourceName);
    this.isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');        
    if (data.city) {
      this.action = 'Edit';
      this.address = 
        this.googleAutoComplete ? [
          data.streetAddress,
          data.city,
          data.state,
          data.country
        ].join(','): data.streetAddress;
    } else
      this.action = 'Create';

    this.googleAutoComplete = Boolean(window['google']);
    console.log(this.googleAutoComplete);

    this.addressTypesLoad();
    this.countriesStateLoad();
  }

  countriesStateLoad(): void {
    this._countryService.getCountries()
      .subscribe(result => {
        this.countries = result;
        if (this.data.country)
          this.onCountryChange({
            value: this.data.country
          });
      });
  }

  onCountryChange(event) {
    this._countryService
      .getCountryStates(_.findWhere(this.countries, {name: event.value})['code'])
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
    if (!this.googleAutoComplete || !this.data.streetAddress)
      this.data.streetAddress = this.address;
    if (this.validator.validate().isValid && this.data.streetAddress) {
      this.data.countryId = _.findWhere(this.countries, {name: this.data.country})['code'];
      this.data.stateId = _.findWhere(this.states, {name: this.data.state})['code'];
      this.dialogRef.close(true);
    }
  }

  initValidationGroup(event){
    this.validator = event.component;
  }

  mouseDown(event) {
    this.movePos =  {
      x: event.clientX,
      y: event.clientY
    }
  }

  mouseUp(event) {
    this.movePos = null;
  }

  mouseMove(event) {
    if (this.movePos) {
      let x = event.clientX - this.movePos.x,
        y = event.clientY - this.movePos.y,
        elm = this.elementRef.nativeElement
          .parentElement.parentElement;

      this.dialogRef.updatePosition({
        top: parseInt(elm.style.marginTop) + y + 'px',
        left: parseInt(elm.style.marginLeft) + x + 'px'
      });

      this.mouseDown(event);
    }
  }
}