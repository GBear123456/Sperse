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
import { CountryStateDto } from '@shared/service-proxies/service-proxies';
import { BankCardDataModel } from '@app/shared/common/payment-wizard/models/bank-card-data.model';
import { AppConsts } from '@shared/AppConsts';
import { GooglePlaceHelper } from '@shared/helpers/GooglePlaceHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

export interface Country {
    code: string;
    name: string;
}
@Component({
    selector: 'credit-card',
    templateUrl: './credit-card.component.html',
    styleUrls: ['./credit-card.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ GooglePlaceHelper ]
})
export class CreditCardComponent implements OnInit {
    @Output() onSubmit: EventEmitter<BankCardDataModel> = new EventEmitter<BankCardDataModel>();
    googleAutoComplete: boolean;
    countryCode: string;
    states: CountryStateDto[];
    countries: Country[] = [];
    filteredCountries: Observable<Country[]>;
    filteredStates: Observable<CountryStateDto[]>;
    cvvMaxLength = 3;
    lastYearRegexItem: any;
    patterns = {
        yearPattern: `^(201[8-9]|202[0-9]|${this.lastYearRegexItem})$`
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
        private angularGooglePlaceService: AngularGooglePlaceService,
        private store$: Store<RootStore.State>,
        private googlePlaceHelper: GooglePlaceHelper,
        public ls: AppLocalizationService
    ) {
        this.creditCardData.get('billingStateCode').disable();
        this.googleAutoComplete = Boolean(window['google']);
        this.getCountries();
    }

    ngOnInit() {
        let maxExpYear = (new Date()).getFullYear() + 15;
        let stringMaxExpYear = maxExpYear.toString();
        this.lastYearRegexItem = stringMaxExpYear.slice(0, -1) + '[0-' + stringMaxExpYear[stringMaxExpYear.length - 1] + ']';
    }

    private filterCountry(name: string): Country[] {
        const filterValue = name.toLowerCase();
        return this.countries.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
    }

    private filterStates(name: string): CountryStateDto[] {
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
                    map(name => name ? this.filterStates(name) : this.states.slice())
                );

            this.countryCode = country.code;
        }
    }

    updateStatesInfo(stateName: string) {
        let state;
        if (this.states && this.states.length) {
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
        let number = this.angularGooglePlaceService.street_number(event.address_components);
        let street = this.angularGooglePlaceService.street(event.address_components);
        let concatAddress = number ? (number + ' ' + street) : street;
        this.creditCardData.controls.billingAddress.setValue(concatAddress); // event.name - short form of address
        let countryName = this.angularGooglePlaceService.country(event.address_components);
        if (countryName == 'United States')
            countryName = AppConsts.defaultCountryName;

        this.updateCountryInfo(countryName);
        let state = this.googlePlaceHelper.getState(event.address_components);
        this.getStates(() => this.updateStatesInfo(state));
        this.creditCardData.controls.billingCity.setValue(this.googlePlaceHelper.getCity(event.address_components));
    }

    checkIfNumber(e) {
        if (e.which < 48 || e.which > 57) {
            e.preventDefault();
        }
    }

    checkMonthData(e) {
        this.checkIfNumber(e);
        let digit = e.key, val = '' + digit;
        if (!e.target.value) {
            if (/^\d$/.test(val) && (val !== '0' && val !== '1')) {
                this.creditCardData.controls['expirationMonth'].setValue('0' + val);
                e.preventDefault();
            }
        } else {
            if (e.target.value === '0') {
                if (!/^[1-9]$/.test(e.key)) {
                    e.preventDefault();
                }
            } else {
                if (!/^[0-2]$/.test(e.key)) {
                    e.preventDefault();
                }
            }
        }
    }

    checkExpYear(e) {
        let typedMonth = e.target.value;
        let currentMonth = ('0' + ((new Date()).getMonth() + 1)).slice(-2);
        if (currentMonth > typedMonth)
            this.patterns.yearPattern = `^(2019|202[0-9]|${this.lastYearRegexItem})$`;
        else
            this.patterns.yearPattern = `^(201[8-9]|202[0-9]|${this.lastYearRegexItem})$`;
    }

    onYearFocus(e) {
        let currentYear =  (new Date()).getFullYear().toString().slice(0, -2);
        if (!e.target.value)
            e.target.value = currentYear;
    }

    checkCreditCardNumber(event) {
        event.target.classList.contains('amex') ?
            this.cvvMaxLength = 4 :
            this.cvvMaxLength = 3;
    }

    getStates(callback: () => any): void {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(this.countryCode));
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
                setTimeout(() => {
                    this.filteredCountries = this.creditCardData.get('billingCountry').valueChanges
                        .pipe(
                            startWith<string | Country>(''),
                            map(value => typeof value === 'string' ? value : value.name),
                            map(name => name ? this.filterCountry(name) : this.countries.slice())
                        );
                }, 0);
            });
    }

    onCountryChange(event) {
        this.countryCode = event.option.value.code;
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(this.countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: this.countryCode }))
            .subscribe(result => {
                this.states = result;
                setTimeout(() => {
                    this.filteredStates = this.creditCardData.get('billingState').valueChanges
                        .pipe(
                            startWith<string | CountryStateDto>(''),
                            map(value => typeof value === 'string' ? value : value.name),
                            map(name => name ? this.filterStates(name) : this.states.slice())
                        );
                }, 0);
            });
    }

    submit() {
        if (this.creditCardData.valid) {
            this.onSubmit.next(this.creditCardData.getRawValue());
            this.creditCardData.controls.cvv.setValue('');
        }
    }
}
