/** Core imports */
import { OnInit, AfterViewInit, Component, Inject, Injector, ViewChild, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DxDateBoxComponent } from 'devextreme-angular';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CreateNoteInput, NotesServiceProxy, ContactPhoneDto,
UserServiceProxy, CreateContactPhoneInput, ContactPhoneServiceProxy, ContactInfoDto } from '@shared/service-proxies/service-proxies';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { EditContactDialog } from '../../edit-contact-dialog/edit-contact-dialog.component';

@Component({
    templateUrl: './note-add-dialog.component.html',
    styleUrls: ['./note-add-dialog.component.less'],
    providers: [ PhoneFormatPipe ]
})
export class NoteAddDialogComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @ViewChild('followUpDateBox') followUpDateBox: DxDateBoxComponent;
    @ViewChild('currentDateBox') currentDateBox: DxDateBoxComponent;

    private slider: any;
    private _contactInfo: ContactInfoDto;
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
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _dialog: MatDialog,
        private elementRef: ElementRef,
        public dialogRef: MatDialogRef<NoteAddDialogComponent>,
        private _phoneFormatPipe: PhoneFormatPipe,
        private _notesService: NotesServiceProxy,
        private _userService: UserServiceProxy,
        private _contactPhoneService: ContactPhoneServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        if (_notesService['types'])
            this.initTypes(_notesService['types']);
        else
            _notesService.getNoteTypes().subscribe((result) => {
                this.initTypes(_notesService['types'] = result);
            });

        if (this.data.contactInfo.contactPersons) {
            this._contactInfo = this.data.contactInfo;
            let orgContact = <any>this._contactInfo.primaryOrganizationContactInfo,
                contacts = this._contactInfo.contactPersons.length ? this._contactInfo.contactPersons : [this._contactInfo.personContactInfo];
            this.contacts = orgContact ? contacts.concat(orgContact) : contacts;
            this.onContactChanged({value: this.contacts[0].id});
        }

        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '157px',
                right: '-100vw'
            });
        });
    }

    ngOnInit() {
        this.dialogRef.disableClose = true;
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '157px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize(undefined, '100vh');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: '157px',
                    right: '0px'
                });
            }, 100);
        });
    }

    initTypes(types) {
        if (types.length) {
            this.type = types[0].id;
            this.types = types;
        }
    }

    saveNote() {
        if (this.validator.validate().isValid)
            this._notesService.createNote(CreateNoteInput.fromJS({
                contactGroupId: this._contactInfo.id,
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
                this.notify.info(this.l('SavedSuccessfully'));
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
                this._userService.getUsers($event.text, 'Pages.CRM', undefined, false, undefined, 10, 0).subscribe((result) => {
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

    close() {
        this.dialogRef.close();
    }
}