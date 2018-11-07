/** Core imports */
import { Component, OnInit, Injector, Input } from '@angular/core';

/** Third party imports  */
import { MatDialog } from '@angular/material';

/** Application imports */
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactGroupInfoDto, ContactEmailServiceProxy, ContactEmailDto, ContactPhoneDto,
    ContactPhoneServiceProxy, CreateContactEmailInput, ContactInfoDetailsDto,
    UpdateContactEmailInput, CreateContactPhoneInput, UpdateContactPhoneInput,
    OrganizationContactServiceProxy, CreateOrganizationInput, OrganizationContactInfoDto, OrganizationInfoDto
} from '@shared/service-proxies/service-proxies';
import { EditContactDialog } from '../edit-contact-dialog/edit-contact-dialog.component';
import { ContactsService } from '../contacts.service';

@Component({
    selector: 'contacts-area',
    templateUrl: './contacts-area.component.html',
    styleUrls: ['./contacts-area.component.less'],
    providers: [ DialogService ]
})
export class ContactsAreaComponent extends AppComponentBase implements OnInit {
    @Input() isCompany = false;
    @Input() set contactInfo(value: ContactGroupInfoDto) {
        if (this._contactInfo = value)
            this.contactInfoData = this.isCompany ? 
                value.organizationContactInfo && value.organizationContactInfo.details: 
                value.primaryContactInfo && value.primaryContactInfo.details;
    }
    get contactInfo(): ContactGroupInfoDto {
        return this._contactInfo;
    }
    @Input() showContactType: string;
    @Input() contactInfoData: ContactInfoDetailsDto;

    isEditAllowed = false;

    private masks = AppConsts.masks;   
    private _clickTimeout;
    private _clickCounter = 0;
    private _isInPlaceEditAllowed = true;
    private _itemInEditMode: any;
    private _contactInfo: ContactGroupInfoDto;

    constructor(injector: Injector,
                public dialog: MatDialog,
                private _contactsService: ContactsService,
                private _contactEmailService: ContactEmailServiceProxy,
                private _contactPhoneService: ContactPhoneServiceProxy,
                private _organizationContactService: OrganizationContactServiceProxy,
                private dialogService: DialogService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.isEditAllowed = this.isGranted('Pages.CRM.Customers.Manage');
    }

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
        return this.capitalize(field.slice(0, 5));
    }

    showDialog(field, data, event, index) {
        let dialogData = {
            field: field,
            id: data && data.id,
            value: data && data[field],
            name: this.getFieldName(field),
            contactId: data && data.contactId
                || this.contactInfoData && this.contactInfoData.contactId,
            emailAddress: data && data.emailAddress,
            phoneNumber: data && data.phoneNumber,
            phoneExtension: data && data.phoneExtension,
            usageTypeId: data && data.usageTypeId,
            isConfirmed: Boolean(data && data.isConfirmed),
            isActive: Boolean(data ? data.isActive: true),
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
            if (result) {
                if (dialogData.contactId) {
                    this.updateDataField(field, data, dialogData);
                } else {
                    this.createOrganization(field, data, dialogData);
                }
            }
        });
        event.stopPropagation();
    }

    createOrganization(field, data, dialogData) {
        let companyName = AppConsts.defaultCompanyName;
        this._organizationContactService.createOrganization(CreateOrganizationInput.fromJS({
            contactGroupId: this._contactInfo.id,
            companyName: companyName
        })).subscribe(response => {
            this.initializeOrganizationInfo(companyName, response.id);
            dialogData.contactId = response.id;
            this.updateDataField(field, data, dialogData);
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

    updateDataField(field, dataItem, updatedData) {
        let name = this.getFieldName(field),
            isPhoneDialog = (name == 'Phone');
        this['_contact' + name + 'Service']
            [(dataItem ? 'update' : 'create') + 'Contact' + name](
            (isPhoneDialog ? (dataItem ? UpdateContactPhoneInput : CreateContactPhoneInput) : (dataItem ? UpdateContactEmailInput : CreateContactEmailInput)
            ).fromJS(updatedData)
        ).subscribe(result => {
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
            this._contactsService.verificationUpdate();
        }, error => {
            dataItem[field] = dataItem.original;
        });
    }
    
    inPlaceEdit(field, item, event, index) {
        this._clickCounter++;
        clearTimeout(this._clickTimeout);
        this._clickTimeout = setTimeout(() => {
            if (this.isEditAllowed && this._clickCounter > 1) {
                if (!this._isInPlaceEditAllowed)
                    return;

                item.inplaceEdit = true;
                item.original = item[field];

                if (this._itemInEditMode && this._itemInEditMode != item)
                    this._itemInEditMode.inplaceEdit = false;

                this._itemInEditMode = item;
            } else
                this.showDialog(field, item, event, index);
            this._clickCounter = 0;
        }, 250);
    }

    closeInPlaceEdit(field, item) {
        item.inplaceEdit = false;
        item[field] = item.original;
        this._isInPlaceEditAllowed = true;
    }

    itemValueChanged(field, item) {
        this._isInPlaceEditAllowed = item[field] == item.original;
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
                    this.contactInfoData.contactId, email.id).subscribe(result => {
                    if (!result) {
                        this.contactInfoData.emails.splice(index, 1);
                        this._contactsService.verificationUpdate();
                    }
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
                    this.contactInfoData.contactId, phone.id).subscribe(result => {
                    if (!result) {
                        this.contactInfoData.phones.splice(index, 1);
                        this._contactsService.verificationUpdate();
                    }
                });
            }
        });
        event.stopPropagation();
    }

    ngOnInit() {
    }
}
