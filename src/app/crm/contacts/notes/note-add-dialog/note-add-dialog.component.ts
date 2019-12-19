/** Core imports */
import { OnInit, AfterViewInit, Component, Inject, Injector, ViewChild, ElementRef } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import { Store, select } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeAll, toArray } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    CreateNoteInput,
    NotesServiceProxy,
    ContactPhoneDto,
    UserServiceProxy,
    CreateContactPhoneInput,
    ContactPhoneServiceProxy,
    ContactInfoDto,
    PersonOrgRelationShortInfo,
    PersonShortInfoDto,
    OrganizationShortInfo,
    NoteType
} from '@shared/service-proxies/service-proxies';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { EditContactDialog } from '../../edit-contact-dialog/edit-contact-dialog.component';
import { AppStore, ContactAssignedUsersStoreSelectors } from '@app/store';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppPermissions } from '@shared/AppPermissions';

class PhoneNumber {
    id: any;
    phoneNumber: any;
}

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

    orderId: number;
    summary: string;
    currentDate: any;
    followupDate: any;
    phone: string;
    contactId: number;
    addedBy: string;
    defaultType: string;
    type: string;
    companyContact: boolean;

    types = [];
    users = [];
    contacts: (OrganizationShortInfo|PersonShortInfoDto)[] = [];
    phones: PhoneNumber[];
    ordersDataSource: any;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private dialog: MatDialog,
        private elementRef: ElementRef,
        private phoneFormatPipe: PhoneFormatPipe,
        private notesService: NotesServiceProxy,
        private userService: UserServiceProxy,
        private contactPhoneService: ContactPhoneServiceProxy,
        private store$: Store<AppStore.State>,
        private clientService: ContactsService,
        public dialogRef: MatDialogRef<NoteAddDialogComponent>
    ) {
        super(injector);

        this.initTypes();

        this._contactInfo = this.data.contactInfo;
        let personContactInfo = this._contactInfo.personContactInfo;
        const relatedOrganizations: any[] = personContactInfo && personContactInfo.orgRelations ?
            personContactInfo.orgRelations
            .map((organizationRelation: PersonOrgRelationShortInfo) => {
                organizationRelation.organization['fullName'] = organizationRelation.organization.name;
                return organizationRelation.organization;
            }) : [];
        const relatedPersons: PersonShortInfoDto[] = this._contactInfo['organizationContactInfo'] &&
                                                     this._contactInfo['organizationContactInfo'].contactPersons
                             ? this._contactInfo['organizationContactInfo'].contactPersons
                             : [{
                id: this._contactInfo.id,
                fullName: personContactInfo.fullName,
                jobTitle: personContactInfo.jobTitle,
                ratingId: this._contactInfo.ratingId,
                thumbnail: personContactInfo.primaryPhoto,
                phones: personContactInfo.details.phones
            }];
        this.contacts = relatedPersons.concat(relatedOrganizations);
        this.onContactChanged({value: this.contacts[0].id});
        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '75px',
                right: '-100vw'
            });
        });

        this.store$.pipe(select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers,
            { contactGroup: this._contactInfo.groupId })).subscribe((result) => {
                this.users = result;
        });

        this.ordersDataSource = new DataSource({
            sort: [{ selector: 'CreationTime', desc: true }],
            select: ['Id', 'ContactId', 'Stage', 'OrderType', 'CreationTime', 'DateProcessed', 'Name'],
            requireTotalCount: false,
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl('Order'),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                deserializeDates: false,
                paginate: false
            }
        });
        this.applyOrdersFilter();
    }

    ngOnInit() {
        this.dialogRef.disableClose = true;
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

    initTypes(switchToDefault = true) {
        if (switchToDefault) {
            this.defaultType = NoteType.Note;
            this.type = this.defaultType;
        }

        this.types = _.map(Object.keys(NoteType), x => {
            let el = {};
            el['id'] = x;
            el['name'] = this.l(this.companyContact ? 'Company' : 'Client') + ' ' + this.l(x);
            return el;
        });
    }

    saveNote() {
        if (this.validator.validate().isValid)
            this.notesService.createNote(CreateNoteInput.fromJS({
                contactId: this.contactId || this._contactInfo.id,
                text: this.summary,
                contactPhoneId: this.phone || undefined,
                noteType: this.type,
                followUpDateTime: this.followupDate || undefined,
                dateTime: this.currentDate || undefined,
                addedByUserId: parseInt(this.addedBy) || undefined,
                orderId: this.orderId
            })).subscribe(() => {
                /** Clear the form data */
                this.resetFields();
                this.validator.reset();
                this.notify.info(this.l('SavedSuccessfully'));
                this.clientService.invalidate('notes');
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
                this.userService.getUsers($event.text, [ AppPermissions.CRM ], undefined, false, undefined, undefined, undefined, 10, 0).subscribe((result) => {
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
        const contactPhones$ = contact.phones ? of(contact.phones) :
            this.contactPhoneService.getContactPhones(contact.id)
                .pipe(map(phones => phones || []));

        contactPhones$.pipe(
            mergeAll(),
            map((phone: ContactPhoneDto) => ({
                id: phone.id,
                phoneNumber: this.phoneFormatPipe.transform(phone.phoneNumber, undefined)
            })),
            toArray()
        ).subscribe(phones => {
            this.phones = phones;
            this.phone = this.phones[0] && this.phones[0].id;
        });
        this.contactId = contact.id;

        this.companyContact = contact instanceof OrganizationShortInfo;

        this.initTypes(false);
        this.applyOrdersFilter();
    }

    applyOrdersFilter() {
        if (this.ordersDataSource) {
            this.orderId = undefined;
            this.ordersDataSource.filter(['ContactId', '=',
                this.contactId || this._contactInfo.id]);
            this.ordersDataSource.load().then((items) => {
                let topItem = items[0];
                if (topItem && !topItem.DateProcessed)
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
            groupId: this._contactInfo.groupId,
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
        ).subscribe(result => {
            if (result.id) {
                data.id = result.id;
                let contact = this.getContactById(this.contactId);
                if (contact) {
                    contact.details.phones.unshift(ContactPhoneDto.fromJS(data));
                    this.onContactChanged({value: this.contactId});
                }
            }
        });
    }

    orderDisplayValue(data) {
        if (data)
            return data.CreationTime.split('T').shift() +
                ' ' + data.OrderType + ' - ' + data.Stage;
        return data;
    }

    close() {
        this.dialogRef.close();
    }
}
