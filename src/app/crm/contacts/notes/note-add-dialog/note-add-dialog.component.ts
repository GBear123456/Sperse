/** Core imports */
import { Output, EventEmitter, OnInit, AfterViewInit,
    Component, Inject, Injector, ViewChild, ElementRef } from '@angular/core';
import { Location } from '@angular/common';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import { Store, select } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { filter, map, mergeAll, switchMap, toArray } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    CreateNoteInput,
    UpdateNoteInput,
    NotesServiceProxy,
    ContactPhoneDto,
    UserServiceProxy,
    CreateContactPhoneInput,
    ContactPhoneServiceProxy,
    ContactInfoDto,
    PersonOrgRelationShortInfo,
    PersonShortInfoDto,
    OrganizationShortInfo,
    NoteType,
    ContactPhoneInfo,
    PropertyServiceProxy,
    PropertyDto,
    CreateContactPhoneOutput,
    UserInfoDto
} from '@shared/service-proxies/service-proxies';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { EditContactDialog } from '../../edit-contact-dialog/edit-contact-dialog.component';
import { AppStore, ContactAssignedUsersStoreSelectors } from '@app/store';
import { AppPermissions } from '@shared/AppPermissions';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { InvoiceDto } from '@app/crm/contacts/notes/note-add-dialog/invoice-dto.type';
import { InvoiceFields } from '@app/crm/contacts/notes/note-add-dialog/invoice-fields.enum';
import { DateHelper } from '@shared/helpers/DateHelper';
import { NoteAddDialogData } from '@app/crm/contacts/notes/note-add-dialog/note-add-dialog-data.interface';

class PhoneNumber {
    id: any;
    phoneNumber: any;
}

type Contact = OrganizationShortInfo | PersonShortInfoDto | PropertyDto;

