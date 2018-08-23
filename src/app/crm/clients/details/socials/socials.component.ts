import { AppConsts } from '@shared/AppConsts';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    CustomerInfoDto, ContactInfoDetailsDto, ContactLinkServiceProxy,
    ContactLinkDto, CreateContactLinkInput, UpdateContactLinkInput,
    OrganizationContactServiceProxy, CreateOrganizationInput, OrganizationContactInfoDto, OrganizationInfoDto
} from '@shared/service-proxies/service-proxies';
import { EditContactDialog } from '../edit-contact-dialog/edit-contact-dialog.component';
import { MatDialog } from '@angular/material';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';

@Component({
    selector: 'socials',
    templateUrl: './socials.component.html',
    styleUrls: ['./socials.component.less'],
    providers: [ DialogService ]
})
export class SocialsComponent extends AppComponentBase implements OnInit {
    @Input() contactInfoData: ContactInfoDetailsDto;
    @Input() customerInfo: CustomerInfoDto;

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
                private _contactLinkService: ContactLinkServiceProxy,
                private _organizationContactService: OrganizationContactServiceProxy,
                private dialogService: DialogService) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');
    }

    getDialogPossition(event) {
        let shiftY = this.calculateShiftY(event);
        let parent = event.target.closest('li');
        return this.dialogService.calculateDialogPosition(event, parent, 0, shiftY);
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
            || this.contactInfoData && this.contactInfoData.contactId,
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
                if (dialogData.contactId) {
                    this.updateDataField(data, dialogData);
                } else {
                    this.createOrganization(data, dialogData);
                }
            }
        });
        event.stopPropagation();
    }

    createOrganization(data, dialogData) {
        let companyName = AppConsts.defaultCompanyName;
        this._organizationContactService.createOrganization(CreateOrganizationInput.fromJS({
            contactGroupId: this.customerInfo.id,
            companyName: companyName
        })).subscribe(response => {
            this.initializeOrganizationInfo(companyName, response.id);
            dialogData.contactId = response.id;
            this.updateDataField(data, dialogData);
        });
    }

    initializeOrganizationInfo(companyName, contactId) {
        this.customerInfo.organizationContactInfo = OrganizationContactInfoDto.fromJS({
            organization: OrganizationInfoDto.fromJS({
                companyName: companyName
            }),
            id: contactId,
            fullName: companyName,
            details: ContactInfoDetailsDto.fromJS({
                contactId: contactId,
                emails: [],
                phones: [],
                addresses: [],
                links: [],
            })
        });
    }

    updateDataField(data, dialogData) {
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
