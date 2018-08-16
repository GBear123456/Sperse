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
    @Input() required: boolean = true;
    @Output() phoneNumberChange: EventEmitter<string> = new EventEmitter<string>();
    @Output() onInitialized = new EventEmitter();
    @Output() onKeyUp = new EventEmitter();

    @ViewChild(PhoneNumberComponent) intPhoneNumber;
    @ViewChild('intPhoneNumberModel') model;

    errorVisible: boolean = false;

    constructor(injector: Injector) {
        super(injector, AppConsts.localization.defaultLocalizationSourceName);
    }

    isValid() {
        return this.model.valid;
    }

    setErrorMessageVisible(value) {
        this.errorVisible = value;
    }

    keyUp(event) {
        this.onKeyUp.emit(event);
    }

    focusIn(event) {
        if (!this.isValid())
            this.setErrorMessageVisible(true);
    }

    focusOut(event) {
        this.errorVisible = false;
    }

    reset() {
        this.phoneNumber = undefined;
    }

    ngOnInit() {
        if (!this.phoneNumber)
            this.phoneNumber = AppConsts.defaultCountryCode;
        this.onInitialized.emit(this);
    }

    ngAfterViewInit() {
        this.intPhoneNumber.registerOnChange((value) => { 
            this.phoneNumberChange.emit(value); 
            if (this.isValid())
                this.setErrorMessageVisible(false);
        });
    }
}
