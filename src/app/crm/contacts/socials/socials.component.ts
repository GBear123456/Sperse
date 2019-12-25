/** Core imports */
import { Component, Input } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import * as _ from 'underscore';
import { filter } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import {
    ContactInfoDto, ContactInfoDetailsDto, ContactLinkServiceProxy,
    ContactLinkDto, CreateContactLinkInput, UpdateContactLinkInput,
    OrganizationContactServiceProxy
} from '@shared/service-proxies/service-proxies';
import { EditContactDialog } from '../edit-contact-dialog/edit-contact-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { RootStore } from '@root/store';
import { ContactLinkTypesStoreActions, ContactLinkTypesStoreSelectors } from '@app/store';
import { ContactsService } from '../contacts.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'socials',
    templateUrl: './socials.component.html',
    styleUrls: ['./socials.component.less'],
    providers: [ DialogService ]
})
export class SocialsComponent {
    @Input() isCompany;
    @Input()
    set contactInfo(val: ContactInfoDto) {
        if (this._contactInfo = val)
            this.isEditAllowed = this.contactsService.checkCGPermission(this.contactInfo.groupId);
    }
    get contactInfo(): ContactInfoDto {
        return this._contactInfo;
    }

    @Input() contactInfoData: ContactInfoDetailsDto;

    isEditAllowed = false;
    private _contactInfo: ContactInfoDto;

    LINK_TYPES = {};

    constructor(
        private store$: Store<RootStore.State>,
        private contactsService: ContactsService,
        private contactLinkService: ContactLinkServiceProxy,
        private organizationContactService: OrganizationContactServiceProxy,
        private dialogService: DialogService,
        public dialog: MatDialog,
        public ls: AppLocalizationService
    ) {
        this.linkTypesLoad();
    }

    linkTypesLoad() {
        this.store$.dispatch(new ContactLinkTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(ContactLinkTypesStoreSelectors.getContactLinkTypes),
            filter(types => !!types)
        ).subscribe(types => {
            types.forEach((entity) => {
                this.LINK_TYPES[entity.id] = entity.name.replace(/ /g, '');
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

    showEditDialog(data, event) {
        if (!this.isCompany || this.contactInfoData && this.contactInfoData.contactId)
            this.showSocialDialog(data, event);
        else
            this.contactsService.addCompanyDialog(event, this.contactInfo,
                Math.round(event.target.offsetWidth / 2)
            ).subscribe(result => {
                if (result) {
                    this.showSocialDialog(data, event);
                }
            });
    }

    showSocialDialog(data, event) {
        let dialogData = {
            field: 'url',
            id: data && data.id,
            value: data && data.url,
            name: this.ls.l('Link'),
            groupId: this.contactInfo.groupId,
            contactId: data && data.contactId
            || this.contactInfoData && this.contactInfoData.contactId,
            url: data && data.url,
            usageTypeId: data && data.linkTypeId ? data.linkTypeId : AppConsts.otherLinkTypeId,
            isConfirmed: Boolean(data && data.isConfirmed),
            isActive: Boolean(data ? data.isActive : true),
            comment: data && data.comment,
            deleteItem: () => {
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
            if (result && dialogData.contactId) {
                this.updateDataField(data, dialogData);
            }
        });
        event.stopPropagation();
    }

    updateDataField(data, dialogData) {
        if (dialogData.usageTypeId != AppConsts.otherLinkTypeId)
            dialogData['linkTypeId'] = dialogData.usageTypeId;

        this.contactLinkService
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
        this.dialog.closeAll();
        this.contactLinkService.deleteContactLink(
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

    normalizeLink(link) {
        return ((/http[s]{0,1}:\/\//g).test(link) ? link : 'http://' + link);
    }
}
