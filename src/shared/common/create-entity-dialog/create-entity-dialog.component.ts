/** Core imports */
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    Inject,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren
} from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { CacheService } from 'ng2-cache-service';
import { Observable, Subscription } from 'rxjs';
import { filter, finalize, first, map, switchMap, pluck } from 'rxjs/operators';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { DxScrollViewComponent } from 'devextreme-angular/ui/scroll-view';
import { Address as AutocompleteAddress } from 'ngx-google-places-autocomplete/objects/address';

/** Application imports */
import { NameParserService } from '@shared/common/name-parser/name-parser.service';
import {
    AddressUsageTypesStoreActions,
    AddressUsageTypesStoreSelectors,
    EmailUsageTypesStoreActions,
    EmailUsageTypesStoreSelectors,
    PhoneUsageTypesStoreActions,
    PhoneUsageTypesStoreSelectors,
    RootStore
} from '@root/store';
import {
    ContactAssignedUsersStoreSelectors,
    ContactLinkTypesStoreActions,
    ContactLinkTypesStoreSelectors
} from '@app/store';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup, ContactStatus } from '@shared/AppEnums';
import {
    AddressUsageTypeDto,
    ContactAddressServiceProxy,
    ContactEmailServiceProxy,
    ContactLinkTypeDto,
    ContactPhoneServiceProxy,
    ContactPhotoInput,
    ContactPhotoServiceProxy,
    ContactServiceProxy,
    CreateContactAddressInput,
    CreateContactEmailInput,
    CreateContactLinkInput,
    CreateContactPhoneInput,
    CreateOrUpdateContactInput,
    CreateOrUpdateContactOutput,
    EmailUsageTypeDto,
    OrganizationContactServiceProxy,
    OrganizationShortInfo,
    PersonInfoDto,
    PhoneUsageTypeDto,
    PipelineDto,
    PropertyInput,
    SimilarContactOutput,
    StageDto,
    TrackingInfo,

    InvoiceSettings
} from '@shared/service-proxies/service-proxies';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { SimilarEntitiesDialogComponent } from './similar-entities-dialog/similar-entities-dialog.component';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { RatingComponent } from '@app/shared/common/lists/rating/rating.component';
import { TagsListComponent } from '@app/shared/common/lists/tags-list/tags-list.component';
import { ListsListComponent } from '@app/shared/common/lists/lists-list/lists-list.component';
import { TypesListComponent } from '@app/shared/common/lists/types-list/types-list.component';
import { UserAssignmentComponent } from '@app/shared/common/lists/user-assignment-list/user-assignment-list.component';
import { ValidationHelper } from '@shared/helpers/ValidationHelper';
import { StringHelper } from '@shared/helpers/StringHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { MessageService } from '@abp/message/message.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ToolbarService } from '@app/shared/common/toolbar/toolbar.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppPermissions } from '@shared/AppPermissions';
import { GooglePlaceService } from '@shared/common/google-place/google-place.service';
import { SourceContactListComponent } from '@shared/common/source-contact-list/source-contact-list.component';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { StatesService } from '@root/store/states-store/states.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { CreateEntityDialogData } from '@shared/common/create-entity-dialog/models/create-entity-dialog-data.interface';
import { EntityTypeSys } from '@app/crm/leads/entity-type-sys.enum';
import { DxValidationGroupComponent } from 'devextreme-angular';
import { AddressChanged } from '@shared/common/create-entity-dialog/address-fields/address-changed.interface';
import { Property } from '@shared/common/create-entity-dialog/models/property.type';
import { Address } from '@shared/common/create-entity-dialog/models/address.model';
import { Contact } from '@shared/common/create-entity-dialog/models/contact.interface';
import { Phone } from '@shared/common/create-entity-dialog/models/phone.model';
import { Link } from '@shared/common/create-entity-dialog/models/link.model';
import { Email } from '@shared/common/create-entity-dialog/models/email.model';
import { HttpClient } from '@angular/common/http';
import { ODataService } from '@shared/common/odata/odata.service';
import { LeadFields } from '@app/crm/leads/lead-fields.enum';
import { PipelinesStoreSelectors } from '@app/crm/store';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { LeadDto } from '@app/crm/leads/lead-dto.interface';
import { UploadPhotoData } from '@app/shared/common/upload-photo-dialog/upload-photo-data.interface';
import { UploadPhotoResult } from '@app/shared/common/upload-photo-dialog/upload-photo-result.interface';
import { AddressFieldsComponent } from './address-fields/address-fields.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { Country } from '@shared/AppEnums';

