/** Core imports */
import { Component, OnInit, Injector, Input } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { filter, first } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AddressUsageTypesStoreActions, AddressUsageTypesStoreSelectors } from '@app/store';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EditAddressDialog } from '../edit-address-dialog/edit-address-dialog.component';
import { ContactsService } from '../contacts.service';
import {
    ContactInfoDto, ContactAddressServiceProxy,
    ContactAddressDto, UpdateContactAddressInput, CreateContactAddressInput, ContactInfoDetailsDto,
    OrganizationContactServiceProxy, CreateOrganizationInput, OrganizationContactInfoDto, OrganizationInfoDto
} from '@shared/service-proxies/service-proxies';
import { PersonOrgRelationType } from '@root/shared/AppEnums';
import { GooglePlaceHelper } from '@shared/helpers/GooglePlaceHelper';

@Component({
    selector: 'addresses',
    templateUrl: './addresses.component.html',
    styleUrls: ['./addresses.component.less'],
    providers: [ DialogService, GooglePlaceHelper ]
})
export class AddressesComponent extends AppComponentBase implements OnInit {
    @Input() isCompany = false;
    @Input()
    set contactInfo(val: ContactInfoDto) {
        if (this._contactInfo = val)
            this.isEditAllowed = this.contactsService.checkCGPermission(this.contactInfo.groupId);
    }
    get contactInfo(): ContactInfoDto {
        return this._contactInfo;
    }
    @Input() contactInfoData: ContactInfoDetailsDto;


    types: Object = {};
    country: string;
    streetNumber: string;
    streetAddress: string;
    city: string;
    state: string;
    zip: string;

    isEditAllowed = false;

    private _clickTimeout;
    private _clickCounter = 0;
    private _itemInEditMode: any;
    private _contactInfo: ContactInfoDto;
    private _latestFormatedAddress: string;

    constructor(injector: Injector,
                public dialog: MatDialog,
                private contactsService: ContactsService,
                private addressService: ContactAddressServiceProxy,
                private organizationContactService: OrganizationContactServiceProxy,
                private dialogService: DialogService,
                private store$: Store<RootStore.State>,
                private googlePlaceHelper: GooglePlaceHelper
    ) {
        super(injector);
    }

    ngOnInit() {
        this.loadAddressTypes();
        this.getAddressTypes()
            .subscribe(types => {
                types.map((type) => {
                    if (type['isCompany'] == this.isCompany)
                        this.types[type.id] = type.name;
                });
            });
    }

    loadAddressTypes() {
        this.store$.dispatch(new AddressUsageTypesStoreActions.LoadRequestAction());
    }

    getAddressTypes() {
        return this.store$.pipe(
            select(AddressUsageTypesStoreSelectors.getAddressUsageTypes),
            filter(types => !!types)
        );
    }

    loadCountries() {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
    }

    getCountries() {
        return this.store$.pipe(select(CountriesStoreSelectors.getCountries), filter(countries => !!countries));
    }

    getDialogPosition(event) {
        let shiftY = this.calculateShiftY(event);
        let parent = event.target && event.target.closest('.address-wrapper') || document.body;
        return this.dialogService.calculateDialogPosition(event, parent, 0, shiftY);
    }

    calculateShiftY(event) {
        let shift = 300;

        let availableSpaceY = window.innerHeight - event.clientY;
        if (availableSpaceY < shift + 40)
            shift += shift - availableSpaceY + 130;

        return shift;
    }

    showDialog(address, event, index) {
        if (!this.isCompany || this.contactInfoData && this.contactInfoData.contactId)
            this.showAddressDialog(address, event, index);
        else
            this.contactsService.addCompanyDialog(event, this.contactInfo,
                Math.round(event.target.offsetWidth / 2)
            ).subscribe(result => {
                if (result) {
                    this.contactInfoData = ContactInfoDetailsDto.fromJS({contactId: result.organizationId});
                    this.showAddressDialog(address, event, index);
                }
            });
    }

    showAddressDialog(address, event, index) {
        let dialogData = _.pick(address || {isActive: true}, 'id', 'city',
            'comment', 'country', 'isActive', 'isConfirmed',
            'state', 'streetAddress', 'usageTypeId', 'zip');
        dialogData.groupId = this.contactInfo.groupId;
        dialogData.contactId = this.contactInfoData && this.contactInfoData.contactId;
        dialogData.isCompany = this.isCompany;
        dialogData.deleteItem = (event) => {
            this.deleteAddress(address, event, index);
        };
        this.dialog.closeAll();
        this.dialog.open(EditAddressDialog, {
            data: dialogData,
            hasBackdrop: false,
            position: this.getDialogPosition(event)
        }).afterClosed().subscribe(result => {
            scrollTo(0, 0);
            if (result) {
                if (dialogData.contactId) {
                    this.updateDataField(address, dialogData);
                } else {
                    this.createOrganization(address, dialogData);
                }
            }
        });
        if (event.stopPropagation)
            event.stopPropagation();
    }

