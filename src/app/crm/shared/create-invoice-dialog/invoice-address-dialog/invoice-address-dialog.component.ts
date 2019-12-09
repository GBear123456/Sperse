/** Application imports */
import { Component, Inject, ElementRef } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AngularGooglePlaceService } from 'angular-google-place';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { GooglePlaceHelper } from '@shared/helpers/GooglePlaceHelper';
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { CountryStateDto, CountryDto, ContactServiceProxy,
    PersonOrgRelationShortInfo, ContactDetailsDto, OrganizationShortInfo } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'invoice-address-dialog',
    templateUrl: 'invoice-address-dialog.html',
    styleUrls: [
        './invoice-address-dialog.less',
        '../../../contacts/addresses/addresses.styles.less'
    ],
    host: {
        '(document:mouseup)': 'mouseUp($event)',
        '(document:mousemove)': 'mouseMove($event)'
    }
})
export class InvoiceAddressDialog {
    validator: any;
    address: any;
    movePos: any;
    states: CountryStateDto[];
    countries: CountryDto[];
    googleAutoComplete: Boolean;
    emailRegEx = AppConsts.regexPatterns.email;
    contactDetails: ContactDetailsDto = new ContactDetailsDto();
    organizations: OrganizationShortInfo[] = [];
    phones: string[] = [];
    addresses: any[] = [];

    constructor(
        private elementRef: ElementRef,
        private contactProxy: ContactServiceProxy,
        private angularGooglePlaceService: AngularGooglePlaceService,
        private store$: Store<RootStore.State>,
        public dialogRef: MatDialogRef<InvoiceAddressDialog>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        if (this.validateAddress(data)) {
            this.address =
                this.googleAutoComplete ? [
                    data.address1,
                    data.city,
                    data.stateId,
                    data.countryId
                ].join(',') : data.address1;
        }

        this.googleAutoComplete = Boolean(window['google']);
        this.contactDetailsLoad();
        this.countriesStateLoad();
    }

    contactDetailsLoad() {
        this.contactProxy.getContactDetails(this.data.contactId).subscribe((data: ContactDetailsDto) => {
            this.contactDetails = data;
            this.organizations = data.orgRelations.map((rel: PersonOrgRelationShortInfo) => {
                return rel.organization;
            });
            this.phones = data.phones.map(item => item.phoneNumber);
            this.addresses = data.addresses.map(item => {
                item['text'] = [
                    item.streetAddress,
                    item.city,
                    item.state,
                    item.country
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

    checkCountryByName(forcedChange = true) {
        let country = this.data.country && this.data.country.trim();
        if (country = country && _.findWhere(this.countries, {name: country}))
            this.data.countryId = country['code'];
        if ((country || forcedChange) && this.data.countryId)
            this.onCountryChange({value: this.data.countryId});
    }

    onCountryChange(event) {
        const countryCode = event.value;
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, {countryCode: countryCode}))
            .subscribe(result => {
                this.states = result;
                let state = this.data.state;
                if (state = state && _.findWhere(result, {name: state}))
                    this.data.stateId = state['code'];
            });
    }

    onAddressChanged(event) {
        let number = this.angularGooglePlaceService.street_number(event.address_components);
        let street = this.angularGooglePlaceService.street(event.address_components);
        this.data.stateId = GooglePlaceHelper.getStateCode(event.address_components);
        this.data.countryId = GooglePlaceHelper.getCountryCode(event.address_components);
        this.address = number ? (number + ' ' + street) : street;
    }

    onSave(event) {
        this.data.address1 = this.address;

        if (this.validator.validate().isValid && this.validateAddress(this.data))
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

    onFieldFocus(event) {
        event.component.option('isValid', true);
    }

    onCustomItemCreating(event, field) {
        if (event.text)
            return event.customItem = {[field]: event.text};
    }

    selectPhoneNumber(event, component) {
        this.data.phone = event.itemData;
        component.instance.hide();
    }

    onAddressSelected(event, component) {
        let address = this.contactDetails.addresses[event.itemIndex];
        this.data.country = address.country;
        this.data.state = address.state;
        this.data.city = address.city;
        this.data.zip = address.zip;
        this.data.address1 = address.streetAddress;
        setTimeout(() => this.checkCountryByName(false));
        component.instance.hide();
    }
}