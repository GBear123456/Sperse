import { Component, OnInit, ViewChild, Injector, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { CustomersServiceProxy, CreateCustomerInput, ContactAddressServiceProxy,  CreateContactEmailInput, 
    CreateContactPhoneInput, ContactPhotoServiceProxy, CreateContactPhotoInput, CreateContactAddressInput, ContactEmailServiceProxy,
    ContactPhoneServiceProxy, CountryServiceProxy, CountryStateDto, CountryDto, SimilarCustomerOutput, ContactPhotoInput } from '@shared/service-proxies/service-proxies';

import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { DxTextBoxComponent, DxValidatorComponent, DxValidationSummaryComponent, DxButtonComponent } from 'devextreme-angular';
import { Router, ActivatedRoute } from '@angular/router';

import { MatDialog } from '@angular/material';
import { ModalDialogComponent } from 'shared/common/dialogs/modal/modal-dialog.component';
import { UploadPhotoDialogComponent } from './details/upload-photo-dialog/upload-photo-dialog.component';
import { SimilarCustomersDialogComponent } from './details/similar-customers-dialog/similar-customers-dialog.component';

import * as _ from 'underscore';

@Component({
    templateUrl: 'create-client-dialog.component.html',
    styleUrls: ['create-client-dialog.component.less'],
    providers: [ CustomersServiceProxy, ContactPhotoServiceProxy ]
})
export class CreateClientDialogComponent extends ModalDialogComponent implements OnInit {
    emailsPersonal: any;
    emailsBusiness: any;
    phonesPersonal: any;
    phonesBusiness: any;

    masks = AppConsts.masks;
    phoneRegEx = AppConsts.regexPatterns.phone;

    company: string;

    addressTypes: any = [];
    addressValidator: any;
    emailValidator: any;
    phoneValidator: any;

    emailAddress: string;
    emailType: string;
    emailTypes: any = [];
    phoneType: string;
    phoneNumber: string;
    phoneExtension: number;
    phoneTypes: any = [];
    states: any;
    countries: any;

    googleAutoComplete: boolean;
    photoOriginalData: string;
    photoThumbnailData: string;

    showEmailAddButton = false;
    showPhoneAddButton = false;

    contactTypes = ['personal', 'business'];

    contacts: any = {
        emails: {
            personal: [],
            business: []  
        },
        phones: {
            personal: [],
            business: []  
        },
        addresses: {
            personal: {},
            business: {}
        }
    };

    similarCustomers: SimilarCustomerOutput[];
    similarCustomersDialog: any;
    contactCurrentValue: any = {
        personal: {
            email: null,
            phone: null,
            name: null,
            address: {}
        },
        business: {
            email: null,
            phone: null,
            name: null,
            address: {}
        },
    };
    phoneCurrentValue: string;
    emailCurrentValue: string;

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
        public dialog: MatDialog,
        private _countryService: CountryServiceProxy,
        private _customersService: CustomersServiceProxy,
        private _photoUploadService: ContactPhotoServiceProxy,
        private _contactPhoneService: ContactPhoneServiceProxy,
        private _contactEmailService: ContactEmailServiceProxy,
        private _contactAddressService: ContactAddressServiceProxy,
        private _router: Router
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.googleAutoComplete = Boolean(window['google']);

        this.countriesStateLoad();
        this.addressTypesLoad();
        this.phoneTypesLoad();
        this.emailTypesLoad();
    }

    ngOnInit() {
        super.ngOnInit();

        this.data.editTitle = true;
        this.data.placeholder = this.l('Contact.FullName');
        this.data.buttons = [{
            title: this.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this)
        }];
    }

    getCountryCode(name) {
        let country = _.findWhere(this.countries, {name: name});
        return country && country['code'];
    }

    getStateCode(name) {
        let state = _.findWhere(this.states, {name: name});
        return state && state['code'];
    }

    save(event): void {
        if (!this.addressValidator.validate().isValid)
            return ;

        let nameParts = this.data.title && 
            this.data.title.split(' ');
        if (!nameParts || nameParts.length < 2) {
            this.data.isTitleValid = false;
            return this.notify.error(this.l('FullNameIsRequired'));
        }

        this._customersService.createCustomer(
            CreateCustomerInput.fromJS({
                firstName: nameParts[0],
                lastName: nameParts.slice(1).join(' '),
                emailAddresses: this.getEmailContactInput('personal'),
                phoneNumbers: this.getPhoneContactInput('personal'), 
                address: this.getAddressContactInput('personal'), 
                companyName: this.company,
                organizationEmailAddresses: this.getEmailContactInput('business'),
                organizationPhoneNumbers: this.getPhoneContactInput('business'),
                organizationAddress: this.getAddressContactInput('business'),
                photo: ContactPhotoInput.fromJS({
                    originalImage: this.getBase64(this.photoOriginalData),
                    thumbnail: this.getBase64(this.photoThumbnailData)
                })
            })
        ).finally(() => {  })
            .subscribe(result => {
                this.redirectToContactInformation(result.id);
            }
        );
    }

    getBase64(data) {
        let prefix = ';base64,';
        return data.slice(data.indexOf(prefix) + prefix.length);
    }

    getEmailContactInput(type) {
        return this.contacts.emails[type].map((val) => {
            return {
                emailAddress: val.email,
                usageTypeId: val.type,
                isActive: true
            } as CreateContactEmailInput;
        });
    }

    getPhoneContactInput(type) {
        return this.contacts.phones[type].map((val) => {
            return {
                phoneNumber: val.number,
                phoneExtension: val.ext,
                isActive: true,
                usageTypeId: val.type      
            } as CreateContactPhoneInput;
        });
    }

    getAddressContactInput(type) {
        let address = this.contacts.addresses[type];
        let streetAddress = !address.streetNumber &&
          !address.streetAddress ? undefined: 
          address.streetNumber + ' ' + address.streetAddress;
        return streetAddress ? {
            streetAddress: streetAddress,
            city: address.city,
            stateId: this.getStateCode(address.state),
            zip: address.zip,
            countryId: this.getCountryCode(address.country),
            isActive: true,
            comment: address.comment,
            usageTypeId: address.addressType
        } as CreateContactAddressInput: undefined;
    }

    redirectToContactInformation(id: number) {
        this._router.navigate(['app/crm/client/' + id + '/contact-information']);
        this.close();
    }

    showSimilarCustomers(event) {
        if (this.similarCustomersDialog)
            this.similarCustomersDialog.close();

        this.similarCustomersDialog = this.dialog.open(SimilarCustomersDialogComponent, {
          data: {
              similarCustomers: this.similarCustomers,
              componentRef: this
          },
          hasBackdrop: false,
          position: this.getDialogPossition(event, 300)
        });
        event.stopPropagation();
    }

    getDialogPossition(event, shiftX) {
        return this.calculateDialogPosition(event, event.target.closest('div'), shiftX, -12);
    }

    checkSimilarCustomers (fieldName, type, event) {
        this.contactCurrentValue[type][fieldName] = this.getInputElementValue(event);
        this.checkSimilarCustomersInternal();
    }

    checkSimilarCustomersInternal () {
        let emails = this.getCurrentEmails();
        let phones = this.getCurrentPhones();
        let companyName = this.contactCurrentValue.business.name;
        this._customersService.getSimilarCustomers(null, null, null, null, null, companyName, emails, phones, null, null, null, null, null)
        .subscribe(response => {
            if (response) {
                this.similarCustomers = response;
            }
        });
    }

    getCurrentEmails() {
        let emails = [];

        this.contactTypes.forEach(type => {
            this.contacts.emails[type].forEach(element => {
                emails.push(element.email);
            });

            let emailCurrentValue = this.contactCurrentValue[type].email;
            if (emailCurrentValue)
                emails.push(emailCurrentValue);
        });

        return emails;
    }

    getCurrentPhones() {
        let phones = [];

        this.contactTypes.forEach(type => {
            this.contacts.phones[type].forEach(element => {
                phones.push(element.number);
            });

            let phoneCurrentValue = this.contactCurrentValue[type].phone;
            if (phoneCurrentValue)
                phones.push(phoneCurrentValue);
        });

        return phones;
    }

    getInputElementValue(event) {
        return event.element.getElementsByTagName('input')[0].value;
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

    onAddressChanged(event, type) {
        let number = event.address_components[0]['long_name'];
        let street = event.address_components[1]['long_name'];

        this.contacts.addresses[type].address = number ? (number + ' ' + street) : street;
    }

    countriesStateLoad(): void {
        this._countryService.getCountries()
            .subscribe(result => {
                this.countries = result;
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

    emailTypesLoad() {
        this._contactEmailService.getEmailUsageTypes().subscribe(result => {
            this.emailTypes = result.items;
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

    addContact(field, type) {
        let value = this.getValidateFieldValue(field, type);
        if (value && this.contacts[field][type].every((val) => {
            return JSON.stringify(value) != JSON.stringify(val);
        }))
            this.contacts[field][type].push(value);
    }

    removeContact(field, type, index) {
        this.contacts[field][type].splice(index, 1);

        this.checkSimilarCustomersInternal();
    }

    getValidateFieldValue(field, type) {
        let value;
        if (field == 'emails') {
            value = {
                type: this.emailType,
                email: this.emailAddress
            };
            this.showEmailAddButton = false;
            this.contactCurrentValue[type].email = null;
        } else if (field == 'phones') {
            value = { 
                type: this.phoneType,
                number: this.phoneNumber,
                ext: this.phoneExtension
            };
            this.phoneExtension = undefined;
            this.showPhoneAddButton = false;
            this.resetComponent(
                this['phones' + (type == 'personal'
                    ? 'Business': 'Personal')]);
            this.contactCurrentValue[type].phone = null;
        }
        this.resetComponent(this[field + this.capitalize(type)]);        

        return value;
    }

    resetComponent(component) {
        component.reset();
        component.option('isValid', true);
    }

    validateEmailAddress(value): boolean {
        return AppConsts.regexPatterns.email.test(value);
    }

    validatePhoneNumber(value): boolean {
        return this.phoneRegEx.test(value);
    }

    onTypeChanged($event, field) {
        $event.element.parentNode.classList
            .replace(this[field + 'Type'], $event.value);
        this[field + 'Type'] = $event.value;
    }

    initValidationGroup($event, validator) {
        this[validator] = $event.component;
    }

    onEmailKeyUp($event) {
        this.showEmailAddButton = this.validateEmailAddress(this.getInputElementValue($event));
    }

    onPhoneKeyUp($event) {
        this.showPhoneAddButton = this.validatePhoneNumber(this.getInputElementValue($event));
    }

    showUploadPhoto($event) {
        this.dialog.open(UploadPhotoDialogComponent, {
            data: {
                source: this.photoOriginalData
            },
            hasBackdrop: true
        }).afterClosed().subscribe((result) => {
            this.photoOriginalData = result.origImage;
            this.photoThumbnailData = result.thumImage;
        });
        $event.stopPropagation();
    }

    onComponentInitialized($event, field, type) {
        this[field + this.capitalize(type)] = $event.component;
    }
}
