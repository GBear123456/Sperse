/** Core imports */
import { Component, OnInit, Injector, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { CreditCardValidator } from 'angular-cc-library';
import { AngularGooglePlaceService } from 'angular-google-place';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CountryStateDto } from '@shared/service-proxies/service-proxies';
import { BankCardDataModel } from '@app/shared/common/payment-wizard/models/bank-card-data.model';

export interface Country {
    code: string;
    name: string;
}
@Component({
    selector: 'credit-card',
    templateUrl: './credit-card.component.html',
    styleUrls: ['./credit-card.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditCardComponent extends AppComponentBase implements OnInit {
    @Output() onSubmit: EventEmitter<BankCardDataModel> = new EventEmitter<BankCardDataModel>();
    googleAutoComplete: boolean;
    countryCode: string;
    states: CountryStateDto[];
    countries: Country[] = [];
    filteredCountries: Observable<Country[]>;
    filteredStates: Observable<CountryStateDto[]>;
    billingCountryCodes: any;
    cvvMaxLength = 3;
    patterns = {
        monthPattern: '^(?:0?[1-9]|1[0-2])$',
        yearPattern: '^(2018|201[8-9]|202[0-9]|2030)$'
    };

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
        private _angularGooglePlaceService: AngularGooglePlaceService,
        private store$: Store<RootStore.State>
    ) {
        super(injector);
        this.creditCardData.get('billingStateCode').disable();
        this.googleAutoComplete = Boolean(window['google']);
        this.getCountries();
        if (this.countries) {
            this.filteredCountries = this.creditCardData.get('billingCountry').valueChanges
                .pipe(
                    startWith<string | Country>(''),
                    map(value => typeof value === 'string' ? value : value.name),
                    map(name => name ? this._filterCountry(name) : this.countries.slice())
                );
        }
    }

    ngOnInit() {}

    private _filterCountry(name: string): Country[] {
        const filterValue = name.toLowerCase();
        return this.countries.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
    }

    private _filterStates(name: string): CountryStateDto[] {
        const filterValue = name.toLowerCase();
        return this.states.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
    }

    updateCountryInfo(countryName: string) {
        let country = _.findWhere(this.countries, { name: countryName });
        this.creditCardData.controls.billingCountry.setValue(country);
        this.creditCardData.controls.billingCountryCode.setValue(country.code);
        if (this.countryCode != country.code) {
            this.filteredStates = this.creditCardData.get('billingState').valueChanges
                .pipe(
                    startWith<string | CountryStateDto>(''),
                    map(value => typeof value === 'string' ? value : value.name),
                    map(name => name ? this._filterStates(name) : this.states.slice())
                );

            this.countryCode = country.code;
        }
    }

    updateStatesInfo(stateName: string) {
        let state;
        if (this.states.length) {
            state = _.findWhere(this.states, { name: stateName });
            setTimeout(() => {
                this.creditCardData.controls.billingState.setValue(state);
                this.creditCardData.controls.billingStateCode.setValue(state.code);
            }, 100);
        } else {
            this.creditCardData.controls.billingState.setValue('');
            this.creditCardData.controls.billingStateCode.setValue('');
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

    checkIfNumber(e) {
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
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(this.countryCode))
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: this.countryCode }))
            .subscribe(result => {
                this.states = result;
                if (callback) callback();
            });
    }

    getCountries(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries))
            .subscribe(result => {
                this.countries = result;
            });
    }

    onCountryChange(event) {
        this.creditCardData.controls.billingState.setValue('');
        this.countryCode = event.option.value.code;
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(this.countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: this.countryCode }))
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
