/** Core imports */
import { Component, Input } from '@angular/core';

/** Third party imports  */
import { NotifyService } from '@abp/notify/notify.service';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppConsts } from '@shared/AppConsts';
import {
    ContactInfoDto, ContactEmailServiceProxy, ContactEmailDto, ContactPhoneDto,
    ContactPhoneServiceProxy, CreateContactEmailInput, ContactInfoDetailsDto,
    UpdateContactEmailInput, CreateContactPhoneInput, UpdateContactPhoneInput,
    OrganizationContactServiceProxy
} from '@shared/service-proxies/service-proxies';
import { EditContactDialog } from '../edit-contact-dialog/edit-contact-dialog.component';
import { ContactsService } from '../contacts.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'contacts-area',
    templateUrl: './contacts-area.component.html',
    styleUrls: ['./contacts-area.component.less'],
    providers: [ DialogService ]
})
export class ContactsAreaComponent {
    @Input() isCompany = false;
    @Input() showContactType: string;
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

    private clickTimeout;
    private clickCounter = 0;
    private isInPlaceEditAllowed = true;
    private _contactInfo: ContactInfoDto;
    private itemInEditMode: any;

    emailRegEx = AppConsts.regexPatterns.email;

    constructor(
        private contactsService: ContactsService,
        private contactEmailService: ContactEmailServiceProxy,
        private contactPhoneService: ContactPhoneServiceProxy,
        private organizationContactService: OrganizationContactServiceProxy,
        private clipboardService: ClipboardService,
        private notifyService: NotifyService,
        private dialogService: DialogService,
        public dialog: MatDialog,
        public ls: AppLocalizationService
    ) {}

    getDialogPossition(event) {
        let shiftY = this.calculateShiftY(event);
        let parent = event.target.closest('ul');
        return this.dialogService.calculateDialogPosition(event, parent, 400, shiftY);
    }

    calculateShiftY(event) {
        let shift = 160;

        let availableSpaceY = window.innerHeight - event.clientY;
        if (availableSpaceY < shift + 20)
            shift += shift - availableSpaceY + 100;

        return shift;
    }

    getFieldName(field) {
        return capitalize(field.slice(0, 5));
    }

    showDialog(field, data, event, index) {
        if (!this.isCompany || this.contactInfoData && this.contactInfoData.contactId)
            this.showContactDialog(field, data, event, index);
        else
            this.contactsService.addCompanyDialog(
                event,
                this.contactInfo,
                Math.round(event.target.offsetWidth / 2)
            ).pipe(
                filter(Boolean)
            ).subscribe(
             () => this.showContactDialog(field, data, event, index)
            );
    }

    showContactDialog(field, data, event, index) {
        let dialogData = {
            field: field,
            id: data && data.id,
            value: data && data[field],
            name: this.getFieldName(field),
            groupId: this.contactInfo.groupId,
            contactId: data && data.contactId
                || this.contactInfoData && this.contactInfoData.contactId,
            emailAddress: data && data.emailAddress,
            phoneNumber: data && data.phoneNumber,
            phoneExtension: data && data.phoneExtension,
            usageTypeId: data && data.usageTypeId,
            isConfirmed: Boolean(data && data.isConfirmed),
            isActive: Boolean(data ? data.isActive : true),
            comment: data && data.comment,
            isCompany: this.isCompany,
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
            scrollTo(0, 0);
            if (result && dialogData.contactId) {
                this.updateDataField(field, data, dialogData);
            }
        });
        event.stopPropagation();
    }

    updateDataField(field, dataItem, updatedData) {
        let name = this.getFieldName(field),
            isPhoneDialog = (name == 'Phone');
        this['contact' + name + 'Service']
            [(dataItem ? 'update' : 'create') + 'Contact' + name](
            (isPhoneDialog ? (dataItem ? UpdateContactPhoneInput : CreateContactPhoneInput) : (dataItem ? UpdateContactEmailInput : CreateContactEmailInput)
            ).fromJS(updatedData)
        ).subscribe(
            result => {
                if (!result && dataItem) {
                    dataItem[field] = updatedData[field];
                    dataItem.comment = updatedData.comment;
                    dataItem.usageTypeId = updatedData.usageTypeId;
                    dataItem.isConfirmed = updatedData.isConfirmed;
                    dataItem.isActive = updatedData.isActive;
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
                this.contactsService.verificationUpdate();
                this.contactsService.invalidateUserData();
            },
            () => {
                dataItem[field] = dataItem.original;
            }
        );
    }

    inPlaceEdit(field, item, event, index) {
        this.clickCounter++;
        clearTimeout(this.clickTimeout);
        this.clickTimeout = setTimeout(() => {
            if (this.isEditAllowed && this.clickCounter > 1) {
                if (!this.isInPlaceEditAllowed)
                    return;

                item.inplaceEdit = true;
                item.original = item[field];

                if (this.itemInEditMode && this.itemInEditMode != item)
                    this.itemInEditMode.inplaceEdit = false;

                this.itemInEditMode = item;
            } else
                this.showDialog(field, item, event, index);
            this.clickCounter = 0;
        }, 250);
    }

    closeInPlaceEdit(field, item) {
        item.inplaceEdit = false;
        item[field] = item.original;
        this.isInPlaceEditAllowed = true;
    }

    itemValueChanged(field, item) {
        this.isInPlaceEditAllowed = item[field] == item.original;
    }

    updatePhoneNumber(isValid, item, event) {
        if (isValid)
            this.updateItem('phoneNumber', item, event);
    }

    updateItem(field, item, event) {
        if (event.validationGroup.validate().isValid) {
            if (item[field] != item.original)
                this.updateDataField(field, item, item);
            item.inplaceEdit = false;
            this.isInPlaceEditAllowed = true;
        }
    }

    deleteEmailAddress(email, event, index) {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: this.ls.l('DeleteContactHeader', AppConsts.localization.CRMLocalizationSourceName, this.ls.l('Email')),
                message: this.ls.l('DeleteContactMessage', AppConsts.localization.CRMLocalizationSourceName, this.ls.l('Email').toLowerCase())
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.dialog.closeAll();
                this.contactEmailService.deleteContactEmail(
                    this.contactInfoData.contactId, email.id).subscribe(result => {
                    if (!result) {
                        this.contactInfoData.emails.splice(index, 1);
                        this.contactsService.verificationUpdate();
                    }
                });
            }
        });
        event.stopPropagation();
    }

    deletePhoneNumber(phone, event, index) {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: this.ls.l('DeleteContactHeader', AppConsts.localization.CRMLocalizationSourceName, this.ls.l('Phone')),
                message: this.ls.l('DeleteContactMessage', AppConsts.localization.CRMLocalizationSourceName, this.ls.l('Phone').toLowerCase())
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.dialog.closeAll();
                this.contactPhoneService.deleteContactPhone(
                    this.contactInfoData.contactId, phone.id).subscribe(result => {
                    if (!result) {
                        this.contactInfoData.phones.splice(index, 1);
                        this.contactsService.verificationUpdate();
                    }
                });
            }
        });
        event.stopPropagation();
    }

    copyToClipbord(value) {
        this.clipboardService.copyFromContent(value);
        this.notifyService.info(this.ls.l('SavedToClipboard'));
    }
}
