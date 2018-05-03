import { Component, OnInit, ViewChild, Injector, Output, EventEmitter, ElementRef, OnDestroy } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { CustomersServiceProxy, CreateCustomerInput, ContactAddressServiceProxy,  CreateContactEmailInput, 
    CreateContactPhoneInput, ContactPhotoServiceProxy, CreateContactPhotoInput, CreateContactAddressInput, ContactEmailServiceProxy,
    ContactPhoneServiceProxy, CountryServiceProxy, CountryStateDto, CountryDto, SimilarCustomerOutput, ContactPhotoInput, 
    PersonInfoDto, LeadServiceProxy, CreateLeadInput} from '@shared/service-proxies/service-proxies';

import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { ContactTypes } from '@shared/AppEnums';
import { DxTextBoxComponent, DxContextMenuComponent, DxValidatorComponent, DxValidationSummaryComponent, DxButtonComponent } from 'devextreme-angular';
import { Router, ActivatedRoute } from '@angular/router';

import { MatDialog } from '@angular/material';
import { ModalDialogComponent } from 'shared/common/dialogs/modal/modal-dialog.component';
import { UploadPhotoDialogComponent } from '../upload-photo-dialog/upload-photo-dialog.component';
import { SimilarCustomersDialogComponent } from '../similar-customers-dialog/similar-customers-dialog.component';
import { TagsListComponent } from '../tags-list/tags-list.component';
import { ListsListComponent } from '../lists-list/lists-list.component';
import { UserAssignmentComponent } from '../user-assignment-list/user-assignment-list.component';

import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';

@Component({
    templateUrl: 'create-client-dialog.component.html',
    styleUrls: ['create-client-dialog.component.less'],
    providers: [ CustomersServiceProxy, ContactPhotoServiceProxy, LeadServiceProxy ]
})
export class CreateClientDialogComponent extends ModalDialogComponent implements OnInit, OnDestroy {
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: ListsListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;
    contactTypes = [ContactTypes.Personal, ContactTypes.Business];

    person = new PersonInfoDto();

    emailsPersonal: any;
    emailsBusiness: any;
    phonesPersonal: any;
    phonesBusiness: any;

    private readonly SAVE_OPTION_DEFAULT   = 1;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';
    
    saveButtonId: string = 'saveClientOptions';
    saveContextMenuItems = [];

    masks = AppConsts.masks;
    phoneRegEx = AppConsts.regexPatterns.phone;
    emailRegEx = AppConsts.regexPatterns.email;
    urlRegEx = AppConsts.regexPatterns.url;

    company: string;
    title: string;
    website: string;
    notes = {};

    addressTypePersonalDefault = 'H';
    addressTypeBusinessDefault = 'W';
    addressTypes: any = [];
    addressValidator: any;
    emailValidator: any;
    phoneValidator: any;
    websiteValidator: any;

    emails = {};
    emailTypePersonalDefault = 'P';
    emailTypeBusinessDefault = 'W';
    emailType = {
        personal: this.emailTypePersonalDefault,
        business: this.emailTypeBusinessDefault
    };
    phones = {};
    phoneTypePersonalDefault = 'M';
    phoneTypeBusinessDefault = 'W';
    phoneType = {
        personal: this.phoneTypePersonalDefault,
        business: this.phoneTypeBusinessDefault
    };
    phoneExtension = {};
    phoneTypes: any = [];
    emailTypes: any = [];
    states: any;
    countries: any;

    googleAutoComplete: boolean;
    photoOriginalData: string;
    photoThumbnailData: string;

    addButtonVisible = {
        personal: {},
        business: {}        
    };
    clearButtonVisible = {
        personal: {},
        business: {}        
    }

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
    toolbarConfig = [];

    private namePattern = AppConsts.regexPatterns.name;
    private validationError: string;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _cacheService: CacheService,
        private _countryService: CountryServiceProxy,
        private _customersService: CustomersServiceProxy,
        private _photoUploadService: ContactPhotoServiceProxy,
        private _contactPhoneService: ContactPhoneServiceProxy,
        private _contactEmailService: ContactEmailServiceProxy,
        private _contactAddressService: ContactAddressServiceProxy,
        private _leadService: LeadServiceProxy,
        private _router: Router,
        private _nameParser: NameParserService
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.googleAutoComplete = Boolean(window['google']);
        this._cacheService = this._cacheService.useStorage(0);

        this.saveContextMenuItems = [
            {text: this.l('SaveAndAddNew'), selected: false}, 
            {text: this.l('SaveAndExtend'), selected: false},
            {text: this.l('SaveAndClose'), selected: false}
        ];

