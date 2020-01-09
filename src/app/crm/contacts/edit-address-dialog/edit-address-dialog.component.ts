/** Application imports */
import { Component, Inject, ElementRef } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as _ from 'underscore';
import { AngularGooglePlaceService } from 'angular-google-place';

/** Application imports */
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AppConsts } from '@shared/AppConsts';
import { CountryStateDto, CountryDto } from '@shared/service-proxies/service-proxies';
import { AddressUsageTypesStoreActions, AddressUsageTypesStoreSelectors } from '@app/store';
import { ContactsService } from '../contacts.service';
import { GooglePlaceHelper } from '@shared/helpers/GooglePlaceHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'edit-address-dialog',
    templateUrl: 'edit-address-dialog.html',
    styleUrls: ['edit-address-dialog.less'],
    host: {
        '(document:mouseup)': 'mouseUp($event)',
        '(document:mousemove)': 'mouseMove($event)'
    },
    providers: [ GooglePlaceHelper ]
})
export class EditAddressDialog {
    types: any[] = [];
    validator: any;
    action: string;
    address: any;
    movePos: any;
    isEditAllowed = false;
    states: CountryStateDto[];
    countries: CountryDto[];
    state: string;
    googleAutoComplete: Boolean;
    localization = AppConsts.localization;

    constructor(
        private elementRef: ElementRef,
        private contactsService: ContactsService,
        private angularGooglePlaceService: AngularGooglePlaceService,
        private store$: Store<RootStore.State>,
        private googlePlaceHelper: GooglePlaceHelper,
        public dialogRef: MatDialogRef<EditAddressDialog>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.isEditAllowed = this.contactsService.checkCGPermission(this.data.groupId);
        if (this.validateAddress(data)) {
            this.action = 'Edit';
            this.address =
                this.googleAutoComplete ? [
                    data.streetAddress,
                    data.city,
                    data.state,
                    data.country
                ].join(',') : data.streetAddress;
        } else
            this.action = 'Create';

        this.googleAutoComplete = Boolean(window['google']);

        this.addressTypesLoad();
        this.countriesStateLoad();
    }

    countriesStateLoad(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe(result => {
            this.countries = result;
            if (this.data.country)
                this.onCountryChange({
                    value: this.data.country
                });
        });
    }

    onCountryChange(event) {
        const countryCode = _.findWhere(this.countries, {name: event.value})['code'];
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode }))
            .subscribe(result => {
                this.states = result;
            });
    }

    onAddressChanged(event) {
        let number = this.angularGooglePlaceService.street_number(event.address_components);
        let street = this.angularGooglePlaceService.street(event.address_components);
        this.data.state = this.googlePlaceHelper.getState(event.address_components);
        this.data.city = this.googlePlaceHelper.getCity(event.address_components);
        this.address = number ? (number + ' ' + street) : street;
    }

    updateCountryInfo(countryName: string) {
        countryName == 'United States' ?
            this.data.country = AppConsts.defaultCountryName :
            this.data.country = countryName;
    }

    addressTypesLoad() {
        this.store$.dispatch(new AddressUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(select(AddressUsageTypesStoreSelectors.getAddressUsageTypes))
            .subscribe(result => {
                if (result)
                    this.types = result.filter((type) => {
                        return type['isCompany'] == this.data.isCompany;
                    });
            });
    }

    onSave(event) {
        this.data.streetAddress = this.address;

        if (this.validator.validate().isValid && this.validateAddress(this.data)) {
            if (this.data.country)
                this.data.countryId = _.findWhere(this.countries, {name: this.data.country})['code'];
            if (this.data.state) {
                let state = _.findWhere(this.states, {name: this.data.state});
                if (state)
                    this.data.stateId = state['code'];
            }
            this.dialogRef.close(true);
        }
    }

    validateAddress(data) {
        return data.streetAddress ||
            data.country ||
            data.state ||
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
}
