import { Component, OnInit, Injector, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { CreditCardValidator } from 'angular-cc-library';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as _ from 'underscore';
import { AngularGooglePlaceService } from 'angular-google-place';

import { AppComponentBase } from '@shared/common/app-component-base';
import { CountryStateDto, CountryServiceProxy } from '@shared/service-proxies/service-proxies';
import { BankCardDataModel } from '@app/shared/common/payment-wizard/models/bank-card-data.model';

export interface Country {
    code: string;
    name: string;
}
export interface State {
    code: string;
    name: string;
}
@Component({
    selector: 'credit-card',
    templateUrl: './credit-card.component.html',
    styleUrls: ['./credit-card.component.less'],
    providers: [ CountryServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditCardComponent extends AppComponentBase implements OnInit {
    @Output() onSubmit: EventEmitter<BankCardDataModel> = new EventEmitter<BankCardDataModel>();
    googleAutoComplete: boolean;
    countryCode: string;
    states: CountryStateDto[];
    countries: Country[] = [];
    filteredCountries: Observable<Country[]>;
    billingCountryCodes: any;
    cvvMaxLength = 3;

    creditCardData = this.formBuilder.group({
        holderName: ['', [<any>Validators.required]],
        cardNumber: ['', [<any>CreditCardValidator.validateCCNumber]],
        expirationMonth: ['', [<any>Validators.required]],
        expirationYear: ['', [<any>Validators.required]],
        cvv: ['', [<any>Validators.required, <any>Validators.minLength(3), <any>Validators.maxLength(4)]],
        billingAddress: ['', [<any>Validators.required]],
        billingZip: ['', [<any>Validators.required, <any>Validators.minLength(5)]],
        billingCity: ['', [<any>Validators.required]],
        billingStateCode: ['', [<any>Validators.required]],
        billingState: ['', [<any>Validators.required]],
        billingCountryCode: ['', [<any>Validators.required]],
        billingCountry: ['', [<any>Validators.required]],
    });

    constructor(
        injector: Injector,
        private formBuilder: FormBuilder,
        private _countryService: CountryServiceProxy,
        private _angularGooglePlaceService: AngularGooglePlaceService
    ) {
        super(injector);
        this.creditCardData.get('billingStateCode').disable();
        this.googleAutoComplete = Boolean(window['google']);
        this.getCountries();
        this.filteredCountries = this.creditCardData.get('billingCountry').valueChanges
            .pipe(
                startWith<string | Country>(''),
                map(value => typeof value === 'string' ? value : value.name),
                map(name => name ? this._filterCountry(name) : this.countries.slice())
            );
    }

    ngOnInit() {}

    private _filterCountry(name: string): Country[] {
        const filterValue = name.toLowerCase();
        return this.countries.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
    }

    updateCountryInfo(countryName: string) {
        let country = _.findWhere(this.countries, { name: countryName });
        this.creditCardData.controls.billingCountry.setValue(country);
        this.creditCardData.controls.billingCountryCode.setValue(country.code);
        this.countryCode = country.code;
    }

    updateStatesInfo(stateName: string) {
        let state;
        if (this.states.length) {
            state = _.findWhere(this.states, { name: stateName });
            this.creditCardData.controls.billingState.setValue(state);
            this.creditCardData.controls.billingStateCode.setValue(state.code);
        } else {
            this.creditCardData.controls.billingState.setValue(undefined);
            this.creditCardData.controls.billingStateCode.setValue(undefined);
        }
    }

    displayName(obj): string | undefined {
        return obj ? obj.name : undefined;
    }

    setBillingAddress(event) {
        this.creditCardData.controls.billingAddress.setValue(event.name);
        let country = this._angularGooglePlaceService.country(event.address_components);
        this.updateCountryInfo(country);
        let state = this._angularGooglePlaceService.state(event.address_components);
        this.getStates(() => this.updateStatesInfo(state));
    }

    onKeyPress(e) {
        if (e.which < 48 || e.which > 57) {
            e.preventDefault();
        }
    }

    checkCreditCardNumber(event) {
        event.target.classList.contains('amex') ?
            this.cvvMaxLength = 4 :
            this.cvvMaxLength = 3;
    }

    getStates(callback: () => any): void {
        this._countryService
            .getCountryStates(this.countryCode)
            .subscribe(result => {
                this.states = result;
                if (callback) callback();
            });
    }

    getCountries(): void {
        this._countryService.getCountries()
            .subscribe(result => {
                this.countries = result;
            });
    }

    onCountryChange(event) {
        this.creditCardData.controls.billingState.setValue(undefined);
        this.countryCode = event.option.value.code;
        this._countryService
            .getCountryStates(this.countryCode)
            .subscribe(result => {
                this.states = result;
            });
    }

    submit() {
        if (this.creditCardData.valid) {
            this.onSubmit.next(this.creditCardData.getRawValue());
        }
    }
}
