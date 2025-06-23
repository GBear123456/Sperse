/** Core imports */
import { Component, OnInit, AfterViewInit, Input, ViewChild, Output, EventEmitter } from '@angular/core';

/** Third party imports */
import { PhoneNumberComponent } from '@root/node_modules/ngx-international-phone-number/src';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'country-phone-number',
    templateUrl: './country-phone-number.component.html',
    styleUrls: ['./country-phone-number.component.less']
})
export class CountryPhoneNumberComponent implements OnInit, AfterViewInit {
    @ViewChild(PhoneNumberComponent, { static: true }) intPhoneNumber;
    @ViewChild('intPhoneNumberModel', { static: true }) model;
    @Input() phoneNumber: string;
    @Input() required = true;
    @Input() disabled = false;
    @Input() defaultCountry;
    @Output() phoneNumberChange: EventEmitter<string> = new EventEmitter<string>();
    @Output() phoneCountryChange = new EventEmitter();
    @Output() onInitialized = new EventEmitter();
    @Output() onKeyUp = new EventEmitter();
    @Output() onDropDownHover = new EventEmitter<boolean>();

    value = '';
    focused = false;

    constructor(
        public ls: AppLocalizationService
    ) {
        this.defaultCountry = AppConsts.defaultCountryCode.toLowerCase();
    }

    ngOnInit() {
        if (!this.phoneNumber)
            this.phoneNumber = AppConsts.defaultCountryPhoneCode;
    }

    ngAfterViewInit() {
        this.onInitialized.emit(this);
        this.intPhoneNumber.registerOnChange((value) => {
            this.phoneNumberChange.emit(this.value = value);
            this.phoneCountryChange.emit(this.intPhoneNumber.selectedCountry);
        });
        if (this.phoneNumber !== AppConsts.defaultCountryPhoneCode) {
            setTimeout(() => {
                this.intPhoneNumber.writeValue(this.phoneNumber);
                this.intPhoneNumber.updateValue();
            });
        }
    }

    isValid() {
        return this.disabled || this.isEmpty() || this.model.valid;
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

    focusIn() {
        this.focused = true;
    }

    focusOut() {
        this.focused = false;
    }

    dropDownHover($event) {
        this.onDropDownHover.emit($event);
    }

    reset() {
        this.phoneNumber = AppConsts.defaultCountryPhoneCode;
        this.model.control.markAsPristine();
        this.model.control.markAsUntouched();
    }
}
