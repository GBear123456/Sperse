/** Core imports */
import { Component, OnInit, AfterViewInit, ViewChild, Injector, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Store, select } from '@ngrx/store';
import { DxContextMenuComponent } from 'devextreme-angular';
import { CacheService } from 'ng2-cache-service';
import { finalize, filter } from 'rxjs/operators';
import * as _ from 'underscore';
import { AngularGooglePlaceService } from '@node_modules/angular-google-place';

/** Application imports */
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import {
    AddressUsageTypesStoreActions,
    AddressUsageTypesStoreSelectors,
    EmailUsageTypesStoreActions,
    EmailUsageTypesStoreSelectors,
    ContactLinkTypesStoreActions,
    ContactLinkTypesStoreSelectors,
    PhoneUsageTypesStoreActions,
    PhoneUsageTypesStoreSelectors
} from '@app/store';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroupType } from '@shared/AppEnums';
import {
    ContactGroupServiceProxy, CreateContactGroupInput, ContactAddressServiceProxy, CreateContactEmailInput,
    CreateContactPhoneInput, ContactPhotoServiceProxy, CreateContactAddressInput, ContactEmailServiceProxy,
    ContactPhoneServiceProxy, SimilarContactGroupOutput, ContactPhotoInput,
    PersonInfoDto, LeadServiceProxy, CreateLeadInput, CreateContactLinkInput
} from '@shared/service-proxies/service-proxies';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { SimilarCustomersDialogComponent } from '../similar-customers-dialog/similar-customers-dialog.component';
import { StaticListComponent } from '../../shared/static-list/static-list.component';
import { RatingComponent } from '../rating/rating.component';
import { TagsListComponent } from '../tags-list/tags-list.component';
import { ListsListComponent } from '../lists-list/lists-list.component';
import { TypesListComponent } from '../types-list/types-list.component';
import { UserAssignmentComponent } from '../user-assignment-list/user-assignment-list.component';
import { ValidationHelper } from '@shared/helpers/ValidationHelper';
import { StringHelper } from '@shared/helpers/StringHelper';


@Component({
    templateUrl: 'create-client-dialog.component.html',
    styleUrls: ['create-client-dialog.component.less'],
    providers: [ContactGroupServiceProxy, ContactPhotoServiceProxy, DialogService, LeadServiceProxy ]
})
export class CreateClientDialogComponent extends ModalDialogComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('stagesList') stagesComponent: StaticListComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: ListsListComponent;
    @ViewChild(TypesListComponent) partnerTypesComponent: TypesListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;

    currentUserId = abp.session.userId;
    person = new PersonInfoDto();

    emailsComponent: any;
    phonesComponent: any;
    linksComponent: any;

    private readonly SAVE_OPTION_DEFAULT = 2;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';
    private similarCustomersTimeout: any;
    stages: any[] = [];
    stageId: number;
    partnerTypes: any[] = [];

    saveButtonId = 'saveClientOptions';
    saveContextMenuItems = [];

    masks = AppConsts.masks;
    phoneRegEx = AppConsts.regexPatterns.phone;
    emailRegEx = AppConsts.regexPatterns.email;
    urlRegEx = AppConsts.regexPatterns.url;
    fullNameRegEx = AppConsts.regexPatterns.fullName;

    company: string;
    title: string;
    notes = '';

    addressValidators: any = [];
    emailValidators: any = [];
    phoneValidators: any = [];
    linkValidators: any = [];

    emails;
    emailTypeDefault = 'P';
    emailType = this.emailTypeDefault;

    phones;
    phoneTypeDefault = 'M';
    phoneType = this.phoneTypeDefault;
    phoneExtension;

    links;
    linkTypeDefault = '-';
    linkForCompany = false;
    linkType = this.linkTypeDefault;

    addresses = {};
    addressTypeDefault = 'W';

    addressTypes: any = [];
    phoneTypes: any = [];
    emailTypes: any = [];
    linkTypes: any = [];
    states: any;
    countries: any;

    googleAutoComplete: boolean;
    photoOriginalData: string;
    photoThumbnailData: string;

    addButtonVisible = {};
    clearButtonVisible = {};

    contacts: any = {
        emails: [],
        phones: [],
        links: [],
        addresses: []
    };

    similarCustomers: SimilarContactGroupOutput[];
    similarCustomersDialog: any;
    toolbarConfig = [];

    private namePattern = AppConsts.regexPatterns.name;
    private validationError: string;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _cacheService: CacheService,
        private _contactGroupService: ContactGroupServiceProxy,
        private _contactPhoneService: ContactPhoneServiceProxy,
        private _contactEmailService: ContactEmailServiceProxy,
        private _contactAddressService: ContactAddressServiceProxy,
        private _leadService: LeadServiceProxy,
        private _router: Router,
        private _nameParser: NameParserService,
        private _pipelineService: PipelineService,
        private dialogService: DialogService,
        private _angularGooglePlaceService: AngularGooglePlaceService,
        private store$: Store<RootStore.State>
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.googleAutoComplete = Boolean(window['google']);
        this.saveContextMenuItems = [
            {text: this.l('SaveAndAddNew'), selected: false},
            {text: this.l('SaveAndExtend'), selected: false},
            {text: this.l('SaveAndClose'), selected: false}
        ];

        this.countriesStateLoad();
        this.addressTypesLoad();
        this.phoneTypesLoad();
        this.emailTypesLoad();
        this.linkTypesLoad();
        if (this.data.isInLeadMode) {
            this.leadStagesLoad();
        }
        this.initToolbarConfig();
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
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
                    } : this.data.customerType == ContactGroupType.Client ? {
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
                locateInMenu: 'auto',
                areItemsDependent: true,
                items: [
                    {
                        name: 'discard',
                        action: this.resetFullDialog.bind(this, false)
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
        let partnerTypeName = this.partnerTypesComponent.selectedItems.length ? this.partnerTypesComponent.selectedItems[0].name : undefined;
        let ratingId = this.ratingComponent.ratingValue;
        let dataObj = {
            firstName: this.person.firstName,
            middleName: this.person.middleName,
            lastName: this.person.lastName,
            namePrefix: this.person.namePrefix,
            nameSuffix: this.person.nameSuffix,
            nickName: this.person.nickName,
            emailAddresses: this.getEmailContactInput(),
            phoneNumbers: this.getPhoneContactInput(),
            addresses: this.getAddressContactInput(),
            links: this.getLinkContactInput(),
            companyName: this.company,
            title: this.title,
            photo: this.photoOriginalData ? ContactPhotoInput.fromJS({
                originalImage: StringHelper.getBase64(this.photoOriginalData),
                thumbnail: StringHelper.getBase64(this.photoThumbnailData)
            }) : null,
            note: this.notes,
            assignedUserId: assignedUserId || this.currentUserId,
            stageId: stageId,
            lists: lists,
            tags: tags,
            ratingId: ratingId,
            contactGroupTypeId: this.data.customerType,
            partnerTypeName: partnerTypeName
        };

        let saveButton: any = document.getElementById(this.saveButtonId);
        saveButton.disabled = true;
        if (this.data.isInLeadMode)
            this._leadService.createLead(CreateLeadInput.fromJS(dataObj))
                .pipe(finalize(() => { saveButton.disabled = false; }))
                .subscribe(result => this.afterSave(result.contactGroupId, result.id));
        else
            this._contactGroupService.createContactGroup(CreateContactGroupInput.fromJS(dataObj))
                .pipe(finalize(() => { saveButton.disabled = false; }))
                .subscribe(result => this.afterSave(result.id));
    }

    private afterSave(contactGroupId: number, leadId?: number): void {
        if (this.saveContextMenuItems[0].selected) {
            this.resetFullDialog();
            this.notify.info(this.l('SavedSuccessfully'));
            this.data.refreshParent(true, this.stageId);
        } else if (this.saveContextMenuItems[1].selected) {
            this.redirectToClientDetails(contactGroupId, leadId);
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
            !this.validateMultiple(this.phoneValidators) ||
            !this.validateMultiple(this.linkValidators)
        )
            return;

        this.checkAddContactByField('emails');
        this.checkAddContactByField('phones');
        this.checkAddContactByField('links');
        this.checkAddAddressContact();

        this.createEntity();
    }

    private validateMultiple(validators): boolean {
        let result = true;
        validators.forEach((v) => { result = result && v.validate().isValid; });
        return result;
    }

    checkAddContactByField(field) {
        this.addButtonVisible[field] && this.addContact(field);
    }

    checkAddAddressContact() {
        this.addButtonVisible['addresses'] && this.addAddressContact();
    }

    getEmailContactInput() {
        return this.contacts.emails.map((val) => {
            return {
                emailAddress: val.email,
                usageTypeId: val.type,
                isActive: true
            } as CreateContactEmailInput;
        });
    }

    getPhoneContactInput() {
        return this.contacts.phones.map((val) => {
            return {
                phoneNumber: val.number,
                phoneExtension: val.ext,
                isActive: true,
                usageTypeId: val.type
            } as CreateContactPhoneInput;
        });
    }

    getLinkContactInput() {
        return this.contacts.links.map((val) => {
            return {
                url: val.url,
                isActive: true,
                isCompany: val.isCompany,
                linkTypeId: val.type
            } as CreateContactLinkInput;
        });
    }

    getAddressContactInput() {
        return this.contacts.addresses.map((address) => {
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
        }).filter(Boolean);
    }

    redirectToClientDetails(id: number, leadId?: number) {
        setTimeout(() => {
            let path = this.data.customerType == ContactGroupType.Partner ?
                `app/crm/partner/${id}/contact-information` :
                `app/crm/client/${id}/${this.data.isInLeadMode ? `lead/${leadId}/` : ''}contact-information`;
            this._router.navigate([path], {queryParams: {referrer: this._router.url.split('?').shift()}});
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
            this._contactGroupService.getSimilarContactGroups(
                this.person.namePrefix || undefined,
                this.person.firstName || undefined,
                this.person.middleName || undefined,
                this.person.lastName || undefined,
                this.person.nameSuffix || undefined,
                this.company || undefined,
                this.getCurrentEmails() || undefined,
                this.getCurrentPhones() || undefined,
                undefined, undefined, undefined, undefined, undefined, this.data.customerType)
                .subscribe(response => {
                    if (response)
                        this.similarCustomers = response;
                });
        }, 1000);
    }

    getCurrentEmails() {
        let emails = [];
        this.contacts.emails.forEach((fields, type) => {
            emails.push(fields.email);
        });

        this.emails && emails.push(this.emails);

        return emails;
    }

    getCurrentPhones() {
        let phones = [];
        this.contacts.phones.forEach((fields) => {
            phones.push(fields.number);
        });

        this.phones && phones.push(this.phones);

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
            event.component.option({mask: '', value: '', isValid: true});
    }

    onAddressChanged(event) {
        this.checkAddressControls();

        let number = this._angularGooglePlaceService.street_number(event.address_components);
        let street = this._angularGooglePlaceService.street(event.address_components);

        this.addButtonVisible['addresses'] = Boolean(
            this.addresses['address'] = number ? (number + ' ' + street) : street
        );
    }

    updateCountryInfo(countryName: string) {
        this.addresses['country'] =
            (countryName == 'United States' ?
                AppConsts.defaultCountryName :
                countryName);
    }

    countriesStateLoad(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries))
        .subscribe(result => {
            this.countries = result;
        });
    }

    setDefaultTypeValue(obj, list, field = null) {
        if (list.length) {
                if (field)
                    obj[field] = obj[field] || list[0].id;
                else
                    obj = obj || list[0].id;
        }
    }

    addressTypesLoad() {
        this.store$.dispatch(new AddressUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(AddressUsageTypesStoreSelectors.getAddressUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.addressTypes = types;
            this.addresses['addressType'] = this.addressTypeDefault;
        });

        if (!this.addresses['country']) {
            this.loadStatesDataSource(AppConsts.defaultCountry);
            this.addresses['country'] = AppConsts.defaultCountryName;
        }
    }

    loadStatesDataSource(countryCode: string) {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode }))
            .subscribe(result => {
                this.states = result;
            });
    }

    phoneTypesLoad() {
        this.store$.dispatch(new PhoneUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(PhoneUsageTypesStoreSelectors.getPhoneUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.phoneTypes = types;
            this.setDefaultTypeValue(this.phoneType, types);
        });
    }

    emailTypesLoad() {
        this.store$.dispatch(new EmailUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(EmailUsageTypesStoreSelectors.getEmailUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.emailTypes = types;
            this.setDefaultTypeValue(this.emailType, types);
        });
    }

    linkTypesLoad() {
        this.store$.dispatch(new ContactLinkTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(ContactLinkTypesStoreSelectors.getContactLinkTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.linkTypes = types.map((entity) => {
                entity['uri'] = entity.name.replace(/ /g,'');
                return entity;
            });
            this.setDefaultTypeValue(this.linkType, types);
        });
    }

    onCountryChange(event) {
        this.checkAddressControls();
        let country = _.findWhere(this.countries, {name: event.value});
        if (country) {
            this.loadStatesDataSource(country['code']);
        }
    }

    checkAddressControls() {
        this.addButtonVisible['addresses'] = this.addresses['address'] &&
            this.addresses['city'] && this.addresses['country'];
        this.clearButtonVisible['addresses'] = !this.addButtonVisible['addresses'];
    }

    addContact(field) {
        let value = this.getValidateFieldValue(field);
        if (value && this.contacts[field].every((val) => {
            return JSON.stringify(value) != JSON.stringify(val);
        }))
            this.contacts[field].push(value);
    }

    addAddressContact() {
        let entity = this.addresses;

        this.contacts['addresses'].push(this.addresses);
        this.addresses = {
            addressType: this.addresses['addressType']
        };
    }

    removeContact(field, index) {
        this.contacts[field].splice(index, 1);

        this.checkSimilarCustomers();
    }

    getValidateFieldValue(field) {
        let value;
        if (field == 'links') {
            value = {
                isCompany: this.linkForCompany,
                type: this.linkType == this.linkTypeDefault ? undefined: this.linkType,
                url: this.links
            };
            this.resetComponent(this[field + 'Component']);
        } else if (field == 'emails') {
            value = {
                type: this.emailType,
                email: this.emails
            };
            this.resetComponent(this[field + 'Component']);
        } else if (field == 'phones') {
            value = {
                type: this.phoneType,
                number: this.phones,
                ext: this.phoneExtension
            };
            this.phoneExtension = undefined;
            this[field + 'Component'].reset();
        }

        this.addButtonVisible[field] = false;
        return value;
    }

    resetComponent(component) {
        component.reset();
        component.option('isValid', true);
    }

    validateEmailAddress(value): boolean {
        return this.emailRegEx.test(value);
    }

    validateLinkAddress(value): boolean {
        return this.urlRegEx.test(value);
    }

    onTypeChanged($event, field) {
        if ($event.addedItems) {
            this[field + 'Type'] = $event.addedItems[0].id;
        } else {
            $event.element.parentNode.classList
                .replace(this[field + 'Type'], $event.value);
            this[field + 'Type'] = $event.value;
        }
    }

    initValidationGroup($event, validator) {
        this[validator].push($event.component);
    }

    onEmailKeyUp($event) {
        let field = 'emails';
        let value = this.getInputElementValue($event);
        this.addButtonVisible[field] = this.validateEmailAddress(value);

        this.emails = value;

        this.checkSimilarCustomers();
        this.clearButtonVisible[field] = value
            && !this.addButtonVisible[field];
    }

    onLinkKeyUp($event) {
        let field = 'links';
        let value = this.getInputElementValue($event);
        this.addButtonVisible[field] = this.validateLinkAddress(value);

        this.links = value;

        this.checkSimilarCustomers();
        this.clearButtonVisible[field] = value
            && !this.addButtonVisible[field];
    }

    onPhoneKeyUp(value, isValid) {
        let field = 'phones';
        this.addButtonVisible[field] = isValid;
        this.checkSimilarCustomers();
        this.clearButtonVisible[field] = value
            && !this.addButtonVisible[field];
    }

    onCompanyKeyUp($event) {
        this.company = this.getInputElementValue($event);
        this.checkSimilarCustomers();
    }

    onCommentKeyUp($event) {
        this.notes = $event.element.getElementsByTagName('textarea')[0].value;
    }

    setComponentToValid(field, reset = false) {
        let component = this[field + 'Component'];
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

    onComponentInitialized($event, fileld) {
        this[fileld + 'Component'] = $event.component;
        $event.component.option('value', this[fileld]);
    }

    onPhoneComponentInitialized(component) {
        this.phonesComponent = component;
    }

    emptyInput(field) {
        if (field == 'phones')
            this.phoneExtension = '';
        this.setComponentToValid(field, true);
        this.clearButtonVisible[field] = false;
        this.checkSimilarCustomers();
    }

    resetFullDialog(forced = true) {
        let resetInternal = () => {
            this.resetComponent(this.emailsComponent);
            this.phonesComponent.reset();
            this.clearButtonVisible['emails'] = false;
            this.clearButtonVisible['phones'] = false;
            this.addButtonVisible['emails'] = false;
            this.addButtonVisible['phones'] = false;
            this.contacts.emails = [];
            this.contacts.phones = [];
            this.contacts.links = [];
            this.contacts.addresses = [];
            this.phoneExtension = undefined;
            this.notes = undefined;
            this.emails = undefined;
            this.phones = undefined;
            this.links = undefined;
            this.addresses = {
                addressType: this.addressTypeDefault
            };

            this.person = new PersonInfoDto();
            this.emailType = this.emailTypeDefault;
            this.phoneType = this.phoneTypeDefault;
            this.linkType = this.linkTypeDefault;
            this.addressTypesLoad();
            this.data.title = undefined;
            this.data.isTitleValid = true;
            this.company = undefined;
            this.similarCustomers = [];
            this.photoOriginalData = undefined;
            this.photoThumbnailData = undefined;
            this.title = undefined;
            this.tagsComponent.reset();
            this.listsComponent.reset();
            this.userAssignmentComponent.reset();
            this.stageId = this.stages.length ? this.stages.find(v => v.name == 'New').id : undefined;
            this.ratingComponent.selectedItemKey = this.ratingComponent.ratingMin;
        };

        if (forced)
            resetInternal();
        else
            this.message.confirm(this.l('DiscardConfirmation'), '', (confirmed) => {
                if (confirmed)
                    resetInternal();
            });
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

    onPartnerTypeChanged(event) {
        this.partnerTypesComponent.apply();
    }

    getAssignmentsPermissinKey() {
        let type = 'Customers';
        if (this.data.isInLeadMode)
            type = 'Leads';
        else if (this.partnerTypesComponent.selectedItems.length)
            type = 'Partners';

        return 'Pages.CRM.' + type + '.ManageAssignments';
    }
}
