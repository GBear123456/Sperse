import { AppConsts } from '@shared/AppConsts';
import { ConfirmDialogComponent } from '@shared/common/dialogs/confirm/confirm-dialog.component';
import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    CustomersServiceProxy, ContactInfoDetailsDto, ContactLinkServiceProxy,
    ContactLinkDto, CreateContactLinkInput, UpdateContactLinkInput
} from '@shared/service-proxies/service-proxies';
import { EditContactDialog } from '../edit-contact-dialog/edit-contact-dialog.component';

import { MatDialog } from '@angular/material';

@Component({
    selector: 'socials',
    templateUrl: './socials.component.html',
    styleUrls: ['./socials.component.less']
})
export class SocialsComponent extends AppComponentBase implements OnInit {
    @Input() contactInfoData: ContactInfoDetailsDto;

    isEditAllowed = false;

    LINK_TYPES = {
        F: 'facebook',
        G: 'google-plus',
        L: 'linkedin',
        P: 'pinterest',
        T: 'twitter',
        J: 'website',
        A: 'alexa',
        B: 'bbb',
        C: 'crunchbase',
        D: 'domain',
        E: 'yelp',
        I: 'instagram',
        N: 'nav',
        O: 'opencorporates',
        R: 'trustpilot',
        S: 'glassdoor',
        W: 'followers',
        Y: 'youtube',
        Z: 'rss'
    };

    constructor(injector: Injector,
                public dialog: MatDialog,
                private _customerService: CustomersServiceProxy,
                private _contactLinkService: ContactLinkServiceProxy) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');
    }

    getDialogPossition(event) {
        let shiftY = this.calculateShiftY(event);
        let parent = event.target.closest('li');
        return this.calculateDialogPosition(event, parent, 0, shiftY);
    }

    calculateShiftY(event) {
        let shift = 160;

        let availableSpaceY = window.innerHeight - event.clientY;
        if (availableSpaceY < shift + 20)
          shift += shift - availableSpaceY + 50;

        return shift;
    }

    showEditDialog(data, event, index) {
        let dialogData = {
            field: 'url',
            id: data && data.id,
            value: data && data.url,
            name: this.l('Link'),
            contactId: data && data.contactId
            || this.contactInfoData.contactId,
            url: data && data.url,
            usageTypeId: data && data.linkTypeId ? data.linkTypeId : AppConsts.otherLinkTypeId,
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
                if (dialogData.usageTypeId != AppConsts.otherLinkTypeId)
                    dialogData['linkTypeId'] = dialogData.usageTypeId;

                this._contactLinkService
                    [(data ? 'update' : 'create') + 'ContactLink'](
                    (data ? UpdateContactLinkInput : CreateContactLinkInput).fromJS(dialogData)
                ).subscribe(result => {
                    if (!result && data) {
                        data.url = dialogData.url;
                        data.comment = dialogData.comment;
                        data.linkTypeId = dialogData.usageTypeId;
                        data.isSocialNetwork = dialogData['isSocialNetwork'];
                        data.isConfirmed = dialogData.isConfirmed;
                        data.isActive = dialogData.isActive;
                    } else if (result.id) {
                        dialogData.id = result.id;
                        this.contactInfoData.links
                            .push(ContactLinkDto.fromJS(dialogData));
                    }
                });
            }
        });
        event.stopPropagation();
    }

    deleteLink(link, event, index) {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: this.l('DeleteContactHeader', this.l('Link')),
                message: this.l('DeleteContactMessage', this.l('Link').toLowerCase())
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.dialog.closeAll();
                this._contactLinkService.deleteContactLink(
                    this.contactInfoData.contactId, link.id).subscribe(result => {
                    if (!result)
                        this.contactInfoData.links.splice(index, 1);
                });
            }
        });
        event.stopPropagation();
    }

    ngOnInit() {
    }
}
