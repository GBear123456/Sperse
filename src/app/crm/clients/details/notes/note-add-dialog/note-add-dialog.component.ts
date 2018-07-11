import { AppConsts } from '@shared/AppConsts';
import { Component, Injector, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CreateNoteInput, NotesServiceProxy, ContactPhoneDto,
    UserServiceProxy, CreateContactPhoneInput, ContactPhoneServiceProxy } from '@shared/service-proxies/service-proxies';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format.pipe';
import { EditContactDialog } from '../../edit-contact-dialog/edit-contact-dialog.component';
import * as _ from 'underscore';

@Component({
    selector: 'note-add-dialog',
    templateUrl: 'note-add-dialog.component.html',
    styleUrls: ['note-add-dialog.component.less'],
    providers: [NotesServiceProxy, PhoneFormatPipe]
})
export class NoteAddDialogComponent extends AppComponentBase implements OnInit, AfterViewInit {
    public dialogRef: MatDialogRef<NoteAddDialogComponent>;
    public data: any;

    private elementRef: ElementRef;
    private slider: any;
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

        this.data = injector.get(MAT_DIALOG_DATA);
        this.elementRef = injector.get(ElementRef);
        this.dialogRef = <any>injector.get(MatDialogRef);

        if (this.data.customerInfo.contactPersons.length) {
            let orgContact = this.data.customerInfo.organizationContactInfo,
                contacts = this.data.customerInfo.contactPersons;
            this.contacts = orgContact ? contacts.concat(orgContact) : contacts;
            this.onContactChanged({value: this.contacts[0].id});
        }

        _notesService.getNoteTypes().subscribe((result) => {
            if (result.length) {
                this.type = result[0].id;
                this.types = result;
            }
        });
    }

    ngOnInit() {
        this.dialogRef.disableClose = true;
        this.slider = this.elementRef.nativeElement.closest('.cdk-overlay-pane');
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
            this.dialogRef.updateSize('401px', '100vh');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: '157px',
                    right: '0px'
                });
            }, 100);
        });
    }

    close(closeData = null) {
        this.dialogRef.updatePosition({
            top: '157px',
            right: '-100vw'
        });
        setTimeout(() => {
            this.dialogRef.close(closeData);
        }, 300);
    }

    saveNote($event) {
        if (this.validator.validate().isValid)
            this._notesService.createNote(CreateNoteInput.fromJS({
                customerId: this.data.customerInfo.id,
                text: this.summary,
                contactId: this.contact,
                contactPhoneId: this.phone || undefined,
                typeId: this.type,
                followUpDateTime: this.followupDate || undefined,
                dateTime: this.currentDate || undefined,
                addedByUserId: parseInt(this.addedBy) || undefined
            })).subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.data.refreshParent();
                this.close();
            });
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
        }, error => {});
    }
}
