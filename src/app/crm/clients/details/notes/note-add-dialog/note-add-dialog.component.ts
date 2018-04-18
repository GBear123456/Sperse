import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, OnInit, AfterViewInit, ElementRef, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CreateNoteInput, CustomerInfoDto, NotesServiceProxy, UserServiceProxy } from '@shared/service-proxies/service-proxies';
import { PhoneFormatPipe } from '../../phone-format.pipe';

import * as moment from 'moment';
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
        private _phoneFormatPipe: PhoneFormatPipe,
        private _notesService: NotesServiceProxy,
        private _userService: UserServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.data = injector.get(MAT_DIALOG_DATA);
        this.elementRef = injector.get(ElementRef);
        this.dialogRef = injector.get(MatDialogRef);

        if (this.data.customerInfo.contactPersons.length) {
            this.contacts = this.data.customerInfo.contactPersons;
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
                contactPhoneId: this.phone,
                typeId: this.type,
                followUpDateTime: this.followupDate,
                dateTime: this.currentDate,
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
                this._userService.getUsers($event.text, 'Pages.CRM', undefined, undefined, 10, 0).subscribe((result) => {
                    this.users = result.items.map((user) => {
                        return {
                            id: user.id,
                            fullName: user.name + ' ' + user.surname
                        };
                    });
                });
        }, 500);
    }

    onContactChanged($event) {
        let contact = _.findWhere(this.data.customerInfo.contactPersons, {id: $event.value});
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
}