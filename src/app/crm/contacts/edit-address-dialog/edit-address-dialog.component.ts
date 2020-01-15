/** Application imports */
import { ChangeDetectionStrategy, Component, ElementRef, Inject } from '@angular/core';

/** Third party imports */
import { select, Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularGooglePlaceService } from 'angular-google-place';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import {
    AddressUsageTypesStoreActions,
    AddressUsageTypesStoreSelectors,
    CountriesStoreActions,
    CountriesStoreSelectors
} from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AppConsts } from '@shared/AppConsts';
import { CountryDto, CountryStateDto } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { GooglePlaceService } from '@shared/common/google-place/google-place.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { StatesService } from '@root/store/states-store/states.service';

@Component({
    selector: 'edit-address-dialog',
    templateUrl: 'edit-address-dialog.html',
    styleUrls: ['edit-address-dialog.less'],
    host: {
        '(document:mouseup)': 'mouseUp($event)',
        '(document:mousemove)': 'mouseMove($event)'
    },
    providers: [ GooglePlaceService ],
    changeDetection: ChangeDetectionStrategy.OnPush
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
        private statesService: StatesService,
        private googlePlaceService: GooglePlaceService,
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
                    data.stateName,
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
        this.data.countryCode = _.findWhere(this.countries, {name: event.value})['code'];
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(this.data.countryCode));
        this.statesService.updateState(this.data.countryCode, this.data.stateId, this.data.stateName);
    }

    onAddressChanged(event) {
        let number = this.angularGooglePlaceService.street_number(event.address_components);
        let street = this.angularGooglePlaceService.street(event.address_components);
        const countryCode = this.googlePlaceService.getCountryCode(event.address_components);
        this.data.stateId = this.googlePlaceService.getStateCode(event.address_components);
        this.data.stateName = this.googlePlaceService.getStateName(event.address_components);
        this.statesService.updateState(countryCode, this.data.stateId, this.data.stateName);
        this.data.countryCode = countryCode;
        this.data.city = this.googlePlaceService.getCity(event.address_components);
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

    onSave() {
        this.data.streetAddress = this.address;
        if (this.validator.validate().isValid && this.validateAddress(this.data)) {
            if (this.data.country)
                this.data.countryId = _.findWhere(this.countries, { name: this.data.country })['code'];
            this.data.stateId = this.data.stateId && this.data.stateId.length <= 3 ? this.data.stateId : null;
            this.dialogRef.close(true);
        }
    }

    getCountryStates(): Observable<CountryStateDto[]> {
        return this.store$.pipe(
            select(StatesStoreSelectors.getCountryStates, { countryCode: this.data.countryCode }),
            map((states: CountryStateDto[]) => states || [])
        );
    }

    stateChanged(e) {
        this.store$.pipe(
            select(StatesStoreSelectors.getStateCodeFromStateName, {
                countryCode: this.data.countryCode,
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

        e.customItem = {
            code: e.text,
            name: e.text
        };
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
