/** Core imports */
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

/** Third party imports */
import { NotifyService } from '@abp/notify/notify.service';
import { MatDialog } from '@angular/material/dialog';
import { ClipboardService } from 'ngx-clipboard';
import { Store, select } from '@ngrx/store';
import { Subject } from 'rxjs';
import { filter, first, takeUntil } from 'rxjs/operators';
import * as _ from 'underscore';
import { Address } from 'ngx-google-places-autocomplete/objects/address';

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
    ContactAddressServiceProxy,
    ContactInfoDto,
    CountryDto,
    CreatePersonOrgRelationOutput,
    OrganizationContactServiceProxy
} from '@shared/service-proxies/service-proxies';
import { GooglePlaceService } from '@shared/common/google-place/google-place.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { StatesService } from '@root/store/states-store/states.service';
import { AddressUsageTypeDto } from '@shared/service-proxies/service-proxies';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { EditAddressDialogData } from '@app/crm/contacts/edit-address-dialog/edit-address-dialog-data.interface';
import { AddressDto } from '@app/crm/contacts/addresses/address-dto.model';

@Component({
    selector: 'addresses',
    templateUrl: './addresses.component.html',
    styleUrls: [
        './addresses.component.less',
        './addresses.styles.less'
    ],
    providers: [ DialogService ]
})
export class AddressesComponent implements OnInit, OnDestroy {
    @Input() isCompany = false;
    @Input()
    set contactInfo(val: ContactInfoDto) {
        if (this._contactInfo = val)
            this.isEditAllowed = this.permissionService.checkCGPermission(this.contactInfo.groupId);
    }
    get contactInfo(): ContactInfoDto {
        return this._contactInfo;
    }
    @Input() contactId: number;
    @Input() addresses: AddressDto[];
    @Input() isAddAllowed = true;
    @Input() isDeleteAllowed = true;
    @Input() showType = true;
    @Input() editDialogTitle: string;
    @Output() onAddressUpdate: EventEmitter<{
        address: AddressDto,
        dialogData: Pick<EditAddressDialogData, 'id' | 'contactId' | 'city' | 'country' | 'isActive'
            | 'isConfirmed' | 'stateId' | 'stateName' | 'streetAddress' | 'comment' | 'usageTypeId'
            | 'zip'>
    }> = new EventEmitter();

    types: Object = {};
    country: string;
    streetNumber: string;
    streetAddress: string;
    city: string;
    stateCode: string;
    stateName: string;
    zip: string;

    isEditAllowed = false;
    destroy: Subject<any> = new Subject<any>();

    private clickTimeout;
    private clickCounter = 0;
    private itemInEditMode: any;
    private latestFormattedAddress: string;
    private _contactInfo: ContactInfoDto;

    constructor(
        private contactsService: ContactsService,
        private addressService: ContactAddressServiceProxy,
        private organizationContactService: OrganizationContactServiceProxy,
        private clipboardService: ClipboardService,
        private notifyService: NotifyService,
        private dialogService: DialogService,
        private store$: Store<RootStore.State>,
        private statesService: StatesService,
        private permissionService: AppPermissionService,
        public ls: AppLocalizationService,
        public dialog: MatDialog,
    ) {
        contactsService.organizationContactInfo$.pipe(filter(orgInfo => {
            return this.isCompany && orgInfo.id && !orgInfo.isUpdatable;
        }), first()).subscribe(() => {
            this.isEditAllowed = false;
        });
    }

    ngOnInit() {
        this.loadAddressTypes();
        this.getAddressTypes().subscribe((types: AddressUsageTypeDto[]) => {
            types.map((type: AddressUsageTypeDto) => {
                if (type.isCompany == this.isCompany)
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
            filter(Boolean),
            takeUntil(this.destroy.asObservable())
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

    showDialog(address: AddressDto, event, index?) {
        if (!this.isCompany || this.contactId)
            this.showAddressDialog(address, event, index);
        else
            this.contactsService.addCompanyDialog(
                event,
                this.contactInfo,
                Math.round(event.target.offsetWidth / 2)
            ).subscribe((result: CreatePersonOrgRelationOutput) => {
                if (result) {
                    this.showAddressDialog(address, event, index);
                }
            });
    }

    showAddressDialog(address: AddressDto, event, index) {
        const dialogData: EditAddressDialogData = {
            id: address && address.id,
            groupId: this.contactInfo.groupId,
            contactId: this.contactId,
            isCompany: this.isCompany,
            deleteItem: (event: MouseEvent) => {
                this.deleteAddress(address, event, index);
            },
            city: address && address.city,
            comment: address && address.comment,
            country: address && address.country,
            isActive: address ? address.isActive : true,
            isConfirmed: address ? address.isConfirmed : false,
            stateId: address && address.stateId,
            stateName: address && address.stateName,
            streetAddress: address && address.streetAddress,
            usageTypeId: address && address.usageTypeId,
            zip: address && address.zip,
            isDeleteAllowed: this.isDeleteAllowed,
            showType: this.showType,
            editDialogTitle: this.editDialogTitle
        };
        this.dialog.closeAll();
        this.dialog.open(EditAddressDialog, {
            data: dialogData,
            hasBackdrop: false,
            position: this.getDialogPosition(event)
        }).afterClosed().subscribe((saved: boolean) => {
            scrollTo(0, 0);
            if (saved && dialogData.contactId) {
                this.onAddressUpdate.emit({
                    address: address,
                    dialogData: dialogData
                });
            }
        });
        if (event.stopPropagation)
            event.stopPropagation();
    }

    deleteAddress(address: AddressDto, event: MouseEvent, index) {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: this.ls.l('DeleteContactHeader', this.ls.l('Address')),
                message: this.ls.l('DeleteContactMessage', this.ls.l('Address').toLowerCase())
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.dialog.closeAll();
                this.addressService.deleteContactAddress(this.contactId, address.id)
                    .subscribe(() => {
                        this.addresses.splice(index, 1);
                        this.contactsService.verificationUpdate();
                    });
            }
        });
        event.stopPropagation();
    }

    inPlaceEdit(address: AddressDto, event, index) {
        if (address.inplaceEdit)
            return ;

        this.clickCounter++;
        clearTimeout(this.clickTimeout);
        this.clickTimeout = setTimeout(() => {
            if (this.isEditAllowed && this.clickCounter > 1) {
                if (!window['google'])
                    this.showDialog(address, event, index);

                address.inplaceEdit = true;
                address.autoComplete = this.aggregateAddress(address);

                if (this.itemInEditMode && this.itemInEditMode != address)
                    this.itemInEditMode.inplaceEdit = false;

                this.itemInEditMode = address;
            } else
                this.showDialog(address, event, index);
            this.clickCounter = 0;
        }, 250);

        event.stopPropagation();
    }

    closeInPlaceEdit(address: AddressDto, event) {
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

    updateItem(address: AddressDto, event, index) {
        event.event.stopPropagation();

        if ((this.latestFormattedAddress != address.autoComplete)
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
            }).afterClosed().subscribe((isConfirmed: boolean) => {
                if (isConfirmed)
                    this.showDialog(address, event, index);
            });
        }

        this.loadCountries();
        this.getCountries().pipe(
            first()
        ).subscribe((countries: CountryDto[]) => {
            let country = _.findWhere(countries, { name: this.country }),
                countryId = country && country.code;
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
                            (this.stateName != address.stateName))
                    ) {
                        this.onAddressUpdate.emit({
                            address: address,
                            dialogData: {
                                id: address.id,
                                contactId: this.contactId,
                                city: this.city,
                                country: this.country,
                                isActive: address.isActive,
                                isConfirmed: address.isConfirmed,
                                streetAddress: this.streetAddress + ' ' + this.streetNumber,
                                comment: address.comment,
                                usageTypeId: address.usageTypeId,
                                stateName: this.stateCode,
                                stateId: this.statesService.getAdjustedStateCode(this.stateCode, this.stateName),
                                zip: address.zip
                            }
                        })
                        this.clearInplaceData();
                    }
                });
            }
            address.inplaceEdit = false;
        });
    }

    aggregateAddress(address: AddressDto) {
        return [
            address.streetAddress,
            address.city,
            address.stateName || address.stateId,
            address.zip,
            address.country
        ].join(',');
    }

    addressChanged(event: Address, address: AddressDto) {
        this.stateCode = GooglePlaceService.getStateCode(event.address_components);
        this.stateName = GooglePlaceService.getStateName(event.address_components);
        const countryCode = GooglePlaceService.getCountryCode(event.address_components);
        this.statesService.updateState(countryCode, this.stateCode, this.stateName);
        const countryName = GooglePlaceService.getCountryName(event.address_components);
        this.country = countryName === 'United States' ? AppConsts.defaultCountryName : countryName;
        this.zip = GooglePlaceService.getZipCode(event.address_components);
        this.streetAddress = GooglePlaceService.getStreet(event.address_components);
        this.streetNumber = GooglePlaceService.getStreetNumber(event.address_components);
        this.latestFormattedAddress = address.autoComplete = event.formatted_address;
        this.city = GooglePlaceService.getCity(event.address_components);
    }

    copyToClipbord(event, address) {
        this.clipboardService.copyFromContent(
            this.aggregateAddress(address));
        this.notifyService.info(this.ls.l('SavedToClipboard'));
        event.stopPropagation();
        event.preventDefault();
    }

    ngOnDestroy() {
        this.destroy.next();
    }
}
