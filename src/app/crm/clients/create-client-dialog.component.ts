import { Component, OnInit, ViewChild, Injector, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { CustomersServiceProxy, CreateCustomerInput, ContactAddressServiceProxy,  CreateContactEmailInput, CreateContactPhoneInput,
    CreateContactAddressInput, ContactPhoneServiceProxy, CountryServiceProxy, CountryStateDto, CountryDto } from '@shared/service-proxies/service-proxies';

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
    @ViewChild('emailComponent') emailComponent: DxTextBoxComponent;
    @ViewChild('phoneComponent') phoneComponent: DxTextBoxComponent;

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
    addressValidator: any;

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
            action: this.save.bind(this)
        }];
    }

    getCountryCode(name) {
        return _.findWhere(this.countries, {name: name})['code'];
    }

    getStateCode(name) {
        return _.findWhere(this.states, {name: name})['code'];
    }

    save(event): void {
        let nameParts = this.data.title && 
            this.data.title.split(' ');
        if (!nameParts || nameParts.length < 2) {
            this.data.isTitleValid = false;
            return this.notify.error(this.l('Client first name and last name is required'));
        }
//      this.client.namePrefix: string;
//      this.client.middleName: string;
//      this.client.nameSuffix: string;
//      this.client.organizationUnitId: number;

        this._customersService.createCustomer(
            CreateCustomerInput.fromJS({
                firstName: nameParts[0],
                lastName: nameParts.slice(1).join(' '),
                emailAddresses: this.contacts.emails.map((val) => {
                    return {
                        emailAddress: val,
                        isActive: true
                    } as CreateContactEmailInput;
                }),
                phoneNumbers: this.contacts.phones.map((val) => {
                    return {
                        phoneNumber: val.number,
                        phoneExtension: val.ext,
                        isActive: true,
                        usageTypeId: val.type      
                    } as CreateContactPhoneInput;
                }),
                address: {
                    streetAddress: this.streetNumber + 
                        ' ' + this.streetAddress,
                    city: this.city,
                    stateId: this.getStateCode(this.state),
                    zip: this.zip,
                    countryId: this.getCountryCode(this.country),
                    isActive: true,
                    comment: this.notes,
                    usageTypeId: this.addressType
                } as CreateContactAddressInput;
            })
        ).finally(() => {  })
            .subscribe(result => {
                if (result.similarCustomerExists) {
                    abp.message.confirm(
                        'Similar customer already exists',
                        'Are you sure?',
                        (isConfirmed) => {
                            if (isConfirmed) {
                                this._customersService.createCustomer(this.client)
                                    .subscribe(result => {
                                        this.redirectToContactInformation(result.id);
                                    });
                            }
                        }
                    );
                } else {
                    this.redirectToContactInformation(result.id);
                    this.close();
                }
            }
        );
    }

    redirectToContactInformation(id: number) {
        this._router.navigate(['app/crm/client/' + id + '/contact-information']);
        this.close();
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
        let value = this.getValidateFieldValue(field);
        if (value && this.contacts[field].every((val) => {
            return JSON.stringify(value) != JSON.stringify(val);
        }))
            this.contacts[field].push(value);
    }

    removeContact(field, index) {
        this.contacts[field].splice(index, 1);
    }

    getValidateFieldValue(field) {
        let value;
        if (field == 'emails' && this.emailComponent.instance.option('isValid')) {
            value = this.emailAddress;
        } else if (field == 'phones' && this.phoneComponent.instance.option('isValid')) {
            value = { 
                type: this.phoneType,
                number: this.phoneNumber,
                ext: this.phoneExtension
            }
        } else if (field == 'addresses' && this.addressValidator.validate().isValid) {
            value = {
              type: this.addressType,
              address: this.address,
              city: this.city,
              state: this.state,
              zip: this.zip,
              country: this.country,
              streetNumber: this.streetNumber,
              streetAddress: this.streetAddress,
              addressType: this.addressType
            }            
        }
        return value;
    }

    onTypeChanged($event, field) {
        $event.element.parentNode.classList
            .replace(this[field + 'Type'], $event.value);
        this[field + 'Type'] = $event.value;
    }

    initAddressValidationGroup($event) {
        this.addressValidator = $event.component;
    }

    showUploadPhoto($event) {
    }
}
