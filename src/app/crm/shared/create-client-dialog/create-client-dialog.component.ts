/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    OnInit,
    ViewChild,
    Inject,
    OnDestroy,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { CacheService } from 'ng2-cache-service';
import { finalize, filter } from 'rxjs/operators';
import * as _ from 'underscore';
import { AngularGooglePlaceService } from 'angular-google-place';

/** Application imports */
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import {
    ContactAssignedUsersStoreSelectors,
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
import { ContactGroup } from '@shared/AppEnums';
import {
    ContactServiceProxy, CreateContactInput, ContactAddressServiceProxy, CreateContactEmailInput,
    CreateContactPhoneInput, ContactPhotoServiceProxy, CreateContactAddressInput, ContactEmailServiceProxy,
    ContactPhoneServiceProxy, SimilarContactOutput, ContactPhotoInput, OrganizationContactServiceProxy,
    PersonInfoDto, LeadServiceProxy, CreateLeadInput, CreateContactLinkInput
} from '@shared/service-proxies/service-proxies';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { SimilarCustomersDialogComponent } from '../similar-customers-dialog/similar-customers-dialog.component';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { RatingComponent } from '../rating/rating.component';
import { TagsListComponent } from '../tags-list/tags-list.component';
import { ListsListComponent } from '../lists-list/lists-list.component';
import { TypesListComponent } from '../types-list/types-list.component';
import { UserAssignmentComponent } from '../user-assignment-list/user-assignment-list.component';
import { ValidationHelper } from '@shared/helpers/ValidationHelper';
import { StringHelper } from '@shared/helpers/StringHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { Router } from '@angular/router';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { MessageService } from '@abp/message/message.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ToolbarService } from '@app/shared/common/toolbar/toolbar.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppPermissions } from '@shared/AppPermissions';
import { GooglePlaceHelper } from '@shared/helpers/GooglePlaceHelper';
import { SourceContactListComponent } from '@app/crm/contacts/source-contact-list/source-contact-list.component';

