import { AppConsts } from '@shared/AppConsts';
import { Component, OnInit, Injector } from '@angular/core';
import { EditAddressDialog } from '../edit-address-dialog/edit-address-dialog.component';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConfirmDialog } from '@shared/common/dialogs/confirm/confirm-dialog.component';
import { MdDialog, MdDialogRef } from '@angular/material';
import { CustomersServiceProxy, ContactAddressServiceProxy, CustomerInfoDto, CountryDto, CountryServiceProxy,
  ContactAddressDto, UpdateContactAddressInput, CreateContactAddressInput } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
  selector: 'addresses',
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.less']
})
export class AddressesComponent extends AppComponentBase implements OnInit {
  data: {
    customerInfo: CustomerInfoDto
  };  
  types: Object = {};
  country: string;
  streetNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;

  isEditAllowed: boolean = false;

  countries: CountryDto[];

  constructor(
    injector: Injector,
    public dialog: MdDialog,
    private _customerService: CustomersServiceProxy,
    private _addressService: ContactAddressServiceProxy,
    private _countryService: CountryServiceProxy
  ) { 
    super(injector, AppConsts.localization.CRMLocalizationSourceName);

    _addressService.getAddressUsageTypes().subscribe(result => {      
      result.items.reduce(function(obj, type){
        obj[type.id] = type.name;
        return obj;
      }, this.types);
    });

    this._countryService.getCountries()
      .subscribe(result => {
        this.countries = result;
      });

    this.isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');
  }

  getDialogPossition(event) {
    let shift = 245, parent = event.target
      .closest(".address-wrapper");        

    if (parent) {
      let rect = parent.getBoundingClientRect();
      return {
        top: (rect.top + rect.height / 2 - shift) + 'px', 
        left: (rect.left + rect.width / 2) + 'px'
      };
    } else
      return {
        top: event.clientY - shift + 'px',
        left: event.clientX + 'px'
      };
  }

  showDialog(address, event, index) {
    let dialogData = _.pick(address || {}, 'id', 'city', 
      'comment', 'country', 'isActive', 'isConfirmed', 
      'state', 'streetAddress', 'usageTypeId', 'zip');
    dialogData.contactId = this.data
      .customerInfo.primaryContactInfo.id;
    dialogData.deleteItem = (event) => {
      this.deleteAddress(address, event, index);
    };
    this.dialog.closeAll();
    this.dialog.open(EditAddressDialog, {
      data: dialogData,
      hasBackdrop: false,
      position: this.getDialogPossition(event)
    }).afterClosed().subscribe(result => {
      if (result) 
        this.updateDataField(address, dialogData);
    });
    event.stopPropagation();
  }

  updateDataField(address, data) {
    this._addressService
      [(address ? 'update': 'create') + 'ContactAddress'](              
        (address ? UpdateContactAddressInput: CreateContactAddressInput).fromJS(data)
      ).subscribe(result => { 
        if (!result && address) {
          address.city = data.city;
          address.country = data.country;
          address.isActive = data.isActive;
          address.isConfirmed = data.isConfirmed;
          address.state = data.state;
          address.streetAddress = data.streetAddress;
          address.comment = data.comment;
          address.usageTypeId = data.usageTypeId;
          address.zip = data.zip;
        } else if (result.id) {
          data.id = result.id;                  
          this.data.customerInfo.primaryContactInfo.addresses
            .push(ContactAddressDto.fromJS(data));
        }        
      }
    );
  }

  deleteAddress(address, event, index){
    this.dialog.open(ConfirmDialog, {
      data: {
        title: this.l('DeleteContactHeader', this.l('Address')),
        message: this.l('DeleteContactMessage', this.l('Address').toLowerCase())
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.dialog.closeAll();
        this._addressService.deleteContactAddress(
          this.data.customerInfo.primaryContactInfo.id, address.id).subscribe(result => {
            this.data.customerInfo.primaryContactInfo.addresses.splice(index, 1);
          });
      }
    });
    event.stopPropagation();
  }

  inPlaceEdit(address, event, index) {  
    if(!this.isEditAllowed || !window['google'])
      return this.showDialog(address, event, index);

    address.inplaceEdit = true;
    address.autoComplete = [
      address.streetAddress, 
      address.city, 
      address.state, 
      address.zip,
      address.country
    ].join(',');
    event.stopPropagation();
  }

  closeInPlaceEdit(address, event) {
    this.clearInplaceData();
    address.inplaceEdit = false;
    event.jQueryEvent.stopPropagation();
  }

  clearInplaceData() {
    this.country = '';
    this.streetNumber = '';
    this.streetAddress = '';
    this.city = '';
    this.state = '';
    this.zip = '';
  }

  updateItem(address, event) {
    let countryId = _.findWhere(this.countries, {name: this.country})['code'];
    countryId && this._countryService
      .getCountryStates(countryId)
      .subscribe(states => {
        if(this.country && this.streetNumber && this.state &&
          this.streetAddress && this.city && 
          ((this.country != address.country) ||
            (address.streetAddress != (this.streetAddress + ' ' + this.streetNumber)) ||
            (this.city != address.city) ||
            (this.state != address.state))
        ) {    
          this.updateDataField(address, {
            id: address.id,
            contactId: this.data.customerInfo
              .primaryContactInfo.id,
            city: this.city,
            country: this.country,
            isActive: address.isActive,
            isConfirmed: address.isConfirmed,
            state: this.state,
            streetAddress: this.streetAddress + ' ' + this.streetNumber,
            comment: address.comment,
            usageTypeId: address.usageTypeId,
            countryId: countryId,
            stateId: _.findWhere(states, {name: this.state})['code']
          });
          this.clearInplaceData();
        }
      });    
    address.inplaceEdit = false;
    event.jQueryEvent.stopPropagation();
  }

  ngOnInit() {
    this.data = this._customerService['data'];
  }
}