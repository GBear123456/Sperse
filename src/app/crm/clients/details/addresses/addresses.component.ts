import { AppConsts } from '@shared/AppConsts';
import { Component, OnInit, Injector, Input } from '@angular/core';
import { EditAddressDialog } from '../edit-address-dialog/edit-address-dialog.component';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { MatDialog } from '@angular/material';
import { ClientDetailsService } from '../client-details.service';
import {
    CustomersServiceProxy, CustomerInfoDto, ContactAddressServiceProxy, CountryDto, CountryServiceProxy,
    ContactAddressDto, UpdateContactAddressInput, CreateContactAddressInput, ContactInfoDetailsDto,
    OrganizationContactServiceProxy, CreateOrganizationInput, OrganizationContactInfoDto, OrganizationInfoDto
} from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
    selector: 'addresses',
    templateUrl: './addresses.component.html',
    styleUrls: ['./addresses.component.less']
})
export class AddressesComponent extends AppComponentBase implements OnInit {
    @Input() contactInfoData: ContactInfoDetailsDto;
    @Input() customerInfo: CustomerInfoDto;

    types: Object = {};
    country: string;
    streetNumber: string;
    streetAddress: string;
    city: string;
    state: string;
    zip: string;

    isEditAllowed = false;

    countries: CountryDto[];

    private _isInPlaceEditAllowed = true;
    private _itemInEditMode: any;

    constructor(injector: Injector,
                public dialog: MatDialog,
                private _clientDetailsService: ClientDetailsService,
                private _customerService: CustomersServiceProxy,
                private _addressService: ContactAddressServiceProxy,
                private _countryService: CountryServiceProxy,
                private _organizationContactService: OrganizationContactServiceProxy) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        _addressService.getAddressUsageTypes().subscribe(result => {
            result.items.reduce(function (obj, type) {
                obj[type.id] = type.name;
                return obj;
            }, this.types);
        });

        this._countryService.getCountries()
            .subscribe(result => {
                this.countries = result;
            });

        this.isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');
    }

    getDialogPossition(event) {
        let shiftY = this.calculateShiftY(event);
        let parent = event.target.closest('.address-wrapper');
        return this.calculateDialogPosition(event, parent, 0, shiftY);
    }

    calculateShiftY(event) {
        let shift = 245;

        let availableSpaceY = window.innerHeight - event.clientY;
        if (availableSpaceY < shift + 40)
            shift += shift - availableSpaceY + 130;

        return shift;
    }

    showDialog(address, event, index) {
        let dialogData = _.pick(address || {}, 'id', 'city',
            'comment', 'country', 'isActive', 'isConfirmed',
            'state', 'streetAddress', 'usageTypeId', 'zip');
        dialogData.contactId = this.contactInfoData && this.contactInfoData.contactId;
        dialogData.deleteItem = (event) => {
            this.deleteAddress(address, event, index);
        };
        this.dialog.closeAll();
        this.dialog.open(EditAddressDialog, {
            data: dialogData,
            hasBackdrop: false,
            position: this.getDialogPossition(event)
        }).afterClosed().subscribe(result => {
            if (result) {
                if (dialogData.contactId) {
                    this.updateDataField(address, dialogData);
                } else {
                    this.createOrganization(address, dialogData);
                }
            }
        });
        event.stopPropagation();
    }

    createOrganization(address, dialogData) {
        let companyName = AppConsts.defaultCompanyName;
        this._organizationContactService.createOrganization(CreateOrganizationInput.fromJS({
            customerId: this.customerInfo.id,
            companyName: companyName
        })).subscribe(response => {
            this.initializeOrganizationInfo(companyName, response.id);
            dialogData.contactId = response.id;
            this.updateDataField(address, dialogData);
        });
    }

    initializeOrganizationInfo(companyName, contactId) {
        this.customerInfo.organizationContactInfo = OrganizationContactInfoDto.fromJS({
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
        this._addressService
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
                this._clientDetailsService.verificationUpdate();
            }
        );
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
                this._addressService.deleteContactAddress(
                    this.contactInfoData.contactId, address.id).subscribe(result => {
                    this.contactInfoData.addresses.splice(index, 1);
                    this._clientDetailsService.verificationUpdate();
                });
            }
        });
        event.stopPropagation();
    }

    inPlaceEdit(address, event, index) {
        if (!this.isEditAllowed || !window['google'])
            return this.showDialog(address, event, index);

        if (!this._isInPlaceEditAllowed)
            return;

        address.inplaceEdit = true;
        address.autoComplete = this.aggregateAddress(address);

        if (this._itemInEditMode && this._itemInEditMode != address)
            this._itemInEditMode.inplaceEdit = false;

        this._itemInEditMode = address;

        event.stopPropagation();
    }

    closeInPlaceEdit(address, event) {
        this.clearInplaceData();
        address.inplaceEdit = false;
        this._isInPlaceEditAllowed = true;
        event.jQueryEvent.stopPropagation();
    }

    clearInplaceData() {
        this.country = '';
        this.streetNumber = '';
        this.streetAddress = '';
        this.city = '';
        this.state = '';
        this.zip = '';
    }

    updateItem(address, event) {
        let country = _.findWhere(this.countries, {name: this.country}),
            countryId = country && country['code'];
        countryId && this._countryService
            .getCountryStates(countryId)
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
        address.inplaceEdit = false;
        this._isInPlaceEditAllowed = true;
        event.event.stopPropagation();
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
        this._isInPlaceEditAllowed = address.autoComplete == event.formatted_address;
    }

    ngOnInit() {
    }
}
