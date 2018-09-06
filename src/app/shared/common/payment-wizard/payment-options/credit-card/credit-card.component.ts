import { Component, OnInit, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { FormBuilder, Validators, NgForm } from '@angular/forms';

import { CreditCardValidator } from 'angular-cc-library';
import * as _ from 'underscore';

import { AppComponentBase } from '@shared/common/app-component-base';
import { CountryStateDto, CountryServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'credit-card',
    templateUrl: './credit-card.component.html',
    styleUrls: ['./credit-card.component.less'],
    providers: [ CountryServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditCardComponent extends AppComponentBase implements OnInit {
    countryCode = 'US';
    countries = [];
    states: CountryStateDto[];
    address = {
        state: null,
        country: null,
        address: null
    };

    creditCardData = this.formBuilder.group({
        cardNumber: ['', [<any>CreditCardValidator.validateCCNumber]],
        cardExpDate: ['', [<any>CreditCardValidator.validateExpDate]],
        cvvCode: ['', [<any>Validators.required, <any>Validators.minLength(3), <any>Validators.maxLength(4)]],
        cardHolderName: [''],
        address: [''],
        city: [''],
        stateOrProvince: [{value: '', disabled: true}],
        zipCode: [''],
        country: [''],
    });

    constructor(
        injector: Injector,
        private formBuilder: FormBuilder,
        private _countryService: CountryServiceProxy
    ) {
        super(injector);
        this.getStates();
        this.getCountries();
    }

    ngOnInit() {}

    onSubmit() {
    }

    getStates(): void {
        this._countryService
            .getCountryStates(this.countryCode)
            .subscribe(result => {
                this.states = result;
            });
    }

    getCountries(): void {
        this._countryService.getCountries()
            .subscribe(result => {
                this.countries = result;
            });
    }

    onCountryChange(event) {
        let countryCode = event.value;
        if (countryCode) {
            this._countryService
                .getCountryStates(countryCode)
                .subscribe(result => {
                    this.states = result;
                    if (!this.states.length) {
                        this.creditCardData.get('stateOrProvince').disable();
                    } else {
                        this.creditCardData.get('stateOrProvince').enable();
                    }
                });
        }
    }
}
