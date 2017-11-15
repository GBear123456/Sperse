import { AppConsts } from '@shared/AppConsts';
import { ConfirmDialog } from '@shared/common/dialogs/confirm/confirm-dialog.component';
import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CustomersServiceProxy, CustomerInfoDto, ContactLinkServiceProxy,
  ContactLinkDto, CreateContactLinkInput, UpdateContactLinkInput } from '@shared/service-proxies/service-proxies';
import { EditContactDialog } from '../edit-contact-dialog/edit-contact-dialog.component';

import { MdDialog } from '@angular/material';

@Component({
  selector: 'socials',
  templateUrl: './socials.component.html',
  styleUrls: ['./socials.component.less']
})
export class SocialsComponent extends AppComponentBase implements OnInit {
  data: {
    customerInfo: CustomerInfoDto
  };

  isEditAllowed: boolean = false;

  LINK_TYPES = {
    F: 'facebook',
    G: 'google-plus',
    L: 'linkedin',
    P: 'pinterest',
    T: 'twitter'
  }

  constructor(
    injector: Injector,
    public dialog: MdDialog,
    private _customerService: CustomersServiceProxy,
    private _contactLinkService: ContactLinkServiceProxy
  ) {
    super(injector, AppConsts.localization.CRMLocalizationSourceName);

    this.isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');
  }

  getDialogPossition(event) {
    let shift = 160, parent =
      event.target.closest('li');

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

  showEditDialog(data, event, index) {
    let dialogData = {
      field: 'url',
      id: data && data.id,
      value: data && data.url,
      name: this.l('Link'),
      contactId: data && data.contactId
        || this.data.customerInfo
        .primaryContactInfo.id,
      url: data && data.url,
      usageTypeId: data && data.linkTypeId,
      isConfirmed: Boolean(data && data.isConfirmed),
      isActive: Boolean(data && data.isActive),
      comment: data && data.comment,
      deleteItem: (event) => {
        this.deleteLink(data, event, index);
      }
    };
    this.dialog.closeAll();
    this.dialog.open(EditContactDialog, {
      data: dialogData,
      hasBackdrop: false,
      position: this.getDialogPossition(event)
    }).afterClosed().subscribe(result => {
        if (result) {
          if (dialogData.usageTypeId != 'O')
            dialogData['linkTypeId'] = dialogData.usageTypeId;
          this._contactLinkService
            [(data ? 'update': 'create') + 'ContactLink'](
              (data ? UpdateContactLinkInput: CreateContactLinkInput).fromJS(dialogData)
            ).subscribe(result => {
              if (!result && data) {
                data.url = dialogData.url;
                data.comment = dialogData.comment;
                data.usageTypeId = dialogData.usageTypeId;
                data.isSocialNetwork = dialogData['isSocialNetwork'];
              } else if (result.id) {
                dialogData.id = result.id;
                this.data.customerInfo.primaryContactInfo.links
                  .push(ContactLinkDto.fromJS(dialogData));
              }
            });
        }
    });
    event.stopPropagation();
  }

  deleteLink(link, event, index) {
   this.dialog.open(ConfirmDialog, {
      data: {
        title: this.l('DeleteContactHeader', this.l('Link')),
        message: this.l('DeleteContactMessage', this.l('Link').toLowerCase())
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.dialog.closeAll();
        this._contactLinkService.deleteContactLink(
          this.data.customerInfo.primaryContactInfo.id, link.id).subscribe(result => {
            if (!result)
              this.data.customerInfo.primaryContactInfo.links.splice(index, 1);
          });
      }
    });
    event.stopPropagation();
  }

  ngOnInit() {
    this.data = this._customerService['data'];
  }
}
