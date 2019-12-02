/** Application imports */
import { Component, Inject, ElementRef } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AngularGooglePlaceService } from 'angular-google-place';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { CountryStateDto, CountryDto, InvoiceAddressInput } from '@shared/service-proxies/service-proxies';
import { GooglePlaceHelper } from '@shared/helpers/GooglePlaceHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'invoice-address-dialog',
    templateUrl: 'invoice-address-dialog.html',
    styleUrls: ['invoice-address-dialog.less'],
    host: {
        '(document:mouseup)': 'mouseUp($event)',
        '(document:mousemove)': 'mouseMove($event)'
    },
    providers: [ GooglePlaceHelper ]
})
export class InvoiceAddressDialog {
    validator: any;
    address: any;
    movePos: any;
    states: CountryStateDto[];
    countries: CountryDto[];
    state: string;
    country: string;
    googleAutoComplete: Boolean;
    emailRegEx = AppConsts.regexPatterns.email;

    constructor(
        private elementRef: ElementRef,
        private angularGooglePlaceService: AngularGooglePlaceService,
        private store$: Store<RootStore.State>,
        private googlePlaceHelper: GooglePlaceHelper,
        public dialogRef: MatDialogRef<InvoiceAddressDialog>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: InvoiceAddressInput
    ) {
        if (this.validateAddress(data)) {
            this.address =
                this.googleAutoComplete ? [
                    data.address1,
                    data.city,
                    this.state,
                    this.country
                ].join(',') : data.address1;
        }

        this.googleAutoComplete = Boolean(window['google']);
        this.countriesStateLoad();
    }

    countriesStateLoad(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe(result => {
            this.countries = result;
            if (this.country)
                this.onCountryChange({
                    value: this.country
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
        this.state = this.googlePlaceHelper.getState(event.address_components);
        this.address = number ? (number + ' ' + street) : street;
    }

    updateCountryInfo(countryName: string) {
        countryName == 'United States' ?
            this.country = AppConsts.defaultCountryName :
            this.country = countryName;
    }

    onSave(event) {
        this.data.address1 = this.address;

        if (this.validator.validate().isValid && this.validateAddress(this.data)) {
            if (this.country)
                this.data.countryId = _.findWhere(this.countries, {name: this.country})['code'];
            if (this.state) {
                let state = _.findWhere(this.states, {name: this.state});
                if (state)
                    this.data.stateId = state['code'];
            }
            this.dialogRef.close(true);
        }
    }

    validateAddress(data) {
        return data.address1 ||
            this.country ||
            this.state ||
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
}