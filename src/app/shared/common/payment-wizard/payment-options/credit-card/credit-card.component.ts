import { Component, OnInit, Injector, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, Validators, NgForm } from '@angular/forms';

import { CreditCardValidator } from 'angular-cc-library';
import * as _ from 'underscore';

import { AppComponentBase } from '@shared/common/app-component-base';
import { CountryStateDto, CountryServiceProxy } from '@shared/service-proxies/service-proxies';
import { BankCardDataModel } from '@app/shared/common/payment-wizard/models/bank-card-data.model';

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
    countries = [];
    states: CountryStateDto[];
    address = {
        state: null,
        country: null,
        address: null
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
        billingStateCode: [''],
        billingState: [''],
        billingCountryCode: ['', [<any>Validators.required]],
        billingCountry: [''],
    });

    constructor(
        injector: Injector,
        private formBuilder: FormBuilder,
        private _countryService: CountryServiceProxy
    ) {
        super(injector);
        this.creditCardData.get('billingStateCode').disable();
        this.googleAutoComplete = Boolean(window['google']);
        this.getCountries();
    }

    ngOnInit() {}

    submit(data: NgForm) {
        if (this.creditCardData.valid) {
            this.onSubmit.next(data.value);
        }
    }

    onKeyPress(e) {
        if (e.which < 48 || e.which > 57) {
            e.preventDefault();
        }
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
                        this.creditCardData.get('billingStateCode').disable();
                    } else {
                        this.creditCardData.get('billingStateCode').enable();
                    }
                });
        }
    }
}
