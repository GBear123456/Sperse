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
    super(injector);
  }

  showEditDialog(data) {
    let dialogData = {
      field: 'url', 
      id: data && data.id,
      value: data && data.url,
      name: 'link',
      contactId: data && data.contactId 
        || this.data.customerInfo
        .primaryContactInfo.id,
      url: data && data.url,
      usageTypeId: data && data.usageTypeId,
      isConfirmed: data && data.isConfirmed,
      isActive: data && data.isActive,
      comment: data && data.comment
    };
    this.dialog.open(EditContactDialog, {
      data: dialogData
    }).afterClosed().subscribe(result => {
        if (result) {
          this._contactLinkService
            [(data ? 'update': 'create') + 'ContactLink'](
              (data ? UpdateContactLinkInput: CreateContactLinkInput).fromJS(dialogData)
            ).subscribe(result => {
              if (!result && data) {
                data.url = dialogData.url;
                data.comment = dialogData.comment;
                data.usageTypeId = dialogData.usageTypeId;
              } else if (result.id) {
                dialogData.id = result.id;    
                this.data.customerInfo.primaryContactInfo.links
                  .push(ContactLinkDto.fromJS(dialogData));
              }
            });           
        }
    });
  }

  deleteLink(link, event, index) {
    this._contactLinkService.deleteContactLink(
      this.data.customerInfo.primaryContactInfo.id, link.id).subscribe(result => {
        console.log(result);
      });
  }


  ngOnInit() {
    this.data = this._customerService['data'];
  }

}