    createOrganization(address, dialogData) {
        let companyName = AppConsts.defaultCompanyName;
        this.organizationContactService.createOrganization(CreateOrganizationInput.fromJS({
            relatedContactId: this.contactInfo.id,
            companyName: companyName,
            relationTypeId: PersonOrgRelationType.Employee
        })).subscribe(response => {
            this.initializeOrganizationInfo(companyName, response.id);
            dialogData.contactId = response.id;
            this.updateDataField(address, dialogData);
        });
    }

    initializeOrganizationInfo(companyName, contactId) {
         this.contactInfo['organizationContactInfo'] = OrganizationContactInfoDto.fromJS({
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

    updateDataField(address, data) {
        this.addressService
            [(address ? 'update' : 'create') + 'ContactAddress'](
            (address ? UpdateContactAddressInput : CreateContactAddressInput).fromJS(data)
        ).subscribe(result => {
            if (!result && address) {
                address.city = data.city;
                address.country = data.country;
                address.isActive = data.isActive;
                address.isConfirmed = data.isConfirmed;
                address.state = data.state;
                address.streetAddress = data.streetAddress;
                address.comment = data.comment;
                address.usageTypeId = data.usageTypeId;
                address.zip = data.zip;
            } else if (result.id) {
                data.id = result.id;
                this.contactInfoData.addresses
                    .push(ContactAddressDto.fromJS(data));
            }
            this.contactsService.verificationUpdate();
        });
    }

    deleteAddress(address, event, index) {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: this.l('DeleteContactHeader', this.l('Address')),
                message: this.l('DeleteContactMessage', this.l('Address').toLowerCase())
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.dialog.closeAll();
                this.addressService.deleteContactAddress(
                    this.contactInfoData.contactId, address.id).subscribe(() => {
                    this.contactInfoData.addresses.splice(index, 1);
                    this.contactsService.verificationUpdate();
                });
            }
        });
        event.stopPropagation();
    }

    inPlaceEdit(address, event, index) {
        if (address.inplaceEdit)
            return ;

        this._clickCounter++;
        clearTimeout(this._clickTimeout);
        this._clickTimeout = setTimeout(() => {
            if (this.isEditAllowed && this._clickCounter > 1) {
                if (!window['google'])
                    this.showDialog(address, event, index);

                address.inplaceEdit = true;
                address.autoComplete = this.aggregateAddress(address);

                if (this._itemInEditMode && this._itemInEditMode != address)
                    this._itemInEditMode.inplaceEdit = false;

                this._itemInEditMode = address;
            } else
                this.showDialog(address, event, index);
            this._clickCounter = 0;
        }, 250);

        event.stopPropagation();
    }

    closeInPlaceEdit(address, event) {
        this.clearInplaceData();
        address.inplaceEdit = false;
        event.event.stopPropagation();
    }

    clearInplaceData() {
        this.country = '';
        this.streetNumber = '';
        this.streetAddress = '';
        this.city = '';
        this.state = '';
        this.zip = '';
    }

    updateItem(address, event, index) {
        event.event.stopPropagation();

        if ((this._latestFormatedAddress != address.autoComplete)
            && (address.autoComplete != this.aggregateAddress(address))
        ) {
            address.inplaceEdit = false;
            return this.dialog.open(ConfirmDialogComponent, {
                data: {
                    title: this.l('AreYouSure'),
                    message: this.l('EnterAddressManually'),
                    btnConfirmTitle: this.l('Update'),
                    btnCancelTitle: this.l('Discard')
                }
            }).afterClosed().subscribe(isConfirmed => {
                if (isConfirmed)
                    this.showDialog(address, event, index);
            });
        }

        this.loadCountries();
        this.getCountries().pipe(
            first()
        ).subscribe(countries => {
            let country = _.findWhere(countries, { name: this.country }),
                countryId = country && country['code'];
            if (countryId) {
                this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryId));
                this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryId }))
                    .pipe(filter(states => !!states), first())
                    .subscribe(states => {
                        if (this.country && this.streetNumber && this.state &&
                            this.streetAddress && this.city &&
                            ((this.country != address.country) ||
                                (address.streetAddress != (this.streetAddress + ' ' + this.streetNumber)) ||
                                (this.city != address.city) ||
                                (this.state != address.state))
                        ) {
                            let state = _.findWhere(states, {name: this.state});
                            this.updateDataField(address, {
                                id: address.id,
                                contactId: this.contactInfoData.contactId,
                                city: this.city,
                                country: this.country,
                                isActive: address.isActive,
                                isConfirmed: address.isConfirmed,
                                state: this.state,
                                streetAddress: this.streetAddress + ' ' + this.streetNumber,
                                comment: address.comment,
                                usageTypeId: address.usageTypeId,
                                countryId: countryId,
                                stateId: state && state['code']
                            });
                            this.clearInplaceData();
                        }
                    });
            }
            address.inplaceEdit = false;
        });
    }

    aggregateAddress(address: ContactAddressDto) {
        return [
            address.streetAddress,
            address.city,
            address.state,
            address.zip,
            address.country
        ].join(',');
    }

    addressChanged(address, event) {
        this._latestFormatedAddress = address.autoComplete = event.formatted_address;
        this.state = this.googlePlaceHelper.getState(event.address_components);
    }

    updateCountryInfo(countryName: string) {
        countryName == 'United States' ?
            this.country = AppConsts.defaultCountryName :
            this.country = countryName;
    }
}
