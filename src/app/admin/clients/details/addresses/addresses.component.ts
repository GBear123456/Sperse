import { AppConsts } from '@shared/AppConsts';
import { Component, OnInit, Injector } from '@angular/core';
import { EditAddressDialog } from '../edit-address-dialog/edit-address-dialog.component';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConfirmDialog } from '@shared/common/dialogs/confirm/confirm-dialog.component';
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
    super(injector, AppConsts.localization.CRMLocalizationSourceName);
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

  editAddress(address, event, index) {
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
    event.stopPropagation();
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

  ngOnInit() {
    this.data = this._customerService['data'];
  }
}