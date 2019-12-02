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
import { CountryStateDto, CountryDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'invoice-address-dialog',
    templateUrl: 'invoice-address-dialog.html',
    styleUrls: ['invoice-address-dialog.less'],
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

    constructor(
        private elementRef: ElementRef,
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
        this.countriesStateLoad();
    }

    countriesStateLoad(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe(result => {
            this.countries = result;
            let country = this.data.country;
            if (country = country && _.findWhere(result, {name: country}))
                this.data.countryId = this.data.country['code'];

            if (this.data.countryId)
                this.onCountryChange({
                    value: this.data.countryId
                });
        });
    }

    onCountryChange(event) {
        const countryCode = event.value;
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode }))
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
}