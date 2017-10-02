import { AppConsts } from '@shared/AppConsts';
import { Component, OnInit, Injector } from '@angular/core';
import { MdDialog } from '@angular/material';
import { ConfirmDialog } from '@shared/common/dialogs/confirm/confirm-dialog.component';
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
    super(injector, AppConsts.localization.CRMLocalizationSourceName);
  }

  getDialogPossition(event) {
    let shift = 160, parent = 
      event.target.closest("ul");        

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

  showEditDialog(field, data, event, index) {
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
      isConfirmed: Boolean(data && data.isConfirmed),
      isActive: Boolean(data && data.isActive),
      comment: data && data.comment,
      deleteItem: (event) => {
        if (data.emailAddress)
          this.deleteEmailAddress(data, event, index);
        else
          this.deletePhoneNumber(data, event, index);
      } 
    };
    this.dialog.closeAll();
    this.dialog.open(EditContactDialog, {
      data: dialogData,
      hasBackdrop: false,
      position: this.getDialogPossition(event)
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
    event.stopPropagation();
  }

  inPlaceEdit(field, data, event, index) {  
//    event.target.setAttribute('contenteditable', true);
  }

  deleteEmailAddress(email, event, index) {
   this.dialog.open(ConfirmDialog, {
      data: {
        title: this.l('DeleteContactHeader', this.l('Email')),
        message: this.l('DeleteContactMessage', this.l('Email').toLowerCase())
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.dialog.closeAll();
        this._contactEmailService.deleteContactEmail(
          this.data.customerInfo.primaryContactInfo.id, email.id).subscribe(result => {
            if (!result)
              this.data.customerInfo.primaryContactInfo.emails.splice(index, 1);
          });
      }
    });
    event.stopPropagation();
  }

  deletePhoneNumber(phone, event, index) {
   this.dialog.open(ConfirmDialog, {
      data: {
        title: this.l('DeleteContactHeader', this.l('Phone')),
        message: this.l('DeleteContactMessage', this.l('Phone').toLowerCase())
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.dialog.closeAll();
        this._contactPhoneService.deleteContactPhone(
          this.data.customerInfo.primaryContactInfo.id, phone.id).subscribe(result => {
            if (!result)
              this.data.customerInfo.primaryContactInfo.phones.splice(index, 1);
          });
      }
    });
    event.stopPropagation();
  }

  ngOnInit() {
    this.data = this._customerService['data'];
  }
}