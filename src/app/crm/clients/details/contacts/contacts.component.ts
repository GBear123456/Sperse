import { AppConsts } from '@shared/AppConsts';
import { Component, OnInit, Injector, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ConfirmDialogComponent } from '@shared/common/dialogs/confirm/confirm-dialog.component';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EditContactDialog } from '../edit-contact-dialog/edit-contact-dialog.component';
import { CustomersServiceProxy, ContactInfoBaseDto, ContactEmailServiceProxy, ContactEmailDto, ContactPhoneDto,
  ContactPhoneServiceProxy, CreateContactEmailInput,
  UpdateContactEmailInput, CreateContactPhoneInput, UpdateContactPhoneInput } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.less']
})
export class ContactsComponent extends AppComponentBase implements OnInit {
  @Input() contactInfoData: ContactInfoBaseDto;

  isEditAllowed = false;

  private _isInPlaceEditAllowed = true;
  private _itemInEditMode: any;

  constructor(
    injector: Injector,
    public dialog: MatDialog,
    private _customerService: CustomersServiceProxy,
    private _contactEmailService: ContactEmailServiceProxy,
    private _contactPhoneService: ContactPhoneServiceProxy
  ) {
    super(injector, AppConsts.localization.CRMLocalizationSourceName);
    this.isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');
  }

  getDialogPossition(event) {
    let shift = 160, parent =
      event.target.closest('ul');

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

  getFieldName(field) {
    return this.capitalize(field.slice(0, 5));
  }

  showDialog(field, data, event, index) {
    let dialogData = {
      field: field,
      id: data && data.id,
      value: data && data[field],
      name: this.getFieldName(field),
      contactId: data && data.contactId
        || this.contactInfoData.id,
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
      if (result)
        this.updateDataField(field, data, dialogData);
    });
    event.stopPropagation();
  }

  updateDataField(field, dataItem, updatedData) {
    let name = this.getFieldName(field),
      isPhoneDialog = (name == 'Phone');
    this['_contact' + name + 'Service']
      [(dataItem ? 'update': 'create') + 'Contact' + name](
        (isPhoneDialog ?
          (dataItem ? UpdateContactPhoneInput: CreateContactPhoneInput) :
          (dataItem ? UpdateContactEmailInput: CreateContactEmailInput)
        ).fromJS(updatedData)
      ).subscribe(result => {
        if (!result && dataItem) {
          dataItem[field] = updatedData[field];
          dataItem.comment = updatedData.comment;
          dataItem.usageTypeId = updatedData.usageTypeId;
          if (isPhoneDialog)
            dataItem.phoneExtension =
              updatedData['phoneExtension'];
        } else if (result.id) {
          updatedData.id = result.id;
          if (isPhoneDialog)
            this.contactInfoData.phones
              .push(ContactPhoneDto.fromJS(updatedData));
          else
            this.contactInfoData.emails
              .push(ContactEmailDto.fromJS(updatedData));
        }
      }, error => {
        dataItem[field] = dataItem.original;
      });
  }

  inPlaceEdit(field, item, event, index) {
    if (this.isEditAllowed) {

      if (!this._isInPlaceEditAllowed)
        return;

      item.inplaceEdit = true;
      item.original = item[field];

      if (this._itemInEditMode && this._itemInEditMode != item)
        this._itemInEditMode.inplaceEdit = false;

      this._itemInEditMode = item;
    } else
      this.showDialog(field, item, event, index);
  }

  closeInPlaceEdit(field, item) {
    item.inplaceEdit = false;
    item[field] = item.original;
    this._isInPlaceEditAllowed = true;
  }

  itemValueChanged(field, item) {
    this._isInPlaceEditAllowed = item[field] == item.original;
  }

  updateItem(field, item, event) {
    if(event.validationGroup.validate().isValid) {
      if (item[field] != item.original)
        this.updateDataField(field, item, item);
      item.inplaceEdit = false;
      this._isInPlaceEditAllowed = true;
    }
  }

  deleteEmailAddress(email, event, index) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.l('DeleteContactHeader', this.l('Email')),
        message: this.l('DeleteContactMessage', this.l('Email').toLowerCase())
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.dialog.closeAll();
        this._contactEmailService.deleteContactEmail(
          this.contactInfoData.id, email.id).subscribe(result => {
            if (!result)
              this.contactInfoData.emails.splice(index, 1);
          });
      }
    });
    event.stopPropagation();
  }

  deletePhoneNumber(phone, event, index) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.l('DeleteContactHeader', this.l('Phone')),
        message: this.l('DeleteContactMessage', this.l('Phone').toLowerCase())
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.dialog.closeAll();
        this._contactPhoneService.deleteContactPhone(
          this.contactInfoData.id, phone.id).subscribe(result => {
            if (!result)
              this.contactInfoData.phones.splice(index, 1);
          });
      }
    });
    event.stopPropagation();
  }

  ngOnInit() {
  }
}