@Component({
    templateUrl: 'create-entity-dialog.component.html',
    styleUrls: [
        '../../../app/shared/common/styles/form.less',
        '../../../app/shared/common/toolbar/toolbar.component.less',
        'create-entity-dialog.component.less'
    ],
    providers: [
        CacheHelper,
        ContactServiceProxy,
        ContactPhotoServiceProxy,
        GooglePlaceService,
        ToolbarService
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEntityDialogComponent implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild('stagesList', { static: false }) stagesComponent: StaticListComponent;
    @ViewChild('statusesList', { static: false }) statusComponent: StaticListComponent;
    @ViewChild(RatingComponent, { static: false }) ratingComponent: RatingComponent;
    @ViewChild(TagsListComponent, { static: false }) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent, { static: false }) listsComponent: ListsListComponent;
    @ViewChild(TypesListComponent, { static: false }) partnerTypesComponent: TypesListComponent;
    @ViewChild(UserAssignmentComponent, { static: false }) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(SourceContactListComponent, { static: false }) sourceComponent: SourceContactListComponent;
    @ViewChild('propertyValidationGroup', { static: false }) propertyValidationGroup: DxValidationGroupComponent;
    @ViewChild('propertyAddressComponent', { static: false }) propertyAddressComponent: AddressFieldsComponent;
    @ViewChildren('linksComponent') linkComponents: QueryList<DxTextBoxComponent>;
    @ViewChild('dialogScroll', { static: false }) dialogScroll: DxScrollViewComponent;

    showPropertyFields: boolean = this.data.entityTypeSysId === EntityTypeSys.PropertyAcquisition;
    showPropertiesDropdown: boolean = this.data.entityTypeSysId && this.data.entityTypeSysId.startsWith(EntityTypeSys.PropertyRentAndSale);

    @HostBinding('class.hidePhotoArea') hidePhotoArea: boolean = this.data.hidePhotoArea || this.showPropertyFields;
    @HostBinding('class.hideToolbar') hideToolbar: boolean = this.data.hideToolbar;

    currentUserId = abp.session.userId;
    person = new PersonInfoDto();
    invoiceSettings: InvoiceSettings = new InvoiceSettings();
    currencyFormat = { style: 'currency', currency: 'USD', useGrouping: true };

    emailsComponent: any;
    phonesComponent: any;

    private lookupTimeout;
    private checkValidTimeout;
    private readonly SAVE_OPTION_DEFAULT = 2;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';
    private similarCustomersSubscription: Subscription;
    private similarCustomersTimeout: any;
    private readonly cacheKey = this.cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, 'CreateEntityDialog');
    statuses = Object.keys(ContactStatus).map(status => {
        return {
            id: ContactStatus[status],
            name: status,
            displayName: this.ls.l(status)
        }
    });
    stages: any[] = [];
    stageId: number;
    statusId = ContactStatus.Active;
    defaultStageSortOrder = 0;
    partnerTypes: any[] = [];
    saveButtonId = 'saveClientOptions';
    masks = AppConsts.masks;
    emailRegEx = AppConsts.regexPatterns.email;
    urlRegEx = AppConsts.regexPatterns.url;
    companies: OrganizationShortInfo[] = [];
    company: string = this.data.company;
    notes = '';
    ratingValue;
    sourceContactId: number;
    companyValidators: any = [];
    emailValidators: any = [];
    phoneValidators: any = [];
    linkValidators: any = [];
    emailsTypeDefault = 'P';
    phonesTypeDefault = 'M';
    linksTypeDefault = '-';
    addressesTypeDefault = 'H';
    addressTypes$: Observable<AddressUsageTypeDto[]> = this.store$.pipe(
        select(AddressUsageTypesStoreSelectors.getAddressUsageTypes),
        filter(types => !!types)
    );
    phoneTypes$: Observable<PhoneUsageTypeDto[]> = this.store$.pipe(
        select(PhoneUsageTypesStoreSelectors.getPhoneUsageTypes),
        filter(types => !!types)
    );
    emailTypes$: Observable<EmailUsageTypeDto[]> = this.store$.pipe(
        select(EmailUsageTypesStoreSelectors.getEmailUsageTypes),
        filter(types => !!types)
    );
    linkTypes$: Observable<ContactLinkTypeDto[]> =  this.store$.pipe(
        select(ContactLinkTypesStoreSelectors.getContactLinkTypes),
        filter(types => !!types),
        map((types: ContactLinkTypeDto[]) => types.map((entity: ContactLinkTypeDto) => {
            entity['uri'] = entity.name.replace(/ /g, '');
            return entity;
        }))
    );
    googleAutoComplete: boolean = Boolean(window['google']);
    photoOriginalData: string;
    photoThumbnailData: string;
    photoSourceData: string;
    addButtonVisible = {
        emails: false,
        phones: false,
        links: false,
        addresses: false
    };
    contact: Contact = {
        emails: [ new Email(this.emailsTypeDefault) ],
        phones: [ new Phone(this.phonesTypeDefault) ],
        links: [ new Link(this.linksTypeDefault) ],
        addresses: [ new Address(this.addressesTypeDefault) ]
    };
    property: Property = {
        propertyId: undefined,
        name: undefined,
        note: undefined,
        address: new Address()
    };
    similarCustomers: SimilarContactOutput[] = [];
    similarCustomersDialog: any;
    contactName = '';
    get title(): string {
        return this.showPropertyFields ? undefined : this.contactName;
    }
    jobTitle: string;
    isTitleValid = true;
    buttons: IDialogButton[] = [
        {
            id: this.saveButtonId,
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this),
            contextMenu: {
                items: [
                    { text: this.ls.l('SaveAndAddNew'), selected: false },
                    { text: this.ls.l('SaveAndExtend'), selected: false, visible: !this.data.hideSaveAndExtend },
                    { text: this.ls.l('SaveAndClose'), selected: false }
                ],
                defaultIndex: this.SAVE_OPTION_DEFAULT,
                cacheKey: this.cacheKey
            }
        }
    ];
    contactGroups = ContactGroup;

    isUserSelected = true;
    isPartnerTypeSelected = false;
    isStageSelected = true;
    isStatusSelected = false;
    isListsSelected = false;
    isTagsSelected = false;
    isRatingSelected = false;
    isSourceSelected = false;

    isAssignDisabled: boolean = !this.permissionService.checkCGPermission(
        [this.data.customerType],
        'ManageAssignments'
    );
    isListAndTagsDisabled: boolean = !this.permissionService.checkCGPermission([this.data.customerType]);
    isRatingAndStarsDisabled: boolean = !this.permissionService.checkCGPermission([this.data.customerType]);
    assignedUsersSelector = this.getAssignedUsersSelector();
    hideCompanyField: boolean = this.data.hideCompanyField;
    hideLinksField: boolean = this.data.hideLinksField;
    hideNotesField: boolean = this.data.hideNotesField;
    disallowMultipleItems: boolean = this.data.disallowMultipleItems;
    showBankCodeField: boolean = this.userManagementService.checkBankCodeFeature();
    dontCheckSimilarEntities: boolean = this.data.dontCheckSimilarEntities;
    dealAmount: number;
    installmentAmount: number;
    bankCode: string;
    today: Date = new Date();
    readonly leadFields: KeysEnum<LeadDto> = LeadFields;
    properties$: Observable<{ PropertyId: number, PropertyName: string }[]> = this.store$.pipe(
        select(PipelinesStoreSelectors.getPropertiesPipeline()),
        switchMap((propertiesPipeline: PipelineDto) => {
            const finalStage = propertiesPipeline && propertiesPipeline.stages.filter((stage: StageDto) => {
                return stage.isFinal;
            }).pop();
            return this.httpClient.get(
                this.oDataService.getODataUrl('Lead', {
                    [this.leadFields.PipelineId]: propertiesPipeline && propertiesPipeline.id,
                    [this.leadFields.StageId]: finalStage && finalStage.id
                }),
                {
                    headers: {
                        Authorization: 'Bearer ' + abp.auth.getToken()
                    },
                    params: {
                        $select: [ this.leadFields.PropertyId, this.leadFields.PropertyName ].join(',')
                    }
                }
            );
        }),
        pluck('value')
    );
    nameRegex = AppConsts.regexPatterns.fullName;
    propertyId: number;

    constructor(
        public dialog: MatDialog,
        public contactProxy: ContactServiceProxy,
        private contactService: ContactsService,
        private cacheService: CacheService,
        private router: Router,
        private contactPhoneService: ContactPhoneServiceProxy,
        private contactEmailService: ContactEmailServiceProxy,
        private contactAddressService: ContactAddressServiceProxy,
        private nameParser: NameParserService,
        private pipelineService: PipelineService,
        private invoicesService: InvoicesService,
        private orgServiceProxy: OrganizationContactServiceProxy,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private cacheHelper: CacheHelper,
        private dialogRef: MatDialogRef<CreateEntityDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        private store$: Store<RootStore.State>,
        private statesService: StatesService,
        private permissionService: AppPermissionService,
        private userManagementService: UserManagementService,
        private httpClient: HttpClient,
        private oDataService: ODataService,
        private sessionService: AppSessionService,
        public ls: AppLocalizationService,
        public toolbarService: ToolbarService,
        @Inject(MAT_DIALOG_DATA) public data: CreateEntityDialogData
    ) {}

    ngOnInit() {
        this.addressTypesLoad();
        this.phoneTypesLoad();
        this.emailTypesLoad();
        this.invoiceSettingsLoad();
        if (!this.hideLinksField)
            this.linkTypesLoad();
        if (this.data.isInLeadMode)
            this.leadStagesLoad();
    }

    ngAfterViewInit() {
        if (this.sourceComponent)
            this.sourceComponent.loadSourceContacts();
    }

    private createEntity(): void {
        this.modalDialog.startLoading();
        let assignedUserId = this.userAssignmentComponent && this.userAssignmentComponent.selectedItemKey;
        let stageId = this.stageId;
        let lists = this.listsComponent && this.listsComponent.selectedItems;
        let tags = this.tagsComponent && this.tagsComponent.selectedItems;
        let partnerTypeName = this.partnerTypesComponent && this.partnerTypesComponent.selectedItems.length
            ? this.partnerTypesComponent.selectedItems[0].name
            : undefined;
        let trackingInfo = new TrackingInfo();
        trackingInfo.channelCode = 'CRM';
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
            ratingId: this.isRatingAndStarsDisabled ? undefined : this.ratingValue,
            contactGroupId: this.data.customerType,
            partnerTypeName: partnerTypeName,
            sourceContactId: this.sourceContactId,
            trackingInfo: trackingInfo,
            parentContactId: this.data.parentId,
            dealAmount: this.dealAmount,
            installmentAmount: this.installmentAmount,
            bankCode: this.bankCode && this.bankCode !== '????' ? this.bankCode : null,
            bankCodeSource: this.bankCode && this.bankCode !== '????' ? 'CRM' : null,
            leadTypeId: this.data.entityTypeId,
            isActive: this.statusId == ContactStatus.Active,
            isProspective: !!this.data.isInLeadMode && !this.data.parentId
        };
        if (this.disallowMultipleItems) {
            dataObj.emailAddress = dataObj.emailAddresses[0];
            dataObj.phoneNumber = dataObj.phoneNumbers[0];
            dataObj.address = dataObj.addresses[0];
        }
        if (this.showPropertyFields) {
            let state = this.property.address.state;
            dataObj.propertyInfo = PropertyInput.fromJS({
                propertyId: this.propertyId,
                name: this.property.name,
                note: this.property.note,
                address: CreateContactAddressInput.fromJS({
                    streetAddress: this.property.address.streetAddress,
                    neighborhood: this.property.address.neighborhood,
                    city: this.property.address.city,
                    stateId: state && state.code,
                    stateName: state && state.name,
                    zip: this.property.address.zip,
                    countryId: this.property.address.countryCode
                })
            });
        } else if (this.showPropertiesDropdown) {
            dataObj.propertyInfo = {
                propertyId: this.propertyId
            };
        }

        this.clearSimilarCustomersCheck();
        let saveButton: any = document.getElementById(this.saveButtonId);
        saveButton.disabled = true;
        const createModel = this.data.createModel || CreateOrUpdateContactInput;
        let createContactInput = createModel.fromJS(dataObj);

        const createMethod = this.data.createMethod || this.contactProxy.createOrUpdateContact.bind(this.contactProxy);
        createMethod(createContactInput).pipe(
            finalize(() => { saveButton.disabled = false; this.modalDialog.finishLoading(); })
        ).subscribe((result: CreateOrUpdateContactOutput) => {
            dataObj.id = result.contactId;
            dataObj.leadId = result.leadId;
            this.afterSave(dataObj);
        });
    }

    private afterSave(data): void {
        if (!this.data.refreshParent) {
            this.close(data);
        } else if (this.buttons[0].contextMenu.items[0].selected) {
            this.resetFullDialog(false, false);
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.data.refreshParent();
        } else if (this.buttons[0].contextMenu.items[1].selected) {
            this.redirectToClientDetails(data.id, data.leadId);
            this.data.refreshParent();
        } else {
            this.data.refreshParent();
            this.close();
        }
    }

    save(): void {
        if (this.showPropertyFields && !this.property.name) {
            this.isTitleValid = false;
            return this.notifyService.error(this.ls.l('RequiredField', this.ls.l('PropertyName')));
        }

        if (!this.person.firstName && !this.person.lastName && (this.hideCompanyField || !this.company)
            && !this.contact.emails[0].email && !this.contact.phones[0].number
        ) {
            this.isTitleValid = this.showPropertyFields || false;
            return this.notifyService.error(this.ls.l('RequiredContactInfoIsMissing'));
        }

        if (this.contactName && !ValidationHelper.ValidateName(this.contactName)) {
            this.isTitleValid = false;
            return this.notifyService.error(this.ls.l('FullNameIsNotValid'));
        }

        if ((this.propertyValidationGroup && !this.propertyValidationGroup.instance.validate().isValid) ||
            !this.validateMultiple(this.emailValidators) ||
            !this.validateMultiple(this.phoneValidators) ||
            (!this.hideCompanyField && !this.validateCompanyName()) ||
            (!this.hideLinksField && !this.validateMultiple(this.linkValidators))
        )
            return;

        if (!this.disallowMultipleItems) {
            if (['emails', 'phones', 'links', 'addresses'].some((type: string) => {
                let result = this.checkDuplicateContact(type);
                if (result)
                    this.notifyService.error(this.ls.l('DuplicateContactDetected', this.ls.l(type)));
                return result;
            })) return;
        }

        this.createEntity();
    }

    private validateMultiple(validators): boolean {
        return validators.every((v) => {
            return v.validate().isValid;
        });
    }

    getEmailContactInput() {
        return this.contact.emails.filter((obj: Email) => obj.email).map((val: Email) => {
            return {
                emailAddress: val.email,
                usageTypeId: val.type,
                isActive: true
            } as CreateContactEmailInput;
        });
    }

    getPhoneContactInput() {
        return this.contact.phones.map((val: Phone) => {
            return val.number && val.number != val.code ? {
                phoneNumber: val.number,
                phoneExtension: val.ext,
                isActive: true,
                usageTypeId: val.type
            } as CreateContactPhoneInput : undefined;
        }).filter(Boolean);
    }

    getLinkContactInput() {
        return this.contact.links.filter((obj: Link) => obj.url).map((val: Link) => {
            return {
                url: val.url,
                isActive: true,
                isCompany: val.isCompany,
                linkTypeId: val.type == this.linksTypeDefault ? undefined : val.type
            } as CreateContactLinkInput;
        });
    }

    getAddressContactInput() {
        return this.contact.addresses.map((address) => {
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
                address.countryCode) {
                return {
                    streetAddress: streetAddress,
                    neighborhood: address.neighborhood,
                    city: address.city,
                    stateId: address.state
                        ? this.statesService.getAdjustedStateCode(address.state.code, address.state.name)
                        : null,
                    stateName: address.state ? address.state.name : null,
                    zip: address.zip,
                    countryId: address.countryCode,
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

    showSimilarEntities(event) {
        if (this.similarCustomersDialog)
            this.similarCustomersDialog.close();

        this.similarCustomersDialog = this.dialog.open(SimilarEntitiesDialogComponent, {
            data: {
                similarCustomers: this.getSimilarContacts(),
                componentRef: this
            },
            hasBackdrop: false,
            position: this.getDialogPosition(event, 300)
        });
        event.stopPropagation();
    }

    getDialogPosition(event, shiftX) {
        return DialogService.calculateDialogPosition(event, event.target.closest('div'), shiftX, -12);
    }

    toggleStages() {
        this.stagesComponent.toggle();
    }

    toggleStatus() {
        this.statusComponent.toggle();
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

    checkSimilarEntities(field?, index?) {
        if (!this.dontCheckSimilarEntities) {
            let person = this.person,
                isPhone =  field == 'phones',
                isAddress = field == 'addresses',
                contact = field && this.contact[field][index];
            if (isPhone && contact.number == contact.code)
                return false;
            this.clearSimilarCustomersCheck();
            this.similarCustomersTimeout = setTimeout(() => {
                this.similarCustomersSubscription = this.contactProxy.getSimilarContacts(
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
                    isAddress && contact.countryCode || undefined,
                    this.data.customerType.toString()
                ).subscribe(response => {
                    if (response) {
                        if (field)
                            contact.similarCustomers = response;
                        else
                            this.similarCustomers = response;
                        this.changeDetectorRef.detectChanges();
                    }
                });
            }, 1000);
        }
    }

    clearSimilarCustomersCheck() {
        if (this.similarCustomersSubscription)
            this.similarCustomersSubscription.unsubscribe();
        clearTimeout(this.similarCustomersTimeout);
    }

    getSimilarCustomers(field) {
        return this.contact[field].reduce((similar, fields) => {
            return fields.similarCustomers ? similar.concat(fields.similarCustomers) : similar;
        }, []);
    }

    similarCustomersAvailable() {
        return Boolean(this.getSimilarContacts().length);
    }

    getInputElementValue(event) {
        return event.element.getElementsByTagName('input')[0].value;
    }

    updateContactAddressFields(event: AddressChanged, address: Address, i: number) {
        this.checkAddressControls(i);
        this.updateAddressFields(event, address);
    }

    updatePropertyAddress(address: AutocompleteAddress, applyForName = false) {
        if (applyForName)
            this.property.name = address.formatted_address;
        this.updateAddressFields(
            {
                address: address,
                addressInput: null
            },
            this.property.address
        );
        this.propertyAddressComponent.changeDetectorRef.detectChanges();
    }

    updateAddressFields(event: AddressChanged, address: Address) {
        let number = GooglePlaceService.getStreetNumber(event.address.address_components);
        let street = GooglePlaceService.getStreet(event.address.address_components);
        const countryCode = GooglePlaceService.getCountryCode(event.address.address_components);
        const stateCode = GooglePlaceService.getStateCode(event.address.address_components);
        const stateName = GooglePlaceService.getStateName(event.address.address_components);
        this.statesService.updateState(countryCode, stateCode, stateName);
        address.state = {
            code: stateCode,
            name: stateName
        };
        const countryName = GooglePlaceService.getCountryName(event.address.address_components);
        address.country = this.sessionService.getCountryNameByCode(countryCode) || countryName;
        address.zip = GooglePlaceService.getZipCode(event.address.address_components);
        address.neighborhood = GooglePlaceService.getNeighborhood(event.address.address_components);
        address.streetAddress = GooglePlaceService.getStreet(event.address.address_components);
        address.streetNumber = GooglePlaceService.getStreetNumber(event.address.address_components);
        address.countryCode = countryCode;
        address.address =  number ? number + ' ' + street : street;
        if (event.addressInput) {
            event.addressInput.nativeElement.value = address.address;
        }
        address.city = GooglePlaceService.getCity(event.address.address_components);
        this.changeDetectorRef.detectChanges();
    }

    onCustomStateCreate(e, i: number) {
        this.contact.addresses[i].state = {
            code: null,
            name: e.text
        };
        this.statesService.updateState(this.contact.addresses[i].countryCode, null, e.text);
        e.customItem = {
            code: null,
            name: e.text
        };
    }

    updateCountryInfo(countryName: string, addressIndex: number) {
        this.contact.addresses[addressIndex]['country'] =
            this.sessionService.getCountryNameByCode(
                this.contact.addresses[addressIndex].countryCode
            ) || countryName;
        this.changeDetectorRef.detectChanges();
    }

    addressTypesLoad() {
        this.store$.dispatch(new AddressUsageTypesStoreActions.LoadRequestAction());
    }

    phoneTypesLoad() {
        this.store$.dispatch(new PhoneUsageTypesStoreActions.LoadRequestAction());
    }

    emailTypesLoad() {
        this.store$.dispatch(new EmailUsageTypesStoreActions.LoadRequestAction());
    }

    linkTypesLoad() {
        this.store$.dispatch(new ContactLinkTypesStoreActions.LoadRequestAction());
    }

    onCountryChange(event, index) {
        this.checkAddressControls(index);
    }

    checkAddressControls(index: number) {
        clearTimeout(this.checkValidTimeout);
        this.checkValidTimeout = setTimeout(() => {
            let field = 'addresses';
            this.checkSimilarEntities(field, index);
            this.addButtonVisible[field] = this.checkEveryFieldItemValid(field) && !this.checkDuplicateContact(field);
            if (this.addButtonVisible[field]) {
                this.validateCompanyName();
            }
            this.changeDetectorRef.detectChanges();
        }, 300);
    }

    checkDuplicateContact(field) {
        return this.contact[field].some((checkItem, checkIndex) => {
            return !this.contact[field].every((item, index) => {
                return (index == checkIndex) || JSON.stringify(checkItem) != JSON.stringify(item);
            });
        });
    }

    addNewContact(field: string) {
        if (this.addButtonVisible[field] &&
            this.checkEveryFieldItemValid(field) &&
            !this.checkDuplicateContact(field)
        ) {
            this.contact[field].push({
                type: this[field + 'TypeDefault']
            });
            this.addButtonVisible[field] = false;
            this.changeDetectorRef.detectChanges();
        }
    }

    checkFieldValid(field: string, item) {
        let isObject = typeof(item) == 'object';
        if (field == 'emails')
            return this.validateEmailAddress(isObject ? item.email : item);
        else if (field == 'phones')
            return Boolean(isObject ? item.number : item);
        else if (field == 'links')
            return this.validateLinkAddress(isObject ? item.url : item);
        else if (field == 'addresses')
            return item.address && item.city && item.countryCode;
        else
            return false;
    }

    checkEveryFieldItemValid(field: string) {
        return this.contact[field].every((item) => {
            if (item.type)
                return this.checkFieldValid(field, item);
            else
                return false;
        });
    }

    emptyOrRemoveInput(field, index) {
        if (index || this.contact[field].length > 1) {
            this.contact[field].splice(index, 1);
            this.addButtonVisible[field] = this.checkEveryFieldItemValid(field)
                && !this.checkDuplicateContact(field);
        } else {
            this.contact[field][index] = {type: this[field + 'TypeDefault']};
            this.addButtonVisible[field] = false;
        }
        this.validateCompanyName();
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
        event.component.option('valueChangeEvent', event.component.option('isValid') ? 'change' : 'keyup');
    }

    onFieldChanged($event, field, i) {
        let value = this.getInputElementValue($event);
        this.addButtonVisible[field] = this.checkFieldValid(field, value) && !this.checkDuplicateContact(field);
        if (this.addButtonVisible[field]) {
            this.validateCompanyName();
        }
        this.checkSimilarEntities(field, i);
        this.changeDetectorRef.detectChanges();
    }

    onPhoneChanged(component, i) {
        setTimeout(() => {
            let field = 'phones';
            this.contact[field][i].code = component.getCountryCode();
            this.addButtonVisible[field] = !component.isEmpty() &&
                component.isValid() && !this.checkDuplicateContact(field);
            if (this.addButtonVisible[field]) {
                this.validateCompanyName();
            }
            this.checkSimilarEntities(field, i);
            this.changeDetectorRef.detectChanges();
        });
    }

    /**
     * If user hasn't entered company name - validate to check if he's entered fields related to company
     * (through dx-validation companyValidation method)
     */
    validateCompanyName(): boolean {
        let companyNameIsValid = true;
        if (!this.company && this.companyValidators[0]) {
            this.companyValidators[0].reset();
            companyNameIsValid = this.companyValidators[0].validate().isValid;
        }
        return companyNameIsValid;
    }

    onPhoneKeyUp(event) {
        if (event.keyCode == 8/*Backspace*/) {
            this.addButtonVisible['phones'] = false;
            this.changeDetectorRef.detectChanges();
        }
    }

    onLinkTypeChanged(event, linkIndex: number) {
        event.component.close();
        this.linkComponents.toArray()[linkIndex].instance.focus();
        this.validateCompanyName();
    }

    companyLookupItems($event) {
        let search = this.company = $event.event.target.value;
        if (this.companies.length)
            this.companies = [];

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            this.orgServiceProxy.getOrganizations(search, 10)
                .subscribe((res: OrganizationShortInfo[]) => {
                    if (search == this.company)
                        this.companies = res;
                    this.changeDetectorRef.detectChanges();
                    setTimeout(() => this.companyOptionChanged($event, true));
                });
        }, 500);
    }

    /**
     * Company name is required if there are some fields related to the company
     * @param options
     */
    companyValidation = (options) => {
        return options.value
               || (!this.jobTitle
                  && !this.contact.emails.some(email => email.type === 'C' && email.email)
                  && !this.contact.phones.some(phone => phone.type === 'C' && phone.number && phone.number !== phone.code)
                  && !this.contact.links.some(link => link.isCompany && link.url)
                  && !this.contact.addresses.some(address => address.type === 'C' && address.address)
               );
    }

    companyOptionChanged($event, forced: boolean = false) {
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
        const data: UploadPhotoData = {
            source: this.photoOriginalData,
            title: this.ls.l('AddLogo')
        };
        this.dialog.open(UploadPhotoDialogComponent, {
            data: data,
            hasBackdrop: true
        }).afterClosed().subscribe((result: UploadPhotoResult) => {
            if (result) {
                this.photoOriginalData = result.origImage;
                this.photoThumbnailData = result.thumbImage;
                this.photoSourceData = result.source;
                this.changeDetectorRef.detectChanges();
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

    resetFullDialog(showDialog: boolean = false, resetToolbar = true) {
        let resetInternal = () => {
            this.resetComponent(this.emailsComponent);
            this.phonesComponent.reset();
            this.addButtonVisible['emails'] = false;
            this.addButtonVisible['phones'] = false;
            this.addButtonVisible['links'] = false;
            this.addButtonVisible['addresses'] = false;
            this.contact.emails = [ new Email(this.emailsTypeDefault) ];
            this.contact.phones = [ new Phone(this.phonesTypeDefault) ];
            this.contact.links = [ new Link(this.linksTypeDefault) ];
            this.contact.addresses = [ new Address(this.addressesTypeDefault) ];
            this.notes = undefined;
            this.dealAmount = undefined;
            this.installmentAmount = undefined;
            this.bankCode = '????';

            this.person = new PersonInfoDto();
            this.addressTypesLoad();
            this.company = undefined;
            this.similarCustomers = [];
            this.photoOriginalData = undefined;
            this.photoThumbnailData = undefined;
            this.photoSourceData = undefined;
            this.contactName = '';
            this.partnerTypesComponent && this.partnerTypesComponent.reset();
            if (resetToolbar) {
                this.sourceContactId = undefined;
                this.isSourceSelected = false;
                this.tagsComponent && this.tagsComponent.reset();
                this.listsComponent && this.listsComponent.reset();

                if (this.userAssignmentComponent) {
                    this.userAssignmentComponent.selectedItemKey = this.currentUserId;
                }
                this.isStatusSelected = false;
                this.statusId = ContactStatus.Active;
                this.stageId = this.stages.length
                    ? this.stages.find(v => v.index === this.defaultStageSortOrder).id
                    : undefined;
                this.ratingComponent && this.ratingComponent.reset();
            }

            this.changeDetectorRef.detectChanges();
            setTimeout(() => {
                this.isTitleValid = this.modalDialog.titleComponent.isValid = true;
            });
        };

        if (showDialog)
            this.messageService.confirm('', this.ls.l('DiscardConfirmation'), (confirmed) => {
                if (confirmed)
                    resetInternal();
            });
        else
            resetInternal();

    }

    onSaveOptionSelectionChanged() {
        this.save();
    }

    onFullNameChanged(event) {
        if (!event.event && this.contactName != event.value)
            event.component.option('value', this.contactName);
    }

    onFullNameKeyUp(inputValue: string) {
        this.contactName = inputValue;
        this.nameParser.parseIntoPerson(this.contactName, this.person);
        this.checkSimilarEntities();
    }

    ngOnDestroy(): void {
        if (this.similarCustomersDialog)
            this.similarCustomersDialog.close();
    }

    leadStagesLoad() {
        this.modalDialog.startLoading();
        this.pipelineService.getPipelineDefinitionObservable(
            AppConsts.PipelinePurposeIds.lead,
            this.data.customerType,
            this.data.pipelineId
        ).pipe(first(), finalize(() => this.modalDialog.finishLoading())).subscribe(
            (pipeline: PipelineDto) => {
                this.stages = pipeline.stages.map((stage: StageDto) => {
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
            },
            () => this.modalDialog.finishLoading()
        );
    }

    invoiceSettingsLoad() {
        this.invoicesService.settings$.pipe(
            filter(Boolean), first()
        ).subscribe((settings: InvoiceSettings) => {
            this.invoiceSettings = settings;
            this.currencyFormat.currency = settings.currency;
            this.changeDetectorRef.detectChanges();
        });
    }

    onStagesChanged(event) {
        this.stageId = event.id;
        this.isStageSelected = true;
    }

    onStatusChanged(event) {
        this.statusId = event.id;
        this.isStatusSelected = true;
    }

    onPartnerTypeChanged(event) {
        this.partnerTypesComponent.apply();
        this.isPartnerTypeSelected = Boolean(event.selectedRowKeys.length);
        this.assignedUsersSelector = this.getAssignedUsersSelector();
    }

    getAssignmentsPermissionKey() {
        if (this.partnerTypesComponent && this.partnerTypesComponent.selectedItems.length)
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
        this.ratingValue = event.value;
        this.isRatingSelected = Boolean(event.value);
    }

    close(data?) {
        this.dialogRef.close(data);
    }

    getAssignedUsersSelector() {
        return select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, {
            contactGroup: this.data.customerType ? this.data.customerType : ContactGroup.Client
        });
    }

    onPartnerSourceSelected(event) {
        if (this.isSourceSelected = event.id != this.sourceContactId)
            this.isSourceSelected = Boolean(this.sourceContactId = event.id);
        else
            this.sourceContactId = undefined;
        this.togglePartnerSource();
    }

    checkPropertyNameValid(event) {
        this.isTitleValid = Boolean(event.target.value);
    }

    dropDownHover($event) {
        if (this.dialogScroll)
            this.dialogScroll.disabled = $event;
    }
}