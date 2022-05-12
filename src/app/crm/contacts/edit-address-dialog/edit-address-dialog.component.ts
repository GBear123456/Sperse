/** Application imports */
import { ChangeDetectionStrategy, Component, ElementRef, Inject, ViewChild } from '@angular/core';

/** Third party imports */
import { select, Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';
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
import { AppConsts } from '@shared/AppConsts';
import {
    AddressUsageTypeDto,
    CountryDto,
    CountryStateDto
} from '@shared/service-proxies/service-proxies';
import { GooglePlaceService } from '@shared/common/google-place/google-place.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { StatesService } from '@root/store/states-store/states.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { EditAddressDialogData } from '@app/crm/contacts/edit-address-dialog/edit-address-dialog-data.interface';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    selector: 'edit-address-dialog',
    templateUrl: 'edit-address-dialog.html',
    styleUrls: ['edit-address-dialog.less'],
    host: {
        '(document:mouseup)': 'mouseUp($event)',
        '(document:mousemove)': 'mouseMove($event)'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditAddressDialog {
    @ViewChild('addressInput') addressInput: ElementRef;
    types: AddressUsageTypeDto[] = [];
    validator: any;
    action: string;
    address: any;
    movePos: any;
    isEditAllowed = this.permissionService.checkCGPermission(this.data.groups) || 
        this.data.isCompany && this.permissionService.isGranted(AppPermissions.CRMCompaniesManageAll);
    states: CountryStateDto[];
    countries: CountryDto[];
    state: string;
    googleAutoComplete: Boolean;
    localization = AppConsts.localization;
    countryId: string;

    constructor(
        private elementRef: ElementRef,
        private store$: Store<RootStore.State>,
        private statesService: StatesService,
        private sessionService: AppSessionService,
        private permissionService: AppPermissionService,
        public dialogRef: MatDialogRef<EditAddressDialog>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: EditAddressDialogData
    ) {
        if (this.validateAddress(data)) {
            this.action = 'Edit';
            let address = data.streetAddress;
            if (this.googleAutoComplete) {
                if (data.showNeighborhood)
                    address += `,${data.neighborhood}`;
                address += `,${data.city},${data.stateName},${data.countryName}`;
            }
            this.address = address;
        } else
            this.action = 'Create';
        this.googleAutoComplete = Boolean(window['google']);

        this.addressTypesLoad();
        this.countriesStateLoad();
    }

    countriesStateLoad(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries))
            .subscribe((countries: CountryDto[]) => {
                this.countries = countries;
                this.onCountryChange({
                    value: this.data.countryName
                });
            });
    }

    onCountryChange(event) {
        const country = _.findWhere(this.countries, { name: event.value });
        this.data.countryId = country ? country['code'] : null;
        if (country) {
            this.store$.dispatch(new StatesStoreActions.LoadRequestAction(this.data.countryId));
        }
        this.statesService.updateState(this.data.countryId, this.data.stateId, this.data.stateName);
    }

    onAddressChanged(address: Address) {
        const countryCode = GooglePlaceService.getCountryCode(address.address_components);
        const countryName = GooglePlaceService.getCountryName(address.address_components);
        this.data.countryName = this.sessionService.getCountryNameByCode(countryCode) || countryName;
        this.data.zip = GooglePlaceService.getZipCode(address.address_components);
        this.data.streetAddress = GooglePlaceService.getStreet(address.address_components);
        this.data.stateId = GooglePlaceService.getStateCode(address.address_components);
        this.data.stateName = GooglePlaceService.getStateName(address.address_components);
        this.statesService.updateState(countryCode, this.data.stateId, this.data.stateName);
        this.data.countryId = countryCode;
        this.data.city = GooglePlaceService.getCity(address.address_components);
        this.data.neighborhood = GooglePlaceService.getNeighborhood(address.address_components);
        this.data.formattedAddress = address.formatted_address;
        const streetNumber = GooglePlaceService.getStreetNumber(address.address_components);
        this.address = this.addressInput.nativeElement.value = streetNumber
            ? streetNumber + ' ' + this.data.streetAddress
            : this.data.streetAddress;
    }

    addressTypesLoad() {
        this.store$.dispatch(new AddressUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(AddressUsageTypesStoreSelectors.getAddressUsageTypes)
        )
            .subscribe((types: AddressUsageTypeDto[]) => {
                if (types)
                    this.types = types.filter((type: AddressUsageTypeDto) => {
                        return type.isCompany == this.data.isCompany;
                    });
                if (!this.data.usageTypeId)
                    this.data.usageTypeId = this.types[0].id;
            });
    }

    onSave() {
        this.data.streetAddress = this.address;
        if (this.validator.validate().isValid && this.validateAddress(this.data)) {
            if (this.data.countryName)
                this.data.countryId = _.findWhere(this.countries, { name: this.data.countryName })['code'];
            this.data.stateId = this.statesService.getAdjustedStateCode(this.data.stateId, this.data.stateName);
            this.dialogRef.close(true);
        }
    }

    getCountryStates(): Observable<CountryStateDto[]> {
        return this.store$.pipe(
            select(StatesStoreSelectors.getCountryStates, { countryCode: this.data.countryId }),
            map((states: CountryStateDto[]) => states || [])
        );
    }

    stateChanged(e) {
        this.store$.pipe(
            select(StatesStoreSelectors.getStateCodeFromStateName, {
                countryCode: this.data.countryId,
                stateName: e.value
            }),
            first()
        ).subscribe((stateCode: string) => {
            this.data.stateId = stateCode;
        });
    }

    onCustomStateCreate(e) {
        this.data.stateId = null;
        this.data.stateName = e.text;
        this.statesService.updateState(this.data.countryId, null, e.text);
        e.customItem = {
            code: null,
            name: e.text
        };
    }

    validateAddress(data: EditAddressDialogData) {
        return data.streetAddress ||
            data.countryName ||
            data.stateId ||
            data.city ||
            data.zip;
    }

    initValidationGroup(event) {
        this.validator = event.component;
    }

    mouseDown(event) {
        this.movePos = {
            x: event.clientX,
            y: event.clientY
        };
    }

    mouseUp(event) {
        this.movePos = null;
    }

    mouseMove(event) {
        if (this.movePos) {
            let x = event.clientX - this.movePos.x,
                y = event.clientY - this.movePos.y,
                elm = this.elementRef.nativeElement
                    .parentElement.parentElement;

            this.dialogRef.updatePosition({
                top: parseInt(elm.style.marginTop) + y + 'px',
                left: parseInt(elm.style.marginLeft) + x + 'px'
            });

            this.mouseDown(event);
        }
    }

    getUsageTypeHint(item) {
        return item ? this.ls.l('ContactInformation_AddressTypeTooltip_' + item.id) : '';
    }

    getConfirmationText() {
        let date = this.data.confirmationDate;
        return this.ls.l('ConfirmedContact') + (
            this.data.isConfirmed && date ? 
                ' at ' + date.format(AppConsts.formatting.dateMoment) +
                ' by ' + (this.data.confirmedByUserFullName || this.ls.l('System')) : ''
        );
    }
}