@Component({
    templateUrl: './note-add-dialog.component.html',
    styleUrls: ['./note-add-dialog.component.less'],
    providers: [ PhoneFormatPipe ]
})
export class NoteAddDialogComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @ViewChild('followUpDateBox', { static: false }) followUpDateBox: DxDateBoxComponent;
    @ViewChild('currentDateBox', { static: false }) currentDateBox: DxDateBoxComponent;
    @Output() onSaved: EventEmitter<any> = new EventEmitter<any>();

    private slider: any;
    private _contactInfo: ContactInfoDto;
    private validator: any;
    today = new Date();
    masks = AppConsts.masks;

    showOrigin = false;
    searchTimeout: any;

    orderId: number;
    summary: string;
    currentDate: any;
    followupDate: any;
    phone: number;
    contactId: number;
    addedBy: number;
    defaultType: string;
    type: string;
    enableSaveButton = !this.data.note
        || this.data.note.addedByUserId == this.appSession.userId
        || this.permission.isGranted(AppPermissions.CRMManageOtherUsersNote);

    types = [];
    users$: Observable<UserInfoDto[]> = this.data.contactsService.contactInfo$.pipe(
        filter(Boolean),
        switchMap((contactInfo: ContactInfoDto) => {
            return this.store$.pipe(
                select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, {contactGroup: this.data.contactsService.contactGroupId.value })
            );
        })
    );
    contacts: Contact[] = [];
    phones: PhoneNumber[];
    ordersDataSource: any;
    invoicesFields: KeysEnum<InvoiceDto> = InvoiceFields;
    noteId: number;
    isCRMOrdersGranted = this.permission.isGranted(AppPermissions.CRMOrdersInvoices);
    showAdditionalFields = true;
    private typePrefix: string;

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private location: Location,
        private elementRef: ElementRef,
        private phoneFormatPipe: PhoneFormatPipe,
        private notesService: NotesServiceProxy,
        private userService: UserServiceProxy,
        private contactPhoneService: ContactPhoneServiceProxy,
        private store$: Store<AppStore.State>,
        private propertyServiceProxy: PropertyServiceProxy,
        public dialogRef: MatDialogRef<NoteAddDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: NoteAddDialogData
    ) {
        super(injector);
        this.initTypes();
        this._contactInfo = this.data.contactInfo;
        this.ordersDataSource = new DataSource({
            sort: [{ selector: 'Date', desc: true }],
            select: Object.keys(this.invoicesFields),
            requireTotalCount: false,
            store: new ODataStore({
                key: this.invoicesFields.Key,
                url: this.getODataUrl('OrderInvoices'),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                deserializeDates: false
            })
        });
        this.getContacts().subscribe((contacts: Contact[]) => {
            this.contacts = contacts;
            this.contactId = !this.location.path().includes('contact-information')
                && this.data.propertyId || this.data.contactInfo.id;
            this.onContactChanged({ value: this.contactId });
            this.applyOrdersFilter();
            this.initNoteData();
        });
        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '75px',
                right: '-100vw'
            });
        });
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '75px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize(undefined, '100vh');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: '75px',
                    right: '0px'
                });
            }, 100);
        });
    }

    initNoteData() {
        let note = this.data.note;
        if (note && note.id) {
            if (this.contactId = note.contactId)
                this.onContactChanged({value: this.contactId});

            this.noteId = note.id;
            this.summary = note.text;
            this.phone = note.contactPhoneId;
            this.type = note.noteType;
            this.followupDate = note.followUpDateTime && DateHelper.addTimezoneOffset(note.followUpDateTime.toDate(), true);
            this.currentDate = note.dateTime && DateHelper.addTimezoneOffset(note.dateTime.toDate(), true);
            this.addedBy = note.addedByUserId;
            this.orderId = note.orderId;
        }
    }

    initTypes(switchToDefault: boolean = true) {
        if (switchToDefault) {
            this.defaultType = NoteType.Note;
            this.type = this.defaultType;
        }
        this.types = Object.keys(NoteType).map((type: string) => {
            return {
                id: type,
                name: this.typePrefix + ' ' + this.l(type)
            };
        });
    }

    private getContacts(): Observable<Contact[]> {
        let contacts: Contact[] = [],
            personContactInfo = this._contactInfo.personContactInfo,
            isUpdatable = this._contactInfo['organizationContactInfo'].isUpdatable;
        /** Add contact persons */
        contacts.push(<any>{
            id: this._contactInfo.id,
            fullName: personContactInfo.fullName,
            jobTitle: personContactInfo.jobTitle,
            ratingId: this._contactInfo.ratingId,
            thumbnail: personContactInfo.primaryPhoto,
            phones: personContactInfo.details.phones
        });
        /** Add related organizations contacts */
        contacts = contacts.concat(isUpdatable && personContactInfo && personContactInfo.orgRelations ?
            personContactInfo.orgRelations
                .map((organizationRelation: PersonOrgRelationShortInfo) => {
                    organizationRelation.organization['fullName'] = organizationRelation.organization.name;
                    return organizationRelation.organization;
                }) : []);

        return !!this.data.propertyId
            ? this.propertyServiceProxy.getPropertyDetails(this.data.propertyId).pipe(
                map((propertyDetails: PropertyDto) => {
                    propertyDetails['fullName'] = propertyDetails.name;
                    contacts = contacts.concat([propertyDetails]);
                    return contacts;
                })
            )
            : of(contacts);
    }

    saveNote() {
        if (this.validator.validate().isValid) {
            let note: any = {
                id: this.noteId,
                contactId: this.contactId || this._contactInfo.id,
                text: this.summary,
                contactPhoneId: this.phone || undefined,
                noteType: this.type,
                followUpDateTime: this.getDateTime(this.followupDate),
                dateTime: this.getDateTime(this.currentDate),
                addedByUserId: +this.addedBy || undefined,
                orderId: this.orderId,
                leadId: this._contactInfo['leadId']
            }, request;

            if (this.noteId)
                request = this.notesService.updateNote(UpdateNoteInput.fromJS(note));
            else
                request = this.notesService.createNote(CreateNoteInput.fromJS(note));

            request.subscribe(() => {
                /** Clear the form data */
                this.resetFields();
                this.validator.reset();
                this.notify.info(this.l('SavedSuccessfully'));
                this.onSaved.emit();
                this.close();
            });
        }
    }

    getDateTime(value) {
        return value && DateHelper.removeTimezoneOffset(value, true) || undefined;
    }

    resetFields() {
        this.summary = null;
        this.followUpDateBox && this.followUpDateBox.instance.reset();
        this.currentDateBox && this.currentDateBox.instance.reset();
    }

    getContactById(id): Contact {
        return _.findWhere(this.contacts, {id: id});
    }

    onContactChanged($event) {
        let contact: Contact = this.getContactById($event.value);
        this.contactId = contact.id;
        if (contact instanceof PropertyDto) {
            this.showAdditionalFields = false;
        } else {
            this.showAdditionalFields = true;
            const contactPhones$ = contact['phones'] ? of(contact['phones']) :
                this.contactPhoneService.getContactPhones(contact.id)
                    .pipe(map((phones: ContactPhoneInfo[]) => phones || []));

            contactPhones$.pipe(
                mergeAll(),
                map((phone: ContactPhoneDto) => ({
                    id: phone.id,
                    phoneNumber: this.phoneFormatPipe.transform(phone.phoneNumber, undefined)
                })),
                toArray()
            ).subscribe((phones: ContactPhoneInfo[]) => {
                this.phones = phones;
                this.phone = this.phones[0] && this.phones[0].id;
            });
            this.applyOrdersFilter();
        }
        this.updateTypePrefix(contact);
        this.initTypes(false);
    }

    private updateTypePrefix(contact: Contact) {
        this.typePrefix = contact instanceof OrganizationShortInfo
            ? this.l('Company')
            : (contact instanceof PropertyDto
                ? this.l('Property')
                : this.l('Client')
            );
    }

    applyOrdersFilter() {
        if (this.ordersDataSource) {
            this.orderId = undefined;
            this.ordersDataSource.filter(['ContactId', '=',
                this.contactId || this._contactInfo.id]);
            this.ordersDataSource.load().then((items) => {
                let topItem = items[0];
                if (topItem && topItem.OrderStage != 'Complete')
                    this.orderId = topItem.Id;
            });
        }
    }

    initValidationGroup($event) {
        this.validator = $event.component;
    }

    showAddPhoneDialog(event) {
        let contact = this.getContactById(this.contactId);
        let dialogData = {
            contactId: this.contactId,
            groups: this._contactInfo.groups,
            field: 'phoneNumber',
            name: 'Phone',
            isConfirmed: false,
            isActive: false,
            isCompany: contact.hasOwnProperty('organization')
        }, shift = '50px';
        this.dialog.open(EditContactDialog, {
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
        this.contactPhoneService.createContactPhone(
            CreateContactPhoneInput.fromJS(data)
        ).subscribe((result: CreateContactPhoneOutput) => {
            if (result.id) {
                data.id = result.id;
                let contact: Contact = this.getContactById(this.contactId);
                if (contact) {
                    contact['phones'].unshift(ContactPhoneDto.fromJS(data));
                    this.onContactChanged({value: this.contactId});
                }
            }
        });
    }

    orderDisplayValue(data: InvoiceDto) {
        if (data)
            return data.Date.split('T').shift() +
                ' ' + data.OrderType + ' - ' + data.OrderStage;
        return data;
    }

    close() {
        this.dialogRef.close();
    }
}