@Component({
    templateUrl: 'create-client-dialog.component.html',
    styleUrls: [
        '../../../shared/common/styles/form.less',
        '../../../shared/common/toolbar/toolbar.component.less',
        'create-client-dialog.component.less'
    ],
    providers: [ CacheHelper, ContactServiceProxy, ContactPhotoServiceProxy, DialogService, GooglePlaceHelper, LeadServiceProxy, ToolbarService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateClientDialogComponent implements OnInit, OnDestroy {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild('stagesList') stagesComponent: StaticListComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: ListsListComponent;
    @ViewChild(TypesListComponent) partnerTypesComponent: TypesListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(SourceContactListComponent) sourceComponent: SourceContactListComponent;
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;

    currentUserId = abp.session.userId;
    person = new PersonInfoDto();

    emailsComponent: any;
    phonesComponent: any;
    linksComponent: any;

    private lookupTimeout;
    private checkValidTimeout;
    private readonly SAVE_OPTION_DEFAULT = 2;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';
    private similarCustomersTimeout: any;
    stages: any[] = [];
    stageId: number;
    defaultStageSortOrder = 0;
    partnerTypes: any[] = [];
    saveButtonId = 'saveClientOptions';
    saveContextMenuItems = [];
    masks = AppConsts.masks;
    emailRegEx = AppConsts.regexPatterns.email;
    urlRegEx = AppConsts.regexPatterns.url;
    companies = [];
    company: string;
    notes = '';
    sourceContactId: number;
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
    photoSourceData: string;
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
    similarCustomers: SimilarContactOutput[] = [];
    similarCustomersDialog: any;
    toolbarConfig = [];
    title = '';
    jobTitle: string;
    isTitleValid = true;
    buttons: IDialogButton[] = [
        {
            id: this.saveButtonId,
            title: this.ls.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this)
        }
    ];
    contactGroups = ContactGroup;

    isUserSelected = true;
    isPartnerTypeSelected = false;
    isStageSelected = true;
    isStatusSelected = false;
    isListsSelected = false;
    isTagsSelected = false;
    isRatingSelected = true;
    isSourceSelected = false;

    isAssignDisabled = true;
    isListAndTagsDisabled = true;
    isRatingAndStarsDisabled = true;
    assignedUsersSelector = this.getAssignedUsersSelector();

    constructor(
        public dialog: MatDialog,
        public contactProxy: ContactServiceProxy,
        private contactService: ContactsService,
        private cacheService: CacheService,
        private router: Router,
        private contactPhoneService: ContactPhoneServiceProxy,
        private contactEmailService: ContactEmailServiceProxy,
        private contactAddressService: ContactAddressServiceProxy,
        private leadService: LeadServiceProxy,
        private nameParser: NameParserService,
        private pipelineService: PipelineService,
        private dialogService: DialogService,
        private angularGooglePlaceService: AngularGooglePlaceService,
        private orgServiceProxy: OrganizationContactServiceProxy,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private cacheHelper: CacheHelper,
        private dialogRef: MatDialogRef<CreateClientDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        private store$: Store<RootStore.State>,
        public ls: AppLocalizationService,
        public toolbarService: ToolbarService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.company = this.data.company;
        this.googleAutoComplete = Boolean(window['google']);
        this.saveContextMenuItems = [
            {text: this.ls.l('SaveAndAddNew'), selected: false},
            {text: this.ls.l('SaveAndExtend'), selected: false},
            {text: this.ls.l('SaveAndClose'), selected: false}
        ];

        this.isAssignDisabled = !contactService.checkCGPermission(data.customerType, 'ManageAssignments');
        this.isListAndTagsDisabled = !contactService.checkCGPermission(data.customerType, 'ManageListsAndTags');
        this.isRatingAndStarsDisabled = !contactService.checkCGPermission(data.customerType, 'ManageRatingAndStars');
    }

    ngOnInit() {
        this.countriesStateLoad();
        this.addressTypesLoad();
        this.phoneTypesLoad();
        this.emailTypesLoad();
        this.linkTypesLoad();
        this.sourceComponent
            .loadSourceContacts();
        if (this.data.isInLeadMode)
            this.leadStagesLoad();
        this.saveOptionsInit();
    }

    saveOptionsInit() {
        let cacheKey = this.cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            selectedIndex = this.SAVE_OPTION_DEFAULT;
        if (this.cacheService.exists(cacheKey))
            selectedIndex = this.cacheService.get(cacheKey);
        this.saveContextMenuItems[selectedIndex].selected = true;
        this.buttons[0].title = this.saveContextMenuItems[selectedIndex].text;
        this.changeDetectorRef.detectChanges();
    }

    updateSaveOption(option) {
        this.buttons[0].title = option.text;
        this.cacheService.set(this.cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            this.saveContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
        this.changeDetectorRef.detectChanges();
    }

    getCountryCode(name) {
        let country = _.findWhere(this.countries, {name: name});
        return country && country['code'];
    }

    private createEntity(): void {
        this.modalDialog.startLoading();
        let assignedUserId = this.userAssignmentComponent.selectedItemKey;
        let stageId = this.stageId;
        let lists = this.listsComponent.selectedItems;
        let tags = this.tagsComponent.selectedItems;
        let partnerTypeName = this.partnerTypesComponent.selectedItems.length ? this.partnerTypesComponent.selectedItems[0].name : undefined;
        let ratingId = this.ratingComponent.ratingValue;
        let dataObj: any = {
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
            title: this.jobTitle,
            photo: this.photoOriginalData ? ContactPhotoInput.fromJS({
                original: StringHelper.getBase64(this.photoOriginalData),
                thumbnail: StringHelper.getBase64(this.photoThumbnailData),
                source: this.photoSourceData
            }) : null,
            note: this.notes,
            assignedUserId: this.isAssignDisabled ? undefined : assignedUserId || this.currentUserId,
            stageId: stageId,
            lists: this.isListAndTagsDisabled ? undefined : lists,
            tags: this.isListAndTagsDisabled ? undefined : tags,
            ratingId: this.isRatingAndStarsDisabled ? undefined : ratingId,
            contactGroupId: this.data.customerType,
            partnerTypeName: partnerTypeName,
            sourceContactId: this.sourceContactId
        };

        let saveButton: any = document.getElementById(this.saveButtonId);
        saveButton.disabled = true;
        if (this.data.isInLeadMode)
            this.leadService.createLead(CreateLeadInput.fromJS(dataObj))
                .pipe(finalize(() => { saveButton.disabled = false; this.modalDialog.finishLoading(); }))
                .subscribe(result => {
                    dataObj.id = result.contactId;
                    dataObj.leadId = result.id;
                    this.afterSave(dataObj);
                });
        else
            this.contactProxy.createContact(CreateContactInput.fromJS(dataObj))
                .pipe(finalize(() => { saveButton.disabled = false; this.modalDialog.finishLoading(); }))
                .subscribe(result => {
                    dataObj.id = result.id;
                    this.afterSave(dataObj);
                });
    }

    private afterSave(data): void {
        if (!this.data.refreshParent) {
            this.close(data);
        } else if (this.saveContextMenuItems[0].selected) {
            this.resetFullDialog();
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.data.refreshParent(true, this.stageId);
        } else if (this.saveContextMenuItems[1].selected) {
            this.redirectToClientDetails(data.id, data.leadId);
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
            this.isTitleValid = false;
            return this.notifyService.error(this.ls.l('NameFieldsValidationError'));
        }

        if (!ValidationHelper.ValidateName(this.title)) {
            this.isTitleValid = false;
            return this.notifyService.error(this.ls.l('FullNameIsNotValid'));
        }

        if (!this.validateMultiple(this.emailValidators) ||
            !this.validateMultiple(this.phoneValidators) ||
            !this.validateMultiple(this.linkValidators)
        )
            return;

        if (['emails', 'phones', 'links', 'addresses'].some((type) => {
            let result = this.checkDuplicateContact(type);
            if (result)
                this.notifyService.error(this.ls.l('DuplicateContactDetected', this.ls.l(type)));
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
        return this.contacts.phones.map((val) => {
            return val.number && val.number != val.code ? {
                phoneNumber: val.number,
                phoneExtension: val.ext,
                isActive: true,
                usageTypeId: val.type
            } as CreateContactPhoneInput : undefined;
        }).filter(Boolean);
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
                    stateId: address.stateCode,
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
            let path = this.data.customerType == ContactGroup.Partner ?
                `app/crm/contact/${id}/contact-information` :
                `app/crm/contact/${id}/${this.data.isInLeadMode ? `lead/${leadId}/` : ''}contact-information`;
            this.router.navigate([path], {queryParams: {referrer: this.router.url.split('?').shift()}});
        }, 1000);
        this.close();
    }

    getSimilarContacts() {
        return ['emails', 'phones', 'addresses'].reduce((similar, field) => {
            return similar.concat(this.getSimilarCustomers(field));
        }, []).concat(this.similarCustomers);
    }

    showSimilarCustomers(event) {
        if (this.similarCustomersDialog)
            this.similarCustomersDialog.close();

        this.similarCustomersDialog = this.dialog.open(SimilarCustomersDialogComponent, {
            data: {
                similarCustomers: _.sortBy(this.getSimilarContacts(), 'score'),
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

    togglePartnerSource() {
        this.sourceComponent.toggle();
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

    checkSimilarCustomers(field?, index?) {
        let person = this.person,
            isPhone =  field == 'phones',
            isAddress = field == 'addresses',
            contact = field && this.contacts[field][index];
        if (isPhone && contact.number == contact.code)
            return false;

        clearTimeout(this.similarCustomersTimeout);
        this.similarCustomersTimeout = setTimeout(() => {
            this.contactProxy.getSimilarContacts(
                field ? undefined : person.namePrefix || undefined,
                field ? undefined : person.firstName || undefined,
                field ? undefined : person.middleName || undefined,
                field ? undefined : person.lastName || undefined,
                field ? undefined : person.nameSuffix || undefined,
                field ? undefined : undefined, //this.company ||
                (field == 'emails') && contact.email && [contact.email] || undefined,
                isPhone && contact.number && [contact.number] || undefined,
                isAddress && contact.address || undefined,
                isAddress && contact.city || undefined,
                isAddress && contact.stateCode || undefined,
                isAddress && contact.zip || undefined,
                isAddress && this.getCountryCode(contact.country) || undefined,
                this.data.customerType
            ).subscribe(response => {
                    if (response) {
                        if (field)
                            contact.similarCustomers = response;
                        else
                            this.similarCustomers = response;
                    }
                });
        }, 1000);
    }

    getSimilarCustomers(field) {
        return this.contacts[field].reduce((similar, fields) => {
            return fields.similarCustomers ? similar.concat(fields.similarCustomers) : similar;
        }, []);
    }

    similarCustomersAvailable() {
        return Boolean(this.getSimilarContacts().length);
    }

    getInputElementValue(event) {
        return event.element.getElementsByTagName('input')[0].value;
    }

    onAddressChanged(event, i) {
        this.checkAddressControls(i);
        let number = this.angularGooglePlaceService.street_number(event.address_components);
        let street = this.angularGooglePlaceService.street(event.address_components);
        this.contacts.addresses[i].stateCode = GooglePlaceHelper.getStateCode(event.address_components);
        this.contacts.addresses[i].address = number ? (number + ' ' + street) : street;
        this.changeDetectorRef.detectChanges();
    }

    updateCountryInfo(countryName: string, i) {
        this.contacts.addresses[i]['country'] =
            (countryName == 'United States' ?
                AppConsts.defaultCountryName : countryName);
        this.changeDetectorRef.detectChanges();
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
            this.changeDetectorRef.detectChanges();
        });
    }

    loadStatesDataSource(country: { name: string, code: string }) {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(country.code));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: country.code }))
            .subscribe(result => {
                setTimeout(() => {
                    this.states[country.name] = result;
                    this.changeDetectorRef.detectChanges();
                });
            });
    }

    phoneTypesLoad() {
        this.store$.dispatch(new PhoneUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(PhoneUsageTypesStoreSelectors.getPhoneUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.phoneTypes = types;
            this.changeDetectorRef.detectChanges();
        });
    }

    emailTypesLoad() {
        this.store$.dispatch(new EmailUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(EmailUsageTypesStoreSelectors.getEmailUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.emailTypes = types;
            this.changeDetectorRef.detectChanges();
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
            this.changeDetectorRef.detectChanges();
        });
    }

    onCountryChange(event, index) {
        this.checkAddressControls(index);
        let country = _.findWhere(this.countries, {name: event.value});
        if (country) {
            this.loadStatesDataSource(country);
        }
    }

    checkAddressControls(index) {
        clearTimeout(this.checkValidTimeout);
        this.checkValidTimeout = setTimeout(() => {
            let field = 'addresses';
            this.checkSimilarCustomers(field, index);
            this.addButtonVisible[field] =
                this.checkEveryContactValid(field) &&
                    !this.checkDuplicateContact(field);
            this.changeDetectorRef.detectChanges();
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
            this.changeDetectorRef.detectChanges();
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
        this.changeDetectorRef.detectChanges();
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
            event.component.option('isValid') ? 'change' : 'keyup');
    }

    onFieldChanged($event, field, i) {
        let value = this.getInputElementValue($event);
        this.addButtonVisible[field] =
            this.checkFieldValid(field, value) &&
                !this.checkDuplicateContact(field);

        this.checkSimilarCustomers(field, i);
        this.changeDetectorRef.detectChanges();
    }

    onPhoneChanged(component, i) {
        setTimeout(() => {
            let field = 'phones';
            this.contacts[field][i].code = component.getCountryCode();
            this.addButtonVisible[field] = !component.isEmpty() &&
                component.isValid() && !this.checkDuplicateContact(field);
            this.checkSimilarCustomers(field, i);
            this.changeDetectorRef.detectChanges();
        });
    }

    onPhoneKeyUp(event) {
        if (event.keyCode == 8/*Backspace*/) {
            this.addButtonVisible['phones'] = false;
            this.changeDetectorRef.detectChanges();
        }
    }

    companyLookupItems($event) {
        let search = this.company = $event.event.target.value;
        if (this.companies.length)
            this.companies = [];

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            this.orgServiceProxy.getOrganizations(search, this.data.customerType || ContactGroup.Client, 10).subscribe((res) => {
                if (search == this.company)
                    this.companies = res;
                this.changeDetectorRef.detectChanges();
                setTimeout(() => this.companyOptionChanged($event, true));
            });
        }, 500);
    }

    companyOptionChanged($event, forced = false) {
        if (!this.company || !this.companies.length || forced)
            $event.component.option('opened', Boolean(this.companies.length));
    }

    onCustomCompanyCreate(e) {
        setTimeout(() => {
            this.company = e.text;
            this.changeDetectorRef.detectChanges();
        });
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
                this.photoSourceData = result.source;
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
            this.sourceContactId = undefined;
            this.notes = undefined;

            this.person = new PersonInfoDto();
            this.addressTypesLoad();
            this.isTitleValid = true;
            this.company = undefined;
            this.similarCustomers = [];
            this.photoOriginalData = undefined;
            this.photoThumbnailData = undefined;
            this.photoSourceData = undefined;
            this.title = '';
            this.tagsComponent.reset();
            this.listsComponent.reset();
            this.partnerTypesComponent.reset();
            this.userAssignmentComponent.selectedItemKey = this.currentUserId;
            this.stageId = this.stages.length ? this.stages.find(v => v.index === this.defaultStageSortOrder).id : undefined;
            this.ratingComponent.reset();
            this.changeDetectorRef.detectChanges();
        };

        if (forced)
            resetInternal();
        else
            this.messageService.confirm(this.ls.l('DiscardConfirmation'), '', (confirmed) => {
                if (confirmed)
                    resetInternal();
            });
    }

    onSaveOptionSelectionChanged($event) {
        let option = $event.addedItems.pop() || $event.removedItems.pop() ||
            this.saveContextMenuItems[this.SAVE_OPTION_DEFAULT];
        this.saveContextMenuItems.forEach((item) => {
            item.selected = option.text === item.text;
        });
        this.updateSaveOption(option);
        this.save();
    }

    onFullNameKeyUp(inputValue: string) {
        this.title = inputValue;
        this.nameParser.parseIntoPerson(this.title, this.person);
        this.checkSimilarCustomers();
    }

    ngOnDestroy(): void {
        if (this.similarCustomersDialog)
            this.similarCustomersDialog.close();
    }

    leadStagesLoad() {
        this.modalDialog.startLoading();
        this.pipelineService.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.lead, this.data.customerType)
            .subscribe(
                result => {
                    this.stages = result.stages.map((stage) => {
                        if (stage.sortOrder === this.defaultStageSortOrder) {
                            this.stageId = stage.id;
                        }
                        return {
                            id: stage.id,
                            name: stage.name,
                            index: stage.sortOrder
                        };
                    });
                    this.changeDetectorRef.detectChanges();
                    this.modalDialog.finishLoading();
                },
                () => this.modalDialog.finishLoading()
            );
    }

    onStagesChanged(event) {
        this.stageId = event.id;
        this.isStageSelected = true;
    }

    onPartnerTypeChanged(event) {
        this.partnerTypesComponent.apply();
        this.isPartnerTypeSelected = Boolean(event.selectedRowKeys.length);
        this.assignedUsersSelector = this.getAssignedUsersSelector();
    }

    getAssignmentsPermissionKey() {
        if (this.partnerTypesComponent.selectedItems.length)
            return AppPermissions.CRMPartnersManageAssignments;

        return AppPermissions.CRMCustomersManageAssignments;
    }

    onUserAssignmentChanged(event) {
        this.isUserSelected = Boolean(event.addedItems.length);
    }

    onListsSelected(event) {
        this.isListsSelected = Boolean(event.selectedRowKeys.length);
    }

    onTagsSelected(event) {
        this.isTagsSelected = Boolean(event.selectedRowKeys.length);
    }

    onRatingChanged(event) {
        this.isRatingSelected = Boolean(event.value);
    }

    close(data?) {
        this.dialogRef.close(data);
    }

    getAssignedUsersSelector() {
        return select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, {
            contactGroup: this.partnerTypesComponent && this.partnerTypesComponent.selectedItems.length ? ContactGroup.Partner : ContactGroup.Client
        });
    }

    onPartnerSourceSelected(event) {
        if (this.isSourceSelected = event.id != this.sourceContactId)
            this.isSourceSelected = Boolean(this.sourceContactId = event.id);
        else
            this.sourceContactId = undefined;
        this.togglePartnerSource();
    }
}