        this.countriesStateLoad();
        this.addressTypesLoad();
        this.phoneTypesLoad();
        this.emailTypesLoad();
        this.initToolbarConfig();
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'after', items: [
                    {
                        name: 'assign',
                        action: this.toggleUserAssignmen.bind(this),
                        options: {
                            accessKey: 'ClientAssign'
                        }
                    },
                    this.data.isInLeadMode ? { 
                        widget: 'dxDropDownMenu',
                        disabled: true,
                        name: 'stage', 
                        options: {
                            hint: this.l('Stage'),
                            items: []
                        }
                    }: {
                        name: 'status',
                        widget: 'dxDropDownMenu',
                        disabled: true,
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
                        name: 'discard',
                        action: this.resetFullDialog.bind(this)
                    }
                ]
            },
            {
                location: 'after',
                areItemsDependent: true,
                items: [
                    {
                        name: 'listsSmall',
                        action: this.toggleLists.bind(this),
                        options: {
                            accessKey: 'ClientLists'
                        }
                    },
                    {
                        name: 'tagsSmall',
                        action: this.toggleTags.bind(this),
                        options: {
                            accessKey: 'ClientTags'
                        }
                    }
                ]
            }
        ];
    }

    saveOptionsInit() {
        let cacheKey = this.getCacheKey(this.SAVE_OPTION_CACHE_KEY),
            selectedIndex = this.SAVE_OPTION_DEFAULT;
        if (this._cacheService.exists(cacheKey))
            selectedIndex = this._cacheService.get(cacheKey);
        this.saveContextMenuItems[selectedIndex].selected = true;
        this.data.buttons[0].title = this.saveContextMenuItems[selectedIndex].text;
    }

    updateSaveOption(option) {
        this.data.buttons[0].title = option.text;
        this._cacheService.set(this.getCacheKey(this.SAVE_OPTION_CACHE_KEY), 
            this.saveContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
    }

    ngOnInit() {
        super.ngOnInit();

        this.data.editTitle = true;
        this.data.titleClearButton = true;
        this.data.placeholder = this.l('Contact.FullName');
        this.data.buttons = [{
            id: this.saveButtonId,
            title: this.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this)
        }];
        this.saveOptionsInit();
    }

    getCountryCode(name) {
        let country = _.findWhere(this.countries, {name: name});
        return country && country['code'];
    }

    getStateCode(name) {
        let state = _.findWhere(this.states, {name: name});
        return state && state['code'];
    }

    private createEntity(): void {
        let assignedUserId = this.userAssignmentComponent.selectedItemKey;
        let lists = this.listsComponent.selectedItems;
        let tags = this.tagsComponent.selectedItems;
        let dataObj = {
            firstName: this.person.firstName,
            middleName: this.person.middleName,
            lastName: this.person.lastName,
            namePrefix: this.person.namePrefix,
            nameSuffix: this.person.nameSuffix,
            nickName: this.person.nickName,
            emailAddresses: this.getEmailContactInput(ContactTypes.Personal),
            phoneNumbers: this.getPhoneContactInput(ContactTypes.Personal),
            address: this.getAddressContactInput(ContactTypes.Personal),
            companyName: this.company,
            title: this.title,
            organizationWebSite: this.website,
            organizationEmailAddresses: this.getEmailContactInput(ContactTypes.Business),
            organizationPhoneNumbers: this.getPhoneContactInput(ContactTypes.Business),
            organizationAddress: this.getAddressContactInput(ContactTypes.Business),
            photo: this.photoOriginalData ? ContactPhotoInput.fromJS({
                originalImage: this.getBase64(this.photoOriginalData),
                thumbnail: this.getBase64(this.photoThumbnailData)
            }) : null,
            note: this.notes[ContactTypes.Personal],
            organizationNote: this.notes[ContactTypes.Business],
            assignedUserId: assignedUserId,
            lists: lists,
            tags: tags
        };
        
        let saveButton: any = document.getElementById(this.saveButtonId);
        saveButton.disabled = true;
        if (this.data.isInLeadMode)
            this._leadService.createLead(CreateLeadInput.fromJS(dataObj))
                .finally(() => { saveButton.disabled = false; })
                .subscribe(result => this.afterSave(result.customerId, result.id));
        else
            this._customersService.createCustomer(CreateCustomerInput.fromJS(dataObj))
                .finally(() => { saveButton.disabled = false; })
                .subscribe(result => this.afterSave(result.id));
    }

    private afterSave(customerId: number, leadId?: number): void
    {
        if (this.saveContextMenuItems[0].selected) {
            this.data.refreshParent();
            this.resetFullDialog();
            this.notify.info(this.l('SavedSuccessfully'));
        } else if (this.saveContextMenuItems[1].selected)
            this.redirectToClientDetails(customerId, leadId);
        else {
            this.data.refreshParent();
            this.close();
        }
    }

    save(event?): void {     
        if (event && event.offsetX > 195)
            return this.saveContextComponent
                .instance.option('visible', true);

        if (!this.addressValidator.validate().isValid)
            return ;
        
        if (!this.person.firstName || !this.person.lastName) {
            this.data.isTitleValid = false;
            return this.notify.error(this.l('FullNameIsRequired'));
        }

        this.checkAddContactByField('emails');
        this.checkAddContactByField('phones');

        if (!this.validateBusinessTab())
            return ;

        this.createEntity();
    }

    validateBusinessTab() {
        if ((this.contacts.emails.business.length 
            || this.contacts.phones.business.length 
            || this.contacts.addresses.business.streetAddress 
            || this.contacts.addresses.business.streetNumber
          ) && !this.company
        )
            return this.notify.error(this.l('CompanyNameIsRequired'));

        if (!this.websiteValidator.validate().isValid)
            return false;

        return true;
    }

    checkAddContactByField(field) {
        _.mapObject(this.addButtonVisible, 
            (obj, type) => {
              obj[field] && this.addContact(field, type);
            }
        );
    }

    getBase64(data) {
        let prefix = ';base64,';
        return data && data.slice(data.indexOf(prefix) + prefix.length);
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
        let streetAddressParts = [];
          if (address.streetAddress)
              streetAddressParts.push(address.streetAddress);
          if (address.streetNumber)
              streetAddressParts.push(address.streetNumber);
        let streetAddress = streetAddressParts.join(' ');
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

    redirectToClientDetails(id: number, leadId?: number) {
        let path = `app/crm/client/${id}/${this.data.isInLeadMode ? `lead/${leadId}/` : ''}contact-information`;
        this._router.navigate([path], { queryParams: { referrer: this._router.url } });
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

    toggleTags() {
        this.tagsComponent.toggle();
    }

    toggleLists() {
        this.listsComponent.toggle();
    }

    toggleUserAssignmen() {
        this.userAssignmentComponent.toggle();
    }

    checkSimilarCustomers() {
        this._customersService.getSimilarCustomers(
            this.person.namePrefix,
            this.person.firstName,
            this.person.middleName,
            this.person.lastName,
            this.person.nameSuffix,
            this.company,
            this.getCurrentEmails(),
            this.getCurrentPhones(),
            null, null, null, null, null)
        .subscribe(response => {
            if (response)
                this.similarCustomers = response;
        });
    }

   getCurrentEmails() {
        let emails = [];
        _.mapObject(this.contacts.emails, (fields, type) => {
            emails = emails.concat(fields.map(obj => obj.email));
        });

        _.mapObject(this.emails, (value, type) => {
            value && emails.push(value);
        });
        
        return emails;
    }

    getCurrentPhones() {
        let phones = [];
        _.mapObject(this.contacts.phones, (fields, type) => {
            phones = phones.concat(fields.map(obj => obj.number));
        });

        _.mapObject(this.phones, (value, type) => {
            value && phones.push(value);
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

    setDefaultTypeValue(obj, list, field = null) {
        if (list.length)
            this.contactTypes.forEach((type) => {
                if (field)
                    obj[type][field] = obj[type][field] || list[0].id;
                else
                    obj[type] = obj[type] || list[0].id;
            });
    }

    addressTypesLoad() {
        this._contactAddressService.getAddressUsageTypes().subscribe(result => {
            this.addressTypes = result.items;
            this.contacts.addresses.personal.addressType = this.addressTypePersonalDefault;
            this.contacts.addresses.business.addressType = this.addressTypeBusinessDefault;
        });
    }

    phoneTypesLoad() {
        this._contactPhoneService.getPhoneUsageTypes().subscribe(result => {
            this.phoneTypes = result.items;
            this.setDefaultTypeValue(this.phoneType, result.items);
        });
    }

    emailTypesLoad() {
        this._contactEmailService.getEmailUsageTypes().subscribe(result => {
            this.emailTypes = result.items;
            this.setDefaultTypeValue(this.emailType, result.items);
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

        this.checkSimilarCustomers();
    }

    getValidateFieldValue(field, type) {
        let value;
        if (field == 'emails')
            value = {
                type: this.emailType[type],
                email: this.emails[type]
            };
        else if (field == 'phones') {
            value = { 
                type: this.phoneType[type],
                number: this.phones[type],
                ext: this.phoneExtension[type]
            };
            this.phoneExtension[type] = undefined;
        }

        this.resetComponent(this[field + this.capitalize(type)]);        
        this.addButtonVisible[type][field] = false;

        return value;
    }

    resetComponent(component) {
        component.reset();
        component.option('isValid', true);
    }

    validateEmailAddress(value): boolean {
        return this.emailRegEx.test(value);
    }

    validatePhoneNumber(value): boolean {
        return this.phoneRegEx.test(value);
    }

    onTypeChanged($event, field, type) {
        if (type) {
            $event.element.parentNode.classList
                .replace(this[field + 'Type'][type], $event.value);
            this[field + 'Type'][type] = $event.value;
        }
    }

    initValidationGroup($event, validator) {
        this[validator] = $event.component;
    }

    onKeyUp($event, field, type, data) {
        let value = this.getInputElementValue($event);
        this.addButtonVisible[type][field] = field == 'emails' ?
            this.validateEmailAddress(value): this.validatePhoneNumber(value);

        data[type] = value;
        
        this.checkSimilarCustomers();
        this.clearButtonVisible[type][field] = value 
            && !this.addButtonVisible[type][field];
    }

    onCompanyKeyUp($event) {
        this.company = this.getInputElementValue($event);
        this.checkSimilarCustomers();
    }

    onCommentKeyUp($event, type) {
        this.notes[type] = $event.element.getElementsByTagName('textarea')[0].value;
    }

    setComponentToValid(field, type, reset = false) {
        let component = this[field + this.capitalize(type)];
        reset && component.reset();
        setTimeout(() => component.option('isValid', true));
    }

    showUploadPhoto($event) {
        this.dialog.open(UploadPhotoDialogComponent, {
            data: {
                source: this.photoOriginalData
            },
            hasBackdrop: true
        }).afterClosed().subscribe((result) => {
            if (result) {
                this.photoOriginalData = result.origImage;
                this.photoThumbnailData = result.thumImage;
            }
        });
        $event.stopPropagation();
    }

    onComponentInitialized($event, field, type) {
        this[field + this.capitalize(type)] = $event.component;
        $event.component.option('value', this[field][type]);
    }

    emptyInput(field, type) {
        this.setComponentToValid(field, type, true);
        this.clearButtonVisible[type][field] = false;
        this.checkSimilarCustomers();
    }

    resetFullDialog() {
        this.contactTypes.forEach((type) => {
            this.resetComponent(this['emails' + this.capitalize(type)]);
            this.resetComponent(this['phones' + this.capitalize(type)]);
            this.clearButtonVisible[type]['emails'] = false;
            this.clearButtonVisible[type]['phones'] = false;
            this.addButtonVisible[type]['emails'] = false;
            this.addButtonVisible[type]['phones'] = false;
            this.contacts.emails[type] = [];
            this.contacts.phones[type] = [];
            this.emails[type] = [];
            this.phones[type] = [];
            this.phoneExtension[type] = undefined;
            this.contacts.addresses[type] = {};
            this.notes[type] = undefined;
        });

        this.person = new PersonInfoDto();
        this.emailType.personal = this.emailTypePersonalDefault;
        this.phoneType.personal = this.phoneTypePersonalDefault;
        this.emailType.business = this.emailTypeBusinessDefault;
        this.phoneType.business = this.phoneTypeBusinessDefault;
        this.addressTypesLoad();
        this.data.title = undefined;
        this.data.isTitleValid = true;
        this.company = undefined;
        this.similarCustomers = [];
        this.photoOriginalData = undefined;
        this.photoThumbnailData = undefined;
        this.title = undefined;
        this.website = undefined;
        this.tagsComponent.reset();
        this.listsComponent.reset();
        this.userAssignmentComponent.reset();
    }

    onSaveOptionSelectionChanged($event) {
        let option = $event.addedItems.pop() || $event.removedItems.pop() ||
            this.saveContextMenuItems[this.SAVE_OPTION_DEFAULT];
        option.selected = true;
        $event.component.option('selectedItem', option);

        this.updateSaveOption(option);
        this.save();
    }

    onFullNameKeyUp(event) {
        this.data.title = event;
        this._nameParser.parseIntoPerson(this.data.title, this.person);
        this.checkSimilarCustomers();
    }

    ngOnDestroy(): void {
        if (this.similarCustomersDialog)
            this.similarCustomersDialog.close();
    }
}
