/** Core imports */
import { Component, Injector, Input } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';

/** Application imports */
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactGroupInfoDto, ContactInfoDetailsDto, ContactLinkServiceProxy,
    ContactLinkDto, CreateContactLinkInput, UpdateContactLinkInput,
    OrganizationContactServiceProxy, CreateOrganizationInput, OrganizationContactInfoDto, OrganizationInfoDto
} from '@shared/service-proxies/service-proxies';
import { filter } from 'rxjs/operators';
import { EditContactDialog } from '../edit-contact-dialog/edit-contact-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { Store, select } from '@ngrx/store';
import { RootStore } from '@root/store';
import {
    ContactLinkTypesStoreActions,
    ContactLinkTypesStoreSelectors
} from '@app/store';


import * as _ from 'underscore';

@Component({
    selector: 'socials',
    templateUrl: './socials.component.html',
    styleUrls: ['./socials.component.less'],
    providers: [ DialogService ]
})
export class SocialsComponent extends AppComponentBase {
    @Input() isCompany;
    @Input() contactInfoData: ContactInfoDetailsDto;
    @Input() set contactInfo(value: ContactGroupInfoDto) {
        if (this._contactInfo = value)
            this.contactInfoData = this.isCompany ? 
                value.organizationContactInfo && value.organizationContactInfo.details: 
                value.primaryContactInfo && value.primaryContactInfo.details;

    }
    get contactInfo(): ContactGroupInfoDto {
        return this._contactInfo;
    }

    isEditAllowed = false;

    LINK_TYPES = {};

    private _contactInfo: ContactGroupInfoDto;

    constructor(injector: Injector,
                public dialog: MatDialog,
                private store$: Store<RootStore.State>,
                private _contactLinkService: ContactLinkServiceProxy,
                private _organizationContactService: OrganizationContactServiceProxy,
                private dialogService: DialogService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.isEditAllowed = this.isGranted('Pages.CRM.Customers.Manage');
        this.linkTypesLoad();
    }

    linkTypesLoad() {
        this.store$.dispatch(new ContactLinkTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(ContactLinkTypesStoreSelectors.getContactLinkTypes),
            filter(types => !!types)
        ).subscribe(types => {
            types.forEach((entity) => {
                this.LINK_TYPES[entity.id] = entity.name.replace(/ /g,'');
            });
        });
    }

    getDialogPosition(event) {
        let shiftY = this.calculateShiftY(event);
        let parent = event.target.closest('li');
        return this.dialogService.calculateDialogPosition(event, parent, 400, shiftY);
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
            isActive: Boolean(data ? data.isActive: true),
            comment: data && data.comment,
            deleteItem: (event) => {
                this.deleteLink(data.id);
            }
        };
        this.dialog.closeAll();
        this.dialog.open(EditContactDialog, {
            data: dialogData,
            hasBackdrop: false,
            position: this.getDialogPosition(event)
        }).afterClosed().subscribe(result => {
            scrollTo(0, 0);
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
            contactGroupId: this._contactInfo.id,
            companyName: companyName
        })).subscribe(response => {
            this.initializeOrganizationInfo(companyName, response.id);
            dialogData.contactId = response.id;
            this.updateDataField(data, dialogData);
        });
    }

    initializeOrganizationInfo(companyName, contactId) {
        this._contactInfo.organizationContactInfo = OrganizationContactInfoDto.fromJS({
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

    updateLink(link, newValue) {
        this.updateDataField(link, _.extend(_.clone(link), {url: newValue}));
    }

    deleteLink(id) {
        this._contactLinkService.deleteContactLink(
            this.contactInfoData.contactId, id).subscribe(result => {
            if (!result) {
                this.contactInfoData.links.every((item, index) => {
                    if (item.id == id) {
                        this.contactInfoData.links.splice(index, 1);
                        return false;
                    }
                    return true;
                });
            }
        });
    }

    getLinkInplaceEditData(link) {
        let linkLocalization = this.l('Link');
        return {
            id: link.id,
            value: link.url,
            link: this.normalizeLink(link.url),
            validationRules: [
                {type: 'required', message: this.l('LinkIsRequired')}
            ],
            isDeleteEnabled: true,
            isEditDialogEnabled: true,
            lEntityName: linkLocalization,
            lEditPlaceholder: linkLocalization,
            lDeleteConfirmTitle: this.l('DeleteContactHeader', linkLocalization),
            lDeleteConfirmMessage: this.l('DeleteContactMessage', linkLocalization.toLowerCase())
        };
    }

    normalizeLink(link) {
        return ((/http[s]{0,1}:\/\//g).test(link) ? link: 'http://' + link);
    }
}
