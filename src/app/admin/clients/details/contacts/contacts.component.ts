import { Component, OnInit, Injector } from '@angular/core';
import { MdDialog } from '@angular/material';

import { AppComponentBase } from '@shared/common/app-component-base';
import { EditContactDialog } from '../edit-contact-dialog/edit-contact-dialog.component';
import { CustomersServiceProxy, ContactEmailServiceProxy, ContactEmailDto, ContactPhoneDto,
  ContactPhoneServiceProxy, CustomerInfoDto, CreateContactEmailInput, 
  UpdateContactEmailInput, CreateContactPhoneInput, UpdateContactPhoneInput } from '@shared/service-proxies/service-proxies';


@Component({
  selector: 'contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.less']
})
export class ContactsComponent extends AppComponentBase implements OnInit {
  data: {
    customerInfo: CustomerInfoDto
  };  
  
  constructor(
    injector: Injector,
    public dialog: MdDialog,
    private _customerService: CustomersServiceProxy,
    private _contactEmailService: ContactEmailServiceProxy, 
    private _contactPhoneService: ContactPhoneServiceProxy
  ) { 
    super(injector);
  }

  showEditDialog(field, data) {
    let dialogData = {
      field: field, 
      id: data && data.id,
      value: data && data[field],
      name: this.capitalize(field.slice(0, 5)),
      contactId: data && data.contactId 
        || this.data.customerInfo
        .primaryContactInfo.id,
      emailAddress: data && data.emailAddress,
      phoneNumber: data && data.phoneNumber,
      phoneExtension: data && data.phoneExtension,
      usageTypeId: data && data.usageTypeId,
      isConfirmed: data && data.isConfirmed,
      isActive: data && data.isActive,
      comment: data && data.comment
    };
    this.dialog.open(EditContactDialog, {
      data: dialogData
    }).afterClosed().subscribe(result => {
        if (result) {
          let isPhoneDialog = dialogData.name == 'Phone';
          this['_contact' + dialogData.name + 'Service']
            [(data ? 'update': 'create') + 'Contact' + dialogData.name](
              (isPhoneDialog ? 
                (data ? UpdateContactPhoneInput: CreateContactPhoneInput) :
                (data ? UpdateContactEmailInput: CreateContactEmailInput)
              ).fromJS(dialogData)
            ).subscribe(result => {
              if (!result && data) {
                data[field] = dialogData[field];
                data.comment = dialogData.comment;
                data.usageTypeId = dialogData.usageTypeId;
                if (isPhoneDialog)
                  data.phoneExtension = 
                    dialogData['phoneExtension'];
              } else if (result.id) {
                dialogData.id = result.id;    
                if (isPhoneDialog)
                  this.data.customerInfo.primaryContactInfo.phones
                    .push(ContactPhoneDto.fromJS(dialogData));
                else
                  this.data.customerInfo.primaryContactInfo.emails
                    .push(ContactEmailDto.fromJS(dialogData));
              }
            });           
        }
    });
  }

  deleteEmailAddress(email, event, index) {
    this._contactEmailService.deleteContactEmail(
      this.data.customerInfo.primaryContactInfo.id, email.id).subscribe(result => {
        console.log(result);
      });
  }

  deletePhoneNumber(phone, event, index) {
    this._contactPhoneService.deleteContactPhone(
      this.data.customerInfo.primaryContactInfo.id, phone.id).subscribe(result => {
        console.log(result);
      });
  }

  ngOnInit() {
    this.data = this._customerService['data'];
  }
}