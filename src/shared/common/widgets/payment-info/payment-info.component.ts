import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppComponentBase } from 'shared/common/app-component-base';
import * as _ from 'underscore';

import {
    BankCardDto,
    CountryStateDto,
    CountryServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'payment-info',
    templateUrl: './payment-info.component.html',
    styleUrls: ['./payment-info.component.less']
})
export class PaymentInfoComponent extends AppComponentBase implements OnInit {
    @Input() paymentAuthorizationRequired: boolean = true;

    private readonly INPUT_MASK = {
        creditCardNumber: "0000-0000-0000-0099",
        expirationDate: "00/0000",
        zipCode: "00000",
        cvvCode: "0009"
    }
    validationGroup: any;

    expirationDate: string;
    bankCard: BankCardDto = BankCardDto.fromJS({}); 
    states: CountryStateDto[];

    googleAutoComplete: Boolean;
    countryCode = 'US';
    public options = {
        types: ['address'],
        componentRestrictions: {
            country: this.countryCode
        }
    };

    constructor(injector: Injector,
        private _coutryService: CountryServiceProxy) {
        super(injector);

        this.googleAutoComplete = Boolean(window['google']);
        this.getStates();
    }

    ngOnInit() { }

    initValidationGroup(event) {
        this.validationGroup = event.component;
    }

    getStates(): void {
        this._coutryService
            .getCountryStates(this.countryCode)
            .subscribe(result => {
                this.states = result;
            });
    }

    onAddressChanged(event) {
        let number = event.address_components[0]['long_name'];
        let street = event.address_components[1]['long_name'];

        this.bankCard.billingAddress = number ? (number + ' ' + street) : street;
    }

    getStateCodeFromName(e) {
        let state = _.findWhere(this.states, { name: e });
        return (state && state.code) || null;
    }

    validateExpirationDate = (options) => {
        var year = parseInt(options.value.substring(2, 6)),
            month = parseInt(options.value.substring(0, 2));

        let isValid = (month < 13) && (year < ((new Date()).getFullYear() + 10))
            && (new Date(year, month)).getTime() > Date.now();

        if (isValid) {
            this.bankCard.expirationMonth = month.toString();
            this.bankCard.expirationYear = year.toString();
        }
        else {
            this.bankCard.expirationMonth = null;
            this.bankCard.expirationYear = null;
        }

        return isValid;
    }

    focusInput(event) {
        if (!(event.component._value && event.component._value.trim())) {
            var input = event.event.target;
            event.component.option({
                mask: this.INPUT_MASK[input.name],
                maskRules: { 'D': /\d?/ },
                isValid: true
            });
            setTimeout(function () {
                if (input.createTextRange) {
                    var part = input.createTextRange();
                    part.move("character", 0);
                    part.select();
                } else if (input.setSelectionRange)
                    input.setSelectionRange(0, 0);

                input.focus();
            }, 100);
        }
    }

    blurInput(event) {
        if (!(event.component._value && event.component._value.trim()))
            event.component.option({ mask: "", value: "" });
    }
}
