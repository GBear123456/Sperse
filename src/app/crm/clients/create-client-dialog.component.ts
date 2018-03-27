import { Component, OnInit, ViewChild, Injector, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { CustomersServiceProxy, CreateCustomerInput, ContactAddressServiceProxy, 
    ContactPhoneServiceProxy, CountryServiceProxy, CountryStateDto, CountryDto } from '@shared/service-proxies/service-proxies';

import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { DxTextBoxComponent, DxValidatorComponent, DxValidationSummaryComponent, DxButtonComponent } from 'devextreme-angular';
import { Router, ActivatedRoute } from '@angular/router';

import { ModalDialogComponent } from 'shared/common/dialogs/modal/modal-dialog.component';

import * as _ from 'underscore';

@Component({
    templateUrl: 'create-client-dialog.component.html',
    styleUrls: ['create-client-dialog.component.less'],
    providers: [ CustomersServiceProxy ]
})
export class CreateClientDialogComponent extends ModalDialogComponent implements OnInit {
    client: CreateCustomerInput = new CreateCustomerInput();

    masks = AppConsts.masks;

    address: any;
    city: string;
    state: string;
    zip: string;
    country: string;
    streetNumber: string;
    streetAddress: string;
    addressType: string = 'H';
    addressTypes: any = [];

    notes: string;
    profilePicture: string;
    emailAddress: string;
    phoneType: string = 'H';
    phoneNumber: string;
    phoneExtension: number;
    googleAutoComplete: boolean;
    phoneTypes: any = [];
    states: any;
    countries: any;

    contacts: any = {
        emails: [],
        phones: [],
        addresses: [],
        notes: ''
    };

    toolbarConfig = [
        {
            location: 'after', items: [
            {name: 'assign'},
            {
                name: 'status',
                widget: 'dxDropDownMenu',
                options: {
                    hint: 'Status',
                    items: [
                        {
                            action: Function(),
                            text: 'Active',
                        }, {
                            action: Function(),
                            text: 'Inactive',
                        }
                    ]
                }
            },
            {
                name: 'delete',
                action: Function()
            }
        ]
        },
        {
            location: 'after',
            areItemsDependent: true,
            items: [
                {name: 'folder'},
                {name: 'pen'}
            ]
        }
    ];

    private namePattern = AppConsts.regexPatterns.name;
    private validationError: string;

    constructor(
        injector: Injector,
        private _countryService: CountryServiceProxy,
        private _customersService: CustomersServiceProxy,
        private _contactPhoneService: ContactPhoneServiceProxy,
        private _contactAddressService: ContactAddressServiceProxy,
        private _router: Router
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.googleAutoComplete = Boolean(window['google']);

        this.countriesStateLoad();
        this.addressTypesLoad();
        this.phoneTypesLoad();
    }

    ngOnInit() {
        super.ngOnInit();

        this.data.editTitle = true;
        this.data.placeholder = this.l('Enter the client name');
        this.data.buttons = [{
            title: this.l('Save'),
            class: 'primary menu',
            action: (event) => {
                //event.target.disabled = true;
            }
        }];
    }

    save(event): void {
        if (!this.validate(event)) return;

        this._customersService.createCustomer(this.client)
            .finally(() => {  })
            .subscribe(result => {
                if (result.similarCustomerExists) {
                    abp.message.confirm(
                        'Similar customer already exists',
                        'Are you sure?',
                        (isConfirmed) => {
                            if (isConfirmed) {
                                this.client.suppressSimilarContactWarning = true;
                                this._customersService.createCustomer(this.client)
                                    .finally(() => {
                                        this.client.suppressSimilarContactWarning = false;
                                    })
                                    .subscribe(result => {
                                        this.redirectToContactInformation(result.id);
                                    });
                            }
                        }
                    );
                } else {
                    this.redirectToContactInformation(result.id);
                }
            }
        );
    }

    redirectToContactInformation(id: number) {
        this._router.navigate(['app/crm/client/' + id + '/contact-information']);
    }

    validate(event): boolean {
        if (!this.client.emailAddress && !this.client.phoneNumber) {
            this.validationError = this.l('EmailOrPhoneIsRequired');
            return false;
        } else {
            if (this.client.emailAddress && !this.validateEmailAddress()) {
                this.validationError = this.l('EmailIsNotValid');
                return false;
            }

            if (this.client.phoneNumber && !this.validatePhoneNumber()) {
                this.validationError = this.l('PhoneFormatError');
                return false;
            }

            this.validationError = null;
        }

        if (event.validationGroup.validate().isValid) {
            event.component.option('disabled', true);
            return true;
        }
    }

    validateEmailAddress(): boolean {
        let regex = AppConsts.regexPatterns.email;
        return regex.test(this.client.emailAddress);
    }

    validatePhoneNumber(): boolean {
        let regex = AppConsts.regexPatterns.phone;
        return regex.test(this.client.phoneNumber);
    }

    twoDigitsFormat(value) {
        return ('0' + value).slice(-2);
    }

    focusInput(event) {
        if (!(event.component._value && event.component._value.trim())) {
            let input = event.event.originalEvent.target;
            setTimeout(function () {
                if (input.createTextRange) {
                    let part = input.createTextRange();
                    part.move('character', 0);
                    part.select();
                } else if (input.setSelectionRange)
                    input.setSelectionRange(0, 0);

                input.focus();
            }, 100);
        }
    }

    blurInput(event) {
        if (!(event.component._value && event.component._value.trim()))
            event.component.option({ mask: '', value: '', isValid: true });
    }

    onAddressChanged(event) {
        let number = event.address_components[0]['long_name'];
        let street = event.address_components[1]['long_name'];

        this.address = number ? (number + ' ' + street) : street;
    }

    countriesStateLoad(): void {
        this._countryService.getCountries()
            .subscribe(result => {
                this.countries = result;
                if (this.country)
                    this.onCountryChange({
                        value: this.country
                    });
            });
    }

    addressTypesLoad() {
        this._contactAddressService.getAddressUsageTypes().subscribe(result => {
            this.addressTypes = result.items;
        });
    }

    phoneTypesLoad() {
        this._contactPhoneService.getPhoneUsageTypes().subscribe(result => {
            this.phoneTypes = result.items;
        });
    }

    onCountryChange(event) {
        let country = _.findWhere(this.countries, {name: event.value});
        country && this._countryService
            .getCountryStates(country['code'])
            .subscribe(result => {
                this.states = result;
            });
    }

    addContact(field) {
        this.contacts[field].push(this.getFieldValue(field));
    }

    removeContact(field, index) {
    }

    getFieldValue(field) {
        if (field == 'emails')
            return this.emailAddress;
    }

    onTypeChanged($event, field) {
        $event.element.parentNode.classList
            .replace(this[field + 'Type'], $event.value);
        this[field + 'Type'] = $event.value;
    }

    updateFieldValue($event, field) {
    }

    showUploadPhoto($event) {
    }
}
