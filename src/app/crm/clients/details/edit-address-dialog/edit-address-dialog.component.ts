/** Application imports */
import { Component, Inject, Injector, ElementRef } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import * as _ from 'underscore';

/** Application imports */
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CountryStateDto, CountryDto } from '@shared/service-proxies/service-proxies';
import { AddressUsageTypesStoreActions, AddressUsageTypesStoreSelectors } from '@app/crm/store';

@Component({
    selector: 'edit-address-dialog',
    templateUrl: 'edit-address-dialog.html',
    styleUrls: ['edit-address-dialog.less'],
    host: {
        '(document:mouseup)': 'mouseUp($event)',
        '(document:mousemove)': 'mouseMove($event)'
    }
})
export class EditAddressDialog extends AppComponentBase {
    types: any[] = [];
    validator: any;
    action: string;
    address: any;
    movePos: any;
    isEditAllowed = false;
    states: CountryStateDto[];
    countries: CountryDto[];

    googleAutoComplete: Boolean;

    constructor(injector: Injector,
                private elementRef: ElementRef,
                @Inject(MAT_DIALOG_DATA) public data: any,
                public dialogRef: MatDialogRef<EditAddressDialog>,
                private store$: Store<RootStore.State>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');
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
        let number = event.address_components[0]['long_name'];
        let street = event.address_components[1]['long_name'];

        this.address = number ? (number + ' ' + street) : street;
    }

    addressTypesLoad() {
        this.store$.dispatch(new AddressUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(select(AddressUsageTypesStoreSelectors.getAddressUsageTypes))
            .subscribe(result => {
                if (result)
                    this.types = result;
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
}
