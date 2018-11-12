/** Core imports */
import { Component, OnInit, AfterViewInit, ViewChild, Injector, OnDestroy } from '@angular/core';

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

    private checkValidTymeout;
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

    emailsTypeDefault = 'P';
    phonesTypeDefault = 'M';
    linksTypeDefault = '-';
    addressesTypeDefault = 'W';

    addressTypes: any = [];
    phoneTypes: any = [];
    emailTypes: any = [];
    linkTypes: any = [];
    states: any = [];
    countries: any;

    googleAutoComplete: boolean;
    photoOriginalData: string;
    photoThumbnailData: string;

    addButtonVisible = {
        emails: false,
        phones: false,
        links: false,
        addresses: false
    };

    contacts: any = {
        emails: [{type: this.emailsTypeDefault}],
        phones: [{type: this.phonesTypeDefault}],
        links: [{type: this.linksTypeDefault}],
        addresses: [{type: this.addressesTypeDefault}]
    };

    similarCustomers: SimilarContactGroupOutput[];
    similarCustomersDialog: any;
    toolbarConfig = [];

    private namePattern = AppConsts.regexPatterns.name;
    private validationError: string;
    private isUserSelected = true;
    private isPartnerTypeSelected = false;
    private isStageSelected = true;
    private isStatusSelected = false;
    private isListsSelected = false;
    private isTagsSelected = false;
    private isRatingSelected = false;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _cacheService: CacheService,
        private _contactGroupService: ContactGroupServiceProxy,
        private _contactPhoneService: ContactPhoneServiceProxy,
        private _contactEmailService: ContactEmailServiceProxy,
        private _contactAddressService: ContactAddressServiceProxy,
        private _leadService: LeadServiceProxy,
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
                        action: this.toggleUserAssignment.bind(this),
                        options: {
                            accessKey: 'ClientAssign'
                        },
                        attr: {
                            'filter-selected': this.isUserSelected
                        }
                    },
                    this.data.isInLeadMode ? {
                        name: 'stage',
                        action: this.toggleStages.bind(this),
                        options: {
                            accessKey: 'CreateLeadStage'
                        },
                        attr: {
                            'filter-selected': this.isStageSelected
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
                            },
                            attr: {
                                'filter-selected': this.isStatusSelected
                            }
                        } :
                        {
                            name: 'partnerType',
                            action: this.togglePartnerTypes.bind(this),
                            options: {
                                accessKey: 'PartnerTypesList'
                            },
                            attr: {
                                'filter-selected': this.isPartnerTypeSelected
                            }
                        },
                    {
                        name: 'lists',
                        action: this.toggleLists.bind(this),
                        options: {
                            accessKey: 'ClientLists'
                        },
                        attr: {
                            'filter-selected': this.isListsSelected
                        }
                    },
                    {
                        name: 'tags',
                        action: this.toggleTags.bind(this),
                        options: {
                            accessKey: 'ClientTags'
                        },
                        attr: {
                            'filter-selected': this.isTagsSelected
                        }
                    },
                    {
                        name: 'rating',
                        action: this.toggleRating.bind(this),
                        options: {
                            accessKey: 'ClientRating'
                        },
                        attr: {
                            'filter-selected': this.isRatingSelected
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

        if (['emails', 'phones', 'links', 'addresses'].some((type) => {
            let result = this.checkDuplicateContact(type);
            if (result)
                this.notify.error(this.l('DuplicateContactDetected', this.l(type)));
            return result;
        })) return;

        this.createEntity();
    }

    private validateMultiple(validators): boolean {
        let result = true;
        validators.forEach((v) => { result = result && v.validate().isValid; });
        return result;
    }

    getEmailContactInput() {
        return this.contacts.emails.filter((obj) => obj.email).map((val) => {
            return {
                emailAddress: val.email,
                usageTypeId: val.type,
                isActive: true
            } as CreateContactEmailInput;
        });
    }

    getPhoneContactInput() {
        return this.contacts.phones.filter((obj) => obj.number).map((val) => {
            return {
                phoneNumber: val.number,
                phoneExtension: val.ext,
                isActive: true,
                usageTypeId: val.type
            } as CreateContactPhoneInput;
        });
    }

    getLinkContactInput() {
        return this.contacts.links.filter((obj) => obj.url).map((val) => {
            return {
                url: val.url,
                isActive: true,
                isCompany: val.isCompany,
                linkTypeId: val.type == this.linksTypeDefault ? undefined : val.type
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
                    usageTypeId: address.type
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

    toggleUserAssignment() {
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
        return this.contacts.emails.map((fields) => {
            return fields.email;
        });
    }

    getCurrentPhones() {
        return this.contacts.phones.forEach((fields) => {
            return fields.number;
        });
    }

    getInputElementValue(event) {
        return event.element.getElementsByTagName('input')[0].value;
    }

    onAddressChanged(event, i) {
        this.checkAddressControls();

        let number = this._angularGooglePlaceService.street_number(event.address_components);
        let street = this._angularGooglePlaceService.street(event.address_components);

        this.contacts.addresses[i].address = number ? (number + ' ' + street) : street;
    }

    updateCountryInfo(countryName: string, i) {
        this.contacts.addresses[i]['country'] =
            (countryName == 'United States' ?
                AppConsts.defaultCountryName : countryName);
    }

    countriesStateLoad(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries))
        .subscribe(result => {
            this.countries = result;
        });
    }

    addressTypesLoad() {
        this.store$.dispatch(new AddressUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(AddressUsageTypesStoreSelectors.getAddressUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.addressTypes = types;
        });
    }

    loadStatesDataSource(countryCode: string, index = 0) {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode }))
            .subscribe(result => {
                setTimeout(() => this.states[index] = result);
            });
    }

    phoneTypesLoad() {
        this.store$.dispatch(new PhoneUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(PhoneUsageTypesStoreSelectors.getPhoneUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.phoneTypes = types;
        });
    }

    emailTypesLoad() {
        this.store$.dispatch(new EmailUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(EmailUsageTypesStoreSelectors.getEmailUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.emailTypes = types;
        });
    }

    linkTypesLoad() {
        this.store$.dispatch(new ContactLinkTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(ContactLinkTypesStoreSelectors.getContactLinkTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.linkTypes = types.map((entity) => {
                entity['uri'] = entity.name.replace(/ /g, '');
                return entity;
            });
        });
    }

    onCountryChange(event, index) {
        this.checkAddressControls();
        let country = _.findWhere(this.countries, {name: event.value});
        if (country) {
            this.loadStatesDataSource(country['code'], index);
        }
    }

    checkAddressControls() {
        clearTimeout(this.checkValidTymeout);
        this.checkValidTymeout = setTimeout(() => {
            this.addButtonVisible['addresses'] =
                this.checkEveryContactValid('addresses') &&
                    !this.checkDuplicateContact('addresses');
        }, 300);
    }

    checkDuplicateContact(field) {
        return this.contacts[field].some((checkItem, checkIndex) => {
            return !this.contacts[field].every((item, index) => {
                return (index == checkIndex) || JSON.stringify(checkItem) != JSON.stringify(item);
            });
        });
    }

    addNewContact(field) {
        if (this.addButtonVisible[field] &&
            this.checkEveryContactValid(field) &&
            !this.checkDuplicateContact(field)
        ) {
            this.contacts[field].push({
                type: this[field + 'TypeDefault']
            });
            this.addButtonVisible[field] = false;
        }
    }

    checkFieldValid(field, item) {
        let isObject = typeof(item) == 'object';
        if (field == 'emails')
            return this.validateEmailAddress(isObject ? item.email : item);
        else if (field == 'phones')
            return Boolean(isObject ? item.number : item);
        else if (field == 'links')
            return this.validateLinkAddress(isObject ? item.url : item);
        else if (field == 'addresses')
            return item.address && item.city && item.country;
        else
            return false;
    }

    checkEveryContactValid(field) {
        return this.contacts[field].every((item) => {
            if (item.type)
                return this.checkFieldValid(field, item);
            else
                return false;
        });
    }

    emptyOrRemoveInput(field, index) {
        if (index || this.contacts[field].length > 1) {
            this.contacts[field].splice(index, 1);
            this.addButtonVisible[field] = this.checkEveryContactValid(field)
                && !this.checkDuplicateContact(field);
        } else {
            this.contacts[field][index] = {type: this[field + 'TypeDefault']};
            this.addButtonVisible[field] = false;
        }

        this.checkSimilarCustomers();
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

    initValidationGroup($event, validator) {
        this[validator].push($event.component);
    }

    onEmailKeyUp(event) {
        event.component.option('valueChangeEvent', 
            event.component.option('isValid') ? 'change': 'keyup');
    }

    onFieldChanged($event, field, i) {
        let value = this.getInputElementValue($event);
        this.addButtonVisible[field] =
            this.checkFieldValid(field, value) &&
                !this.checkDuplicateContact(field);

        this.checkSimilarCustomers();
    }

    onPhoneChanged(component) {
        setTimeout(() => {
            let field = 'phones';
            this.addButtonVisible[field] = component.isValid()
                && !this.checkDuplicateContact(field);
            this.checkSimilarCustomers();
        });
    }

    onCompanyKeyUp($event) {
        this.company = this.getInputElementValue($event);
        this.checkSimilarCustomers();
    }

    onCommentKeyUp($event) {
        this.notes = $event.element.getElementsByTagName('textarea')[0].value;
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

    resetFullDialog(forced = true) {
        let resetInternal = () => {
            this.resetComponent(this.emailsComponent);
            this.phonesComponent.reset();
            this.addButtonVisible['emails'] = false;
            this.addButtonVisible['phones'] = false;
            this.addButtonVisible['links'] = false;
            this.addButtonVisible['addresses'] = false;
            this.contacts.emails = [{type: this.emailsTypeDefault}];
            this.contacts.phones = [{type: this.phonesTypeDefault}];
            this.contacts.links = [{type: this.linksTypeDefault}];
            this.contacts.addresses = [{type: this.addressesTypeDefault}];
            this.notes = undefined;

            this.person = new PersonInfoDto();
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
        this.isStageSelected = true;
        this.initToolbarConfig();
    }

    onPartnerTypeChanged(event) {
        this.partnerTypesComponent.apply();
        this.isPartnerTypeSelected = true;
        this.initToolbarConfig();
    }

    getAssignmentsPermissinKey() {
        if (this.partnerTypesComponent.selectedItems.length)
            return 'Pages.CRM.Partners.ManageAssignments';

        return 'Pages.CRM.Customers.ManageAssignments';
    }

    onUserAssignmentChanged(event) {
        this.isUserSelected = Boolean(event.addedItems.length);
        this.initToolbarConfig();
    }

    onListsSelected(event) {
        this.isListsSelected = Boolean(event.selectedRowKeys.length);
        this.initToolbarConfig();
    }

    onTagsSelected(event) {
        this.isTagsSelected = Boolean(event.selectedRowKeys.length);
        this.initToolbarConfig();
    }

    onRatingchanged(event) {
        this.isRatingSelected = Boolean(event.value);
        this.initToolbarConfig();
    }
}
