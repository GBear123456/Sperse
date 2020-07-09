/** Core imports */
import { Component, Input, OnInit } from '@angular/core';

/** Third party imports */
import { NotifyService } from '@abp/notify/notify.service';
import { MatDialog } from '@angular/material/dialog';
import { ClipboardService } from 'ngx-clipboard';
import { Store, select } from '@ngrx/store';
import { filter, first } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import {
    AddressUsageTypesStoreActions,
    AddressUsageTypesStoreSelectors,
    CountriesStoreActions,
    CountriesStoreSelectors,
    RootStore,
    StatesStoreActions,
    StatesStoreSelectors
} from '@root/store';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppConsts } from '@shared/AppConsts';
import { EditAddressDialog } from '../edit-address-dialog/edit-address-dialog.component';
import { ContactsService } from '../contacts.service';
import {
    ContactAddressDto,
    ContactAddressServiceProxy,
    ContactInfoDetailsDto,
    ContactInfoDto,
    CountryDto,
    CreateContactAddressInput,
    OrganizationContactServiceProxy,
    UpdateContactAddressInput
} from '@shared/service-proxies/service-proxies';
import { GooglePlaceService } from '@shared/common/google-place/google-place.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { StatesService } from '@root/store/states-store/states.service';
import { AddressUsageTypeDto } from '../../../../shared/service-proxies/service-proxies';
import { AppPermissionService } from '@shared/common/auth/permission.service';

