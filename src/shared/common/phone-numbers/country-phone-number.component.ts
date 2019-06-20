import { Component, OnInit, AfterViewInit, Injector, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { PhoneNumberComponent } from '../../../node_modules/ngx-international-phone-number/src';

@Component({
    selector: 'country-phone-number',
    templateUrl: './country-phone-number.component.html',
    styleUrls: ['./country-phone-number.component.less']
})
export class CountryPhoneNumberComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @Input() phoneNumber: string;
    @Input() required = true;
    @Output() phoneNumberChange: EventEmitter<string> = new EventEmitter<string>();
    @Output() onInitialized = new EventEmitter();
    @Output() onKeyUp = new EventEmitter();

    @ViewChild(PhoneNumberComponent) intPhoneNumber;
    @ViewChild('intPhoneNumberModel') model;

    value = '';
    focused = false;

    constructor(injector: Injector) {
        super(injector);
    }

    isValid() {
        return this.isEmpty() || this.model.valid;
    }

    isEmpty() {
        let value = this.value;
        let dialCode = this.getCountryCode();
        return !value || (dialCode && value.match(
            new RegExp('^\\' + dialCode + '$')));
    }

    getCountryCode() {
        let country = this.intPhoneNumber.selectedCountry;
        return country && country.dialCode ? '+' + country.dialCode : '';
    }

    keyUp(event) {
        this.onKeyUp.emit(event);
    }

    focusIn(event) {
        this.focused = true;
    }

    focusOut(event) {
        this.focused = false;
    }

    reset() {
        this.phoneNumber = AppConsts.defaultCountryCode;
        this.model.control.markAsPristine();
        this.model.control.markAsUntouched();
    }

    ngOnInit() {
        if (!this.phoneNumber)
            this.phoneNumber = AppConsts.defaultCountryCode;
        this.onInitialized.emit(this);
    }

    ngAfterViewInit() {
        this.intPhoneNumber.registerOnChange((value) => {
            this.phoneNumberChange.emit(this.value = value);
        });
        if (this.phoneNumber !== AppConsts.defaultCountryCode) {
            setTimeout(() => {
                this.intPhoneNumber.writeValue(this.phoneNumber);
                this.intPhoneNumber.updateValue();
            });
        }
    }
}
