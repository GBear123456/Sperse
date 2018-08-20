/** Core imports */
import { Component, OnInit, ViewChild, Injector, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { DxContextMenuComponent } from 'devextreme-angular';
import { CacheService } from 'ng2-cache-service';
import { finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppConsts } from '@shared/AppConsts';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { ContactTypes, CustomerType } from '@shared/AppEnums';
import { CustomersServiceProxy, CreateCustomerInput, ContactAddressServiceProxy,  CreateContactEmailInput,
CreateContactPhoneInput, ContactPhotoServiceProxy, CreateContactAddressInput, ContactEmailServiceProxy,
ContactPhoneServiceProxy, CountryServiceProxy, SimilarCustomerOutput, ContactPhotoInput,
PersonInfoDto, LeadServiceProxy, CreateLeadInput, PartnerServiceProxy, PartnerTypeServiceProxy } from '@shared/service-proxies/service-proxies';
import { ModalDialogComponent } from '@app/shared/common/dialogs/modal/modal-dialog.component';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { SimilarCustomersDialogComponent } from '../similar-customers-dialog/similar-customers-dialog.component';
import { StaticListComponent } from '../../shared/static-list/static-list.component';
import { RatingComponent } from '../rating/rating.component';
import { TagsListComponent } from '../tags-list/tags-list.component';
import { ListsListComponent } from '../lists-list/lists-list.component';
import { UserAssignmentComponent } from '../user-assignment-list/user-assignment-list.component';
import { ValidationHelper } from '@shared/helpers/ValidationHelper';
import { StringHelper } from '@shared/helpers/StringHelper';

@Component({
    templateUrl: 'create-client-dialog.component.html',
    styleUrls: ['create-client-dialog.component.less'],
    providers: [ CustomersServiceProxy, ContactPhotoServiceProxy, DialogService, LeadServiceProxy,
        PartnerServiceProxy, PartnerTypeServiceProxy ]
})
export class CreateClientDialogComponent extends ModalDialogComponent implements OnInit, OnDestroy {
    @ViewChild('stagesList') stagesComponent: StaticListComponent;
    @ViewChild('partnerTypesList') partnerTypesComponent: StaticListComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
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
    private similarCustomersTimeout: any;
    stages: any[] = [];
    stageId: number;
    partnerTypes: any[] = [];
    partnerTypeId: number;

    saveButtonId: string = 'saveClientOptions';
    saveContextMenuItems = [];

    masks = AppConsts.masks;
    phoneRegEx = AppConsts.regexPatterns.phone;
    emailRegEx = AppConsts.regexPatterns.email;
    urlRegEx = AppConsts.regexPatterns.url;
    fullNameRegEx = AppConsts.regexPatterns.fullName;

    company: string;
    title: string;
    website: string;
    notes = {};

    addressTypePersonalDefault = 'H';
    addressTypeBusinessDefault = 'W';
    addressTypes: any = [];
    addressValidators: any = [];
    emailValidators: any = [];
    phoneValidators: any = [];
    websiteValidators: any = [];

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
        private _contactPhoneService: ContactPhoneServiceProxy,
        private _contactEmailService: ContactEmailServiceProxy,
        private _contactAddressService: ContactAddressServiceProxy,
        private _leadService: LeadServiceProxy,
        private _router: Router,
        private _nameParser: NameParserService,
        private _pipelineService: PipelineService,
        private _partnerService: PartnerServiceProxy,
        private _partnerTypeService: PartnerTypeServiceProxy,
        private dialogService: DialogService
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.googleAutoComplete = Boolean(window['google']);
        this._cacheService = this._cacheService.useStorage(AppConsts.CACHE_TYPE_LOCAL_STORAGE);

        this.saveContextMenuItems = [
            {text: this.l('SaveAndAddNew'), selected: false},
            {text: this.l('SaveAndExtend'), selected: false},
            {text: this.l('SaveAndClose'), selected: false}
        ];

        this.countriesStateLoad();
        this.addressTypesLoad();
        this.phoneTypesLoad();
        this.emailTypesLoad();
        if (this.data.isInLeadMode) {
            this.leadStagesLoad();
        }
        if (this.data.customerType == CustomerType.Partner ) {
            this.partnerTypesLoad();
        }
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
                        name: 'stage',
                        action: this.toggleStages.bind(this),
                        options: {
                            accessKey: 'CreateLeadStage'
                        }
                    } : this.data.customerType == CustomerType.Client ? {
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
                    } :
                    {
                        name: 'partnerType',
                        action: this.togglePartnerTypes.bind(this),
                        options: {
                            accessKey: 'PartnerTypesList'
                        }
                    },
                    {
                        name: 'lists',
                        action: this.toggleLists.bind(this),
                        options: {
                            accessKey: 'ClientLists'
                        }
                    },
                    {
                        name: 'tags',
                        action: this.toggleTags.bind(this),
                        options: {
                            accessKey: 'ClientTags'
                        }
                    },
                    {
                        name: 'rating',
                        action: this.toggleRating.bind(this),
                        options: {
                            accessKey: 'ClientRating'
                        }
                    }
                ]
            },
            {
                location: 'after',
                areItemsDependent: true,
                items: [
                    {
                        name: 'discard',
                        action: this.resetFullDialog.bind(this)
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
        let stageId = this.stageId;
        let lists = this.listsComponent.selectedItems;
        let tags = this.tagsComponent.selectedItems;
        let ratingId = this.ratingComponent.ratingValue;
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
                originalImage: StringHelper.getBase64(this.photoOriginalData),
                thumbnail: StringHelper.getBase64(this.photoThumbnailData)
            }) : null,
            note: this.notes[ContactTypes.Personal],
            organizationNote: this.notes[ContactTypes.Business],
            assignedUserId: assignedUserId,
            stageId: stageId,
            lists: lists,
            tags: tags,
            ratingId: ratingId,
            customerTypeId: this.data.customerType,
            partnerTypeId: this.partnerTypeId
        };

        let saveButton: any = document.getElementById(this.saveButtonId);
        saveButton.disabled = true;
        if (this.data.isInLeadMode)
            this._leadService.createLead(CreateLeadInput.fromJS(dataObj))
                .pipe(finalize(() => { saveButton.disabled = false; }))
                .subscribe(result => this.afterSave(result.customerId, result.id));
        else
            this._customersService.createCustomer(CreateCustomerInput.fromJS(dataObj))
                .pipe(finalize(() => { saveButton.disabled = false; }))
                .subscribe(result => this.afterSave(result.id));
    }

    private afterSave(customerId: number, leadId?: number): void
    {
        if (this.saveContextMenuItems[0].selected) {
            this.resetFullDialog();
            this.notify.info(this.l('SavedSuccessfully'));
            this.data.refreshParent(true, this.stageId);
        } else if (this.saveContextMenuItems[1].selected) {
            this.redirectToClientDetails(customerId, leadId);
            this.data.refreshParent(true, this.stageId);
        } else {
            this.data.refreshParent(false, this.stageId);
            this.close();
        }
    }

    save(event?): void {
        if (event && event.offsetX > 195)
            return this.saveContextComponent
                .instance.option('visible', true);

        if (!this.person.firstName && !this.person.lastName && !this.company) {
            this.data.isTitleValid = false;
            return this.notify.error(this.l('NameFieldsValidationError'));
        }

        if (!ValidationHelper.ValidateName(this.data.title)) {
            this.data.isTitleValid = false;
            return this.notify.error(this.l('FullNameIsNotValid'));
        }

        if (!this.validateMultiple(this.emailValidators) ||
            !this.validateMultiple(this.phoneValidators)
        )
            return ;

        this.checkAddContactByField('emails');
        this.checkAddContactByField('phones');

        if (!this.validateBusinessTab())
            return ;

        this.createEntity();
    }

    private validateMultiple(validators): boolean{
        let result = true;
        validators.forEach((v) => { result = result && v.validate().isValid; });
        return result;
    }

    validateBusinessTab() {
        if ((this.contacts.emails.business.length
            || this.contacts.phones.business.length
            || this.contacts.addresses.business.streetAddress
            || this.contacts.addresses.business.streetNumber
          ) && !this.company
        )
            return this.notify.error(this.l('CompanyNameIsRequired'));

        return this.validateMultiple(this.websiteValidators);
    }

    checkAddContactByField(field) {
        _.mapObject(this.addButtonVisible,
            (obj, type) => {
              obj[field] && this.addContact(field, type);
            }
        );
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
        let streetAddress = streetAddressParts.length ? streetAddressParts.join(' ') : address.address;
        if (streetAddress ||
            address.city ||
            address.state ||
            address.zip ||
            address.country) {
            return {
                streetAddress: streetAddress,
                city: address.city,
                stateId: this.getStateCode(address.state),
                zip: address.zip,
                countryId: this.getCountryCode(address.country),
                isActive: true,
                comment: address.comment,
                usageTypeId: address.addressType
            } as CreateContactAddressInput;
        } else {
            return undefined;
        }
    }

    redirectToClientDetails(id: number, leadId?: number) {
        setTimeout(() => {
            let path = this.data.customerType == CustomerType.Partner ?
                `app/crm/partner/${id}/contact-information` :
                `app/crm/client/${id}/${this.data.isInLeadMode ? `lead/${leadId}/` : ''}contact-information`;
            this._router.navigate([path], { queryParams: { referrer: this._router.url.split('?').shift() } });
        }, 1000);
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
        return this.dialogService.calculateDialogPosition(event, event.target.closest('div'), shiftX, -12);
    }

    toggleStages() {
        this.stagesComponent.toggle();
    }

    togglePartnerTypes() {
        this.partnerTypesComponent.toggle();
    }

    toggleTags() {
        this.tagsComponent.toggle();
    }

    toggleLists() {
        this.listsComponent.toggle();
    }

    toggleRating() {
        this.ratingComponent.toggle();
    }

    toggleUserAssignmen() {
        this.userAssignmentComponent.toggle();
    }

    checkSimilarCustomers() {
        clearTimeout(this.similarCustomersTimeout);
        this.similarCustomersTimeout = setTimeout(() => {
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
        }, 1000);
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
        if (field == 'emails') {
            value = {
                type: this.emailType[type],
                email: this.emails[type]
            };
            this.resetComponent(this[field + this.capitalize(type)]);
        } else if (field == 'phones') {
            value = {
                type: this.phoneType[type],
                number: this.phones[type],
                ext: this.phoneExtension[type]
            };
            this.phoneExtension[type] = undefined;
            this[field + this.capitalize(type)].reset();
        }

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

    onTypeChanged($event, field, type) {
        if (type) {
            $event.element.parentNode.classList
                .replace(this[field + 'Type'][type], $event.value);
            this[field + 'Type'][type] = $event.value;
        }
    }

    initValidationGroup($event, validator) {
        this[validator].push($event.component);
    }

    onEmailKeyUp($event, type) {
        let field = 'emails';
        let value = this.getInputElementValue($event);
        this.addButtonVisible[type][field] = this.validateEmailAddress(value);

        this.emails[type] = value;

        this.checkSimilarCustomers();
        this.clearButtonVisible[type][field] = value
            && !this.addButtonVisible[type][field];
    }

    onPhoneKeyUp(value, isValid, type) {
        let field = 'phones';
        this.addButtonVisible[type][field] = isValid;
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
        if (component.option)
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

    onEmailComponentInitialized($event, type) {
        let field = 'emails';
        this[field + this.capitalize(type)] = $event.component;
        $event.component.option('value', this[field][type]);
    }

    onPhoneComponentInitialized(component, type) {
        this['phones' + this.capitalize(type)] = component;
    }

    emptyInput(field, type) {
        this.setComponentToValid(field, type, true);
        this.clearButtonVisible[type][field] = false;
        this.checkSimilarCustomers();
    }

    resetFullDialog() {
        this.contactTypes.forEach((type) => {
            this.resetComponent(this['emails' + this.capitalize(type)]);
            this['phones' + this.capitalize(type)].reset();
            this.clearButtonVisible[type]['emails'] = false;
            this.clearButtonVisible[type]['phones'] = false;
            this.addButtonVisible[type]['emails'] = false;
            this.addButtonVisible[type]['phones'] = false;
            this.contacts.emails[type] = [];
            this.contacts.phones[type] = [];
            this.emails[type] = [];
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
        this.partnerTypeId = undefined;
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

    leadStagesLoad() {
        this._pipelineService.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.lead)
            .subscribe(result => {
                this.stages = result.stages.map((stage) => {
                    if (stage.name === 'New') {
                        this.stageId = stage.id;
                    }
                    return {
                        id: stage.id,
                        name: stage.name,
                        text: stage.name
                    };
                });
            });
    }

    onStagesChanged(event) {
        this.stageId = event.id;
    }

    partnerTypesLoad() {
        this._partnerTypeService.getAll()
            .subscribe(list => {
                this.partnerTypes = list.map((item) => {
                    return {
                        id: item.id,
                        name: item.name,
                        text: item.name
                    };
                });
            });
    }

    onPartnerTypeChanged(event) {
        this.partnerTypeId = event.id;
        this.partnerTypesComponent.apply();
    }
}
