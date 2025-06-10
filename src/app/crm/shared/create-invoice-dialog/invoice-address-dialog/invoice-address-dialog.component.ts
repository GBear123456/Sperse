/** Application imports */
import { Component, Inject, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import * as _ from 'underscore';
import { Address } from 'ngx-google-places-autocomplete/objects/address';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { GooglePlaceService } from '@shared/common/google-place/google-place.service';
import { CountriesStoreActions, CountriesStoreSelectors, RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { CountryStateDto, CountryDto, ContactServiceProxy,
    PersonOrgRelationShortInfo, ContactDetailsDto, OrganizationShortInfo } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { StatesService } from '@root/store/states-store/states.service';

@Component({
    selector: 'invoice-address-dialog',
    templateUrl: 'invoice-address-dialog.html',
    styleUrls: [
        '../../../../shared/common/styles/form.less',
        './invoice-address-dialog.less',
        '../../../contacts/addresses/addresses.styles.less'
    ],
    host: {
        '(document:mouseup)': 'mouseUp()',
        '(document:mousemove)': 'mouseMove($event)'
    }
})
export class InvoiceAddressDialog {
    @ViewChild('addressInput') addressInput: ElementRef;
    validator: any;
    address: any;
    movePos: any;
    states: CountryStateDto[];
    countries: CountryDto[];
    googleAutoComplete: Boolean;
    emailRegEx = AppConsts.regexPatterns.email;
    contactDetails: ContactDetailsDto = new ContactDetailsDto();
    organizations: string[] = [];
    phones: string[] = [];
    addresses: any[] = [];

    constructor(
        private elementRef: ElementRef,
        private contactProxy: ContactServiceProxy,
        private store$: Store<RootStore.State>,
        private statesService: StatesService,
        public dialogRef: MatDialogRef<InvoiceAddressDialog>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        if (this.validateAddress(data)) {
            this.address =
                this.googleAutoComplete ? [
                    data.address1,
                    data.city,
                    data.stateName,
                    data.countryId
                ].join(',') : this.data.address1;
        }

        this.googleAutoComplete = Boolean(window['google']);
        this.contactDetailsLoad();
        this.countriesStateLoad();
    }

    contactDetailsLoad() {
        this.contactProxy.getContactDetails(this.data.contactId).subscribe((data: ContactDetailsDto) => {
            this.contactDetails = data;
            this.organizations = data.orgRelations && data.orgRelations.map((rel: PersonOrgRelationShortInfo) => {
                return rel.organization.name;
            });
            this.phones = data.phones.map(item => item.phoneNumber);
            this.addresses = data.addresses.map(item => {
                item['text'] = [
                    item.streetAddress,
                    item.city,
                    item.stateId,
                    item.countryName
                ].filter(Boolean).join(',');
                return item;
            });
        });
    }

    countriesStateLoad(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe(result => {
            this.countries = result;
            this.checkCountryByName();
        });
    }

    checkCountryByName() {
        let country = this.data.country && this.data.country.trim();
        if (country = country && _.findWhere(this.countries, { name: country }))
            this.data.countryId = country['code'];
        this.onCountryChange({ value: this.data.countryId });
    }

    onCountryChange(event) {
        const countryCode = event.value;
        if (countryCode) {
            this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        }
        this.statesService.updateState(countryCode, this.data.stateId, this.data.stateName);
    }

    onAddressChanged(address: Address) {
        this.data.zip = GooglePlaceService.getZipCode(address.address_components);
        this.data.address1 = GooglePlaceService.getStreet(address.address_components);
        this.data.streetNumber = GooglePlaceService.getStreetNumber(address.address_components);
        this.data.stateId = GooglePlaceService.getStateCode(address.address_components);
        this.data.stateName = GooglePlaceService.getStateName(address.address_components);
        this.data.countryId = GooglePlaceService.getCountryCode(address.address_components);
        this.statesService.updateState(this.data.countryId, this.data.stateId, this.data.stateName);
        this.data.city = GooglePlaceService.getCity(address.address_components);
        this.address = this.addressInput.nativeElement.value = (this.data.streetNumber
            ? this.data.streetNumber + ' ' + this.data.address1
            : this.data.address1) || '';
    }

    getCountryStates(): Observable<CountryStateDto[]> {
        return this.store$.pipe(
            select(StatesStoreSelectors.getCountryStates, { countryCode: this.data.countryId })
        );
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

    onSave(phoneComponent) {
        this.data.address1 = this.address;
        if (this.validator.validate().isValid &&
            this.validateAddress(this.data) &&
            phoneComponent.isValid()
        )
            this.dialogRef.close(true);
    }

    validateAddress(data) {
        return data.address1 ||
            data.countryId ||
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

    mouseUp() {
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

    onFieldFocus(event) {
        event.component.option('isValid', true);
    }

    onCustomItemCreating(event, field) {
        if (event.text)
            return event.customItem = event.text;
    }

    selectPhoneNumber(event, tooltipComponent, phoneComponent) {
        this.data.phone = event.itemData;
        tooltipComponent.instance.hide();
        phoneComponent.intPhoneNumber.writeValue(event.itemData);
        phoneComponent.intPhoneNumber.updateValue();
    }

    onAddressSelected(event, component) {
        let address = this.contactDetails.addresses[event.itemIndex];
        this.data.country = address.countryName;
        this.data.stateId = address.stateId;
        this.data.stateName = address.stateName;
        this.data.city = address.city;
        this.data.zip = address.zip;
        this.data.address1 = address.streetAddress;
        this.address = address.streetAddress;
        setTimeout(() => this.checkCountryByName());
        component.instance.hide();
    }

    onPhoneNumberChange(phone, elm) {
        this.data.phone = phone == elm.getCountryCode() ? undefined : phone;
    }
}