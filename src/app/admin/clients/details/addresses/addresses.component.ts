import { Component, OnInit, Injector } from '@angular/core';
import { EditAddressDialog } from '../edit-address-dialog/edit-address-dialog.component';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MdDialog, MdDialogRef } from '@angular/material';
import { CustomersServiceProxy, ContactAddressServiceProxy, CustomerInfoDto, 
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

  constructor(
    injector: Injector,
    public dialog: MdDialog,
    private _customerService: CustomersServiceProxy,
    private _addressService: ContactAddressServiceProxy
  ) { 
    super(injector);
  }

  editAddress(address) {
    let dialogData = _.pick(address || {}, 'id', 'city', 
      'comment', 'country', 'isActive', 'isConfirmed', 
      'state', 'streetAddress', 'usageTypeId', 'zip');
    dialogData.contactId = this.data
      .customerInfo.primaryContactInfo.id;
    this.dialog.open(EditAddressDialog, {
      data: dialogData
    }).afterClosed().subscribe(result => {
      if (result) {
        this._addressService
          [(address ? 'update': 'create') + 'ContactAddress'](              
            (address ? UpdateContactAddressInput: CreateContactAddressInput).fromJS(dialogData)
          ).subscribe(result => { 
            if (!result && address) {
              address.city = dialogData.city;
              address.country = dialogData.country;
              address.isActive = dialogData.isActive;
              address.isConfirmed = dialogData.isConfirmed;
              address.state = dialogData.state;
              address.streetAddress = dialogData.streetAddress;
              address.comment = dialogData.comment;
              address.usageTypeId = dialogData.usageTypeId;
            } else if (result.id) {
              dialogData.id = result.id;                  
              this.data.customerInfo.primaryContactInfo.addresses
                .push(ContactAddressDto.fromJS(dialogData));
            }
            
          });
      }                                                                                                                                                            
    });
  }

  deleteAddress(address, event, index){
    console.log(this.data.customerInfo.primaryContactInfo.id, address.id);
    this._addressService.deleteContactAddress(
      this.data.customerInfo.primaryContactInfo.id, address.id).subscribe(result => {
        console.log(result);
        this.data.customerInfo.primaryContactInfo.addresses.splice(1, 1);
      });

    event.stopPropagation();
  }

  ngOnInit() {
    this.data = this._customerService['data'];
  }
}