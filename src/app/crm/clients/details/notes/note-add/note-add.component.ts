/** Core imports */
import { Component, EventEmitter, Input, Injector, ViewChild, Output } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { DxDateBoxComponent } from 'devextreme-angular';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CreateNoteInput, NotesServiceProxy, ContactPhoneDto,
UserServiceProxy, CreateContactPhoneInput, ContactPhoneServiceProxy, CustomerInfoDto } from '@shared/service-proxies/service-proxies';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { EditContactDialog } from '../../edit-contact-dialog/edit-contact-dialog.component';

@Component({
    selector: 'note-add',
    templateUrl: './note-add.component.html',
    styleUrls: ['./note-add.component.less'],
    providers: [ NotesServiceProxy, PhoneFormatPipe ]
})
export class NoteAddComponent extends AppComponentBase  {
    @ViewChild('followUpDateBox') followUpDateBox: DxDateBoxComponent;
    @ViewChild('currentDateBox') currentDateBox: DxDateBoxComponent;
    @Input()
    set customerInfo(customerInfo: any) {
        if (customerInfo.contactPersons) {
            this._customerInfo = customerInfo;
            let orgContact = <any>customerInfo.organizationContactInfo,
                contacts = customerInfo.contactPersons;
            this.contacts = orgContact ? contacts.concat(orgContact) : contacts;
            this.onContactChanged({value: this.contacts[0].id});
        }
    }

    @Output() onAdded: EventEmitter<any> = new EventEmitter();
    private _customerInfo: CustomerInfoDto;
    private validator: any;

    masks = AppConsts.masks;

    showOrigin = false;
    searchTimeout: any;

    summary: string;
    currentDate: any;
    followupDate: any;
    phone: string;
    contact: string;
    addedBy: string;
    type: string;

    types = [];
    users = [];
    contacts = [];
    phones = [];

    constructor(
        injector: Injector,
        private _dialog: MatDialog,
        private _phoneFormatPipe: PhoneFormatPipe,
        private _notesService: NotesServiceProxy,
        private _userService: UserServiceProxy,
        private _contactPhoneService: ContactPhoneServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        _notesService.getNoteTypes().subscribe((result) => {
            if (result.length) {
                this.type = result[0].id;
                this.types = result;
            }
        });
    }

    saveNote() {
        if (this.validator.validate().isValid)
            this._notesService.createNote(CreateNoteInput.fromJS({
                customerId: this._customerInfo.id,
                text: this.summary,
                contactId: this.contact,
                contactPhoneId: this.phone || undefined,
                typeId: this.type,
                followUpDateTime: this.followupDate || undefined,
                dateTime: this.currentDate || undefined,
                addedByUserId: parseInt(this.addedBy) || undefined
            })).subscribe(() => {
                /** Clear the form data */
                this.resetFields();
                this.validator.reset();
                this.onAdded.emit();
            });
    }

    resetFields() {
        this.summary = null;
        this.followUpDateBox.instance.reset();
        this.currentDateBox.instance.reset();
    }

    onUserSearch($event) {
        $event.customItem = {id: $event.text, fullName: $event.text};
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if ($event.text)
                this._userService.getUsers(false, $event.text, 'Pages.CRM', undefined, undefined, 10, 0).subscribe((result) => {
                    this.users = result.items.map((user) => {
                        return {
                            id: user.id,
                            fullName: user.name + ' ' + user.surname
                        };
                    });
                });
        }, 500);
    }

    getContactById(id) {
        return _.findWhere(this.contacts, {id: id});
    }

    onContactChanged($event) {
        let contact = this.getContactById($event.value);
        this.phones = contact.details.phones.map((phone) => {
            return {
                id: phone.id,
                phoneNumber: this._phoneFormatPipe.transform(phone.phoneNumber, undefined)
            };
        });
        this.phone = this.phones.length && this.phones[0].id;
        this.contact = contact.id;
    }

    initValidationGroup($event) {
        this.validator = $event.component;
    }

    showAddPhoneDialog(event) {
        let dialogData = {
            contactId: this.contact,
            field: 'phoneNumber',
            name: 'Phone',
            isConfirmed: false,
            isActive: false
        }, shift = '50px';
        this._dialog.open(EditContactDialog, {
            data: dialogData,
            hasBackdrop: true,
            position: {
                right: shift,
                bottom: shift
            }
        }).afterClosed().subscribe(result => {
            if (result)
                this.addNewPhone(dialogData);
        });
        event.stopPropagation();
    }

    addNewPhone(data) {
        this._contactPhoneService.createContactPhone(
            CreateContactPhoneInput.fromJS(data)
        ).subscribe(result => {
            if (result.id) {
                data.id = result.id;
                let contact = this.getContactById(this.contact);
                if (contact) {
                    contact.details.phones.unshift(ContactPhoneDto.fromJS(data));
                    this.onContactChanged({value: this.contact});
                }
            }
        });
    }
}