@Component({
    selector: 'addresses',
    templateUrl: './addresses.component.html',
    styleUrls: [
        './addresses.component.less',
        './addresses.styles.less'
    ],
    providers: [ DialogService, GooglePlaceService ]
})
export class AddressesComponent implements OnInit {
    @Input() isCompany = false;
    @Input()
    set contactInfo(val: ContactInfoDto) {
        if (this._contactInfo = val)
            this.isEditAllowed = this.permissionService.checkCGPermission(this.contactInfo.groupId);
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
    stateCode: string;
    stateName: string;
    zip: string;

    isEditAllowed = false;

    private _clickTimeout;
    private _clickCounter = 0;
    private _itemInEditMode: any;
    private _contactInfo: ContactInfoDto;
    private _latestFormatedAddress: string;

    constructor(
        private contactsService: ContactsService,
        private addressService: ContactAddressServiceProxy,
        private organizationContactService: OrganizationContactServiceProxy,
        private clipboardService: ClipboardService,
        private notifyService: NotifyService,
        private dialogService: DialogService,
        private store$: Store<RootStore.State>,
        private googlePlaceService: GooglePlaceService,
        private statesService: StatesService,
        private permissionService: AppPermissionService,
        public ls: AppLocalizationService,
        public dialog: MatDialog,
    ) {
        contactsService.organizationContactInfo$.pipe(filter(orgInfo => {
            return this.isCompany && orgInfo.id && !orgInfo.isUpdatable;
        }), first()).subscribe(orgInfo => {
            this.isEditAllowed = false;
        });
    }

    ngOnInit() {
        this.loadAddressTypes();
        this.getAddressTypes()
            .subscribe((types: AddressUsageTypeDto[]) => {
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
            filter(Boolean)
        );
    }

    loadCountries() {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
    }

    getCountries() {
        return this.store$.pipe(
            select(CountriesStoreSelectors.getCountries),
            filter(Boolean)
        );
    }

    getDialogPosition(event) {
        let shiftY = this.calculateShiftY(event);
        let dialogHeight = 550;
        let parent = event.target && event.target.closest('.address-wrapper') || document.body;
        return this.dialogService.calculateDialogPosition(event, parent, 150, shiftY, dialogHeight);
    }

    calculateShiftY(event) {
        let shift = 300;

        let availableSpaceY = window.innerHeight - event.clientY;
        if (availableSpaceY < shift + 40)
            shift += shift - availableSpaceY + 130;

        return shift;
    }

    showDialog(address, event, index?) {
        if (!this.isCompany || this.contactInfoData && this.contactInfoData.contactId)
            this.showAddressDialog(address, event, index);
        else
            this.contactsService.addCompanyDialog(
                event,
                this.contactInfo,
                Math.round(event.target.offsetWidth / 2)
            ).subscribe(result => {
                if (result) {
                    this.showAddressDialog(address, event, index);
                }
            });
    }

    showAddressDialog(address, event, index) {
        let dialogData = _.pick(address || { isActive: true, isConfirmed: false }, 'id', 'city',
            'comment', 'country', 'isActive', 'isConfirmed', 'stateId',
            'stateName', 'streetAddress', 'usageTypeId', 'zip');
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
            if (result && dialogData.contactId) {
                this.updateDataField(address, dialogData);
            }
        });
        if (event.stopPropagation)
            event.stopPropagation();
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
                address.stateId = data.stateId;
                address.stateName = data.stateName;
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
                title: this.ls.l('DeleteContactHeader', this.ls.l('Address')),
                message: this.ls.l('DeleteContactMessage', this.ls.l('Address').toLowerCase())
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
        this.stateCode = '';
        this.stateName = '';
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
                    title: this.ls.l('AreYouSure'),
                    message: this.ls.l('EnterAddressManually'),
                    btnConfirmTitle: this.ls.l('Update'),
                    btnCancelTitle: this.ls.l('Discard')
                }
            }).afterClosed().subscribe(isConfirmed => {
                if (isConfirmed)
                    this.showDialog(address, event, index);
            });
        }

        this.loadCountries();
        this.getCountries().pipe(
            first()
        ).subscribe((countries: CountryDto[]) => {
            let country = _.findWhere(countries, { name: this.country }),
                countryId = country && country['code'];
            if (countryId) {
                this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryId));
                this.store$.pipe(
                    select(StatesStoreSelectors.getCountryStates, { countryCode: countryId }),
                    filter(Boolean),
                    first()
                ).subscribe(() => {
                    if (this.country && this.streetNumber && this.stateName &&
                        this.streetAddress && this.city &&
                        ((this.country != address.country) ||
                            (address.streetAddress != (this.streetAddress + ' ' + this.streetNumber)) ||
                            (this.city != address.city) ||
                            (this.stateName != address.state))
                    ) {
                        this.updateDataField(address, {
                            id: address.id,
                            contactId: this.contactInfoData.contactId,
                            city: this.city,
                            country: this.country,
                            isActive: address.isActive,
                            isConfirmed: address.isConfirmed,
                            streetAddress: this.streetAddress + ' ' + this.streetNumber,
                            comment: address.comment,
                            usageTypeId: address.usageTypeId,
                            countryId: countryId,
                            stateName: this.stateCode,
                            stateId: this.statesService.getAdjustedStateCode(this.stateCode, this.stateName)
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
            address.stateName || address.stateId,
            address.zip,
            address.country
        ].join(',');
    }

    addressChanged(address, event) {
        const countryCode = this.googlePlaceService.getCountryCode(event.address_components);
        this.stateCode = this.googlePlaceService.getStateCode(event.address_components);
        this.stateName = this.googlePlaceService.getStateName(event.address_components);
        this.statesService.updateState(countryCode, this.stateCode, this.stateName);
        this._latestFormatedAddress = address.autoComplete = event.formatted_address;
        this.city = this.googlePlaceService.getCity(event.address_components);
    }

    updateCountryInfo(countryName: string) {
        countryName == 'United States' ?
            this.country = AppConsts.defaultCountryName :
            this.country = countryName;
    }

    copyToClipbord(event, address) {
        this.clipboardService.copyFromContent(
            this.aggregateAddress(address));
        this.notifyService.info(this.ls.l('SavedToClipboard'));
        event.stopPropagation();
        event.preventDefault();
    }
}
