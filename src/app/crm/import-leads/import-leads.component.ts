/** Core imports */
import { Component, Injector, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

/** Third party imports */
import pako from 'pako';
import * as moment from 'moment-timezone';
import { select } from '@ngrx/store';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';
import * as addressParser from 'parse-address';
import * as _ from 'underscore';

/** Application imports */
import { AppService } from '@app/app.service';
import { DateHelper } from '@shared/helpers/DateHelper';
import { ContactAssignedUsersStoreSelectors } from '@app/store';
import { ImportWizardService } from '@app/shared/common/import-wizard/import-wizard.service';
import { NameParserService } from '@shared/common/name-parser/name-parser.service';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { TagsListComponent } from '@app/shared/common/lists/tags-list/tags-list.component';
import { ListsListComponent } from '@app/shared/common/lists/lists-list/lists-list.component';
import { TypesListComponent } from '@app/shared/common/lists/types-list/types-list.component';
import { UserAssignmentComponent } from '@app/shared/common/lists/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '@app/shared/common/lists/rating/rating.component';
import { StarsListComponent } from '@app/crm/shared/stars-list/stars-list.component';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { ImportWizardComponent } from '@app/shared/common/import-wizard/import-wizard.component';
import { Country } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ZipCodeFormatterPipe } from '@shared/common/pipes/zip-code-formatter/zip-code-formatter.pipe';
import {
    ImportItemInput, ImportInput, ImportPersonalInput, ImportBusinessInput, ImportFullName, ImportAddressInput,
    ImportSubscriptionInput, CustomFieldsInput, ImportServiceProxy, ImportTypeInput, PartnerServiceProxy,
    GetImportStatusOutput, LayoutType, ImportClassificationInput, TimeOfDay, ImportPropertyInput, RecurringPaymentFrequency
} from '@shared/service-proxies/service-proxies';
import { ImportLeadsService } from './import-leads.service';
import { ImportStatus, ContactGroup } from '@shared/AppEnums';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';

@Component({
    templateUrl: 'import-leads.component.html',
    styleUrls: ['import-leads.component.less'],
    animations: [appModuleAnimation()],
    providers: [ ZipCodeFormatterPipe, PartnerServiceProxy ]
})
export class ImportLeadsComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(ImportWizardComponent, { static: false }) wizard: ImportWizardComponent;
    @ViewChild(UserAssignmentComponent, { static: false }) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(TagsListComponent, { static: false }) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent, { static: false }) listsComponent: ListsListComponent;
    @ViewChild(TypesListComponent, { static: false }) partnerTypesComponent: TypesListComponent;
    @ViewChild(RatingComponent, { static: false }) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent, { static: false }) starsListComponent: StarsListComponent;
    @ViewChild('stagesList', { static: false }) stagesComponent: StaticListComponent;

    private readonly MAX_REQUEST_SIZE = 55;

    private readonly USER_PASSWORD = 'userPassword';
    private readonly DATE_CREATED = 'dateCreated';
    private readonly FOLLOW_UP_DATE = 'followUpDate';
    private readonly LEAD_DEAL_AMOUNT = 'leadDealAmount';
    private readonly FULL_NAME_FIELD = 'personalInfo_fullName';
    private readonly NAME_PREFIX_FIELD = 'personalInfo_fullName_namePrefix';
    private readonly FIRST_NAME_FIELD = 'personalInfo_fullName_firstName';
    private readonly MIDDLE_NAME_FIELD = 'personalInfo_fullName_middleName';
    private readonly LAST_NAME_FIELD = 'personalInfo_fullName_lastName';
    private readonly NICK_NAME_FIELD = 'personalInfo_fullName_nickName';
    private readonly NAME_SUFFIX_FIELD = 'personalInfo_fullName_nameSuffix';
    private readonly COMPANY_NAME_FIELD = 'businessInfo_companyName';
    private readonly PERSONAL_DOB = 'personalInfo_doB';
    private readonly PERSONAL_GENDER = 'personalInfo_gender';
    private readonly PERSONAL_PHONE1 = 'personalInfo_phone1';
    private readonly PERSONAL_PHONE2 = 'personalInfo_phone2';
    private readonly PERSONAL_FULL_ADDRESS = 'personalInfo_fullAddress';
    private readonly PERSONAL_FULL_ADDRESS_STREET = 'personalInfo_fullAddress_street';
    private readonly PERSONAL_FULL_ADDRESS_NEIGHBORHOOD = 'personalInfo_fullAddress_neighborhood';
    private readonly PERSONAL_FULL_ADDRESS_ADDRESSLINE2 = 'personalInfo_fullAddress_addressline2';
    private readonly PERSONAL_FULL_ADDRESS_CITY = 'personalInfo_fullAddress_city';
    private readonly PERSONAL_FULL_ADDRESS_STATE_NAME = 'personalInfo_fullAddress_stateName';
    private readonly PERSONAL_FULL_ADDRESS_STATE_CODE = 'personalInfo_fullAddress_stateId';
    private readonly PERSONAL_FULL_ADDRESS_ZIP_CODE = 'personalInfo_fullAddress_zip';
    private readonly PERSONAL_FULL_ADDRESS_COUNTRY_NAME = 'personalInfo_fullAddress_countryName';
    private readonly PERSONAL_FULL_ADDRESS_COUNTRY_CODE = 'personalInfo_fullAddress_countryId';
    private readonly PERSONAL_FULL_ADDRESS2 = 'personalInfo_fullAddress2';
    private readonly PERSONAL_FULL_ADDRESS2_STREET = 'personalInfo_fullAddress2_street';
    private readonly PERSONAL_FULL_ADDRESS2_NEIGHBORHOOD = 'personalInfo_fullAddress2_neighborhood';
    private readonly PERSONAL_FULL_ADDRESS2_ADDRESSLINE2 = 'personalInfo_fullAddress2_addressline2';
    private readonly PERSONAL_FULL_ADDRESS2_CITY = 'personalInfo_fullAddress2_city';
    private readonly PERSONAL_FULL_ADDRESS2_STATE_NAME = 'personalInfo_fullAddress2_stateName';
    private readonly PERSONAL_FULL_ADDRESS2_STATE_CODE = 'personalInfo_fullAddress2_stateId';
    private readonly PERSONAL_FULL_ADDRESS2_ZIP_CODE = 'personalInfo_fullAddress2_zip';
    private readonly PERSONAL_FULL_ADDRESS2_COUNTRY_NAME = 'personalInfo_fullAddress2_countryName';
    private readonly PERSONAL_FULL_ADDRESS2_COUNTRY_CODE = 'personalInfo_fullAddress2_countryId';
    private readonly PERSONAL_FULL_ADDRESS3 = 'personalInfo_fullAddress3';
    private readonly PERSONAL_FULL_ADDRESS3_STREET = 'personalInfo_fullAddress3_street';
    private readonly PERSONAL_FULL_ADDRESS3_NEIGHBORHOOD = 'personalInfo_fullAddress3_neighborhood';
    private readonly PERSONAL_FULL_ADDRESS3_ADDRESSLINE2 = 'personalInfo_fullAddress3_addressline2';
    private readonly PERSONAL_FULL_ADDRESS3_CITY = 'personalInfo_fullAddress3_city';
    private readonly PERSONAL_FULL_ADDRESS3_STATE_NAME = 'personalInfo_fullAddress3_stateName';
    private readonly PERSONAL_FULL_ADDRESS3_STATE_CODE = 'personalInfo_fullAddress3_stateId';
    private readonly PERSONAL_FULL_ADDRESS3_ZIP_CODE = 'personalInfo_fullAddress3_zip';
    private readonly PERSONAL_FULL_ADDRESS3_COUNTRY_NAME = 'personalInfo_fullAddress3_countryName';
    private readonly PERSONAL_FULL_ADDRESS3_COUNTRY_CODE = 'personalInfo_fullAddress3_countryId';
    private readonly PERSONAL_IS_ACTIVE_MILITARY_DUTY = 'personalInfo_isActiveMilitaryDuty';
    private readonly PERSONAL_IS_US_CITIZEN = 'personalInfo_isUSCitizen';
    private readonly PERSONAL_IS_ACTIVE = 'personalInfo_isActive';
    private readonly PERSONAL_INTERESTS = 'personalInfo_interests';
    private readonly BUSINESS_IS_EMPLOYED = 'businessInfo_isEmployed';
    private readonly BUSINESS_AFFILIATE_CODE = 'businessInfo_affiliateCode';
    private readonly BUSINESS_DATE_FOUNDED = 'businessInfo_dateFounded';
    private readonly BUSINESS_EMPLOYMENT_START_DATE = 'businessInfo_employmentStartDate';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS = 'businessInfo_companyFullAddress';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_STREET = 'businessInfo_companyFullAddress_street';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_NEIGHBORHOOD = 'businessInfo_companyFullAddress_neighborhood';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_ADDRESSLINE2 = 'businessInfo_companyFullAddress_addressline2';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_CITY = 'businessInfo_companyFullAddress_city';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_STATE_NAME = 'businessInfo_companyFullAddress_stateName';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_STATE_CODE = 'businessInfo_companyFullAddress_stateId';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_ZIP_CODE = 'businessInfo_companyFullAddress_zip';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_COUNTRY_NAME = 'businessInfo_companyFullAddress_countryName';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_COUNTRY_CODE = 'businessInfo_companyFullAddress_countryId';
    private readonly BUSINESS_WORK_FULL_ADDRESS = 'businessInfo_workFullAddress';
    private readonly BUSINESS_WORK_FULL_ADDRESS_STREET = 'businessInfo_workFullAddress_street';
    private readonly BUSINESS_WORK_FULL_ADDRESS_NEIGHBORHOOD = 'businessInfo_workFullAddress_neighborhood';
    private readonly BUSINESS_WORK_FULL_ADDRESS_ADDRESSLINE2 = 'businessInfo_workFullAddress_addressline2';
    private readonly BUSINESS_WORK_FULL_ADDRESS_CITY = 'businessInfo_workFullAddress_city';
    private readonly BUSINESS_WORK_FULL_ADDRESS_STATE_NAME = 'businessInfo_workFullAddress_stateName';
    private readonly BUSINESS_WORK_FULL_ADDRESS_STATE_CODE = 'businessInfo_workFullAddress_stateId';
    private readonly BUSINESS_WORK_FULL_ADDRESS_ZIP_CODE = 'businessInfo_workFullAddress_zip';
    private readonly BUSINESS_WORK_FULL_ADDRESS_COUNTRY_NAME = 'businessInfo_workFullAddress_countryName';
    private readonly BUSINESS_WORK_FULL_ADDRESS_COUNTRY_CODE = 'businessInfo_workFullAddress_countryId';
    private readonly BUSINESS_ANNUAL_REVENUE = 'businessInfo_annualRevenue';
    private readonly PERSONAL_MOBILE_PHONE = 'personalInfo_mobilePhone';
    private readonly PERSONAL_HOME_PHONE = 'personalInfo_homePhone';
    private readonly BUSINESS_COMPANY_PHONE = 'businessInfo_companyPhone';
    private readonly BUSINESS_WORK_PHONE_1 = 'businessInfo_workPhone1';
    private readonly BUSINESS_WORK_PHONE_2 = 'businessInfo_workPhone2';
    private readonly BUSINESS_FAX = 'businessInfo_companyFaxNumber';
    private readonly PERSONAL_EMAIL1 = 'personalInfo_email1';
    private readonly PERSONAL_EMAIL2 = 'personalInfo_email2';
    private readonly PERSONAL_EMAIL3 = 'personalInfo_email3';
    private readonly BUSINESS_COMPANY_EMAIL = 'businessInfo_companyEmail';
    private readonly BUSINESS_WORK_EMAIL1 = 'businessInfo_workEmail1';
    private readonly BUSINESS_WORK_EMAIL2 = 'businessInfo_workEmail2';
    private readonly BUSINESS_WORK_EMAIL3 = 'businessInfo_workEmail3';
    private readonly PERSONAL_PREFERREDTOD = 'personalInfo_preferredToD';
    private readonly PERSONAL_CREDITSCORERATING = 'personalInfo_creditScoreRating';
    private readonly PERSONAL_AFFILIATE_CODE = 'personalInfo_affiliateCode';
    private readonly SUBSCRIPTION1_AMOUNT = 'subscription1_amount';
    private readonly SUBSCRIPTION2_AMOUNT = 'subscription2_amount';
    private readonly SUBSCRIPTION3_AMOUNT = 'subscription3_amount';
    private readonly SUBSCRIPTION4_AMOUNT = 'subscription4_amount';
    private readonly SUBSCRIPTION5_AMOUNT = 'subscription5_amount';
    private readonly SUBSCRIPTION1_START_DATE = 'subscription1_startDate';
    private readonly SUBSCRIPTION2_START_DATE = 'subscription2_startDate';
    private readonly SUBSCRIPTION3_START_DATE = 'subscription3_startDate';
    private readonly SUBSCRIPTION4_START_DATE = 'subscription4_startDate';
    private readonly SUBSCRIPTION5_START_DATE = 'subscription5_startDate';
    private readonly SUBSCRIPTION1_END_DATE = 'subscription1_endDate';
    private readonly SUBSCRIPTION2_END_DATE = 'subscription2_endDate';
    private readonly SUBSCRIPTION3_END_DATE = 'subscription3_endDate';
    private readonly SUBSCRIPTION4_END_DATE = 'subscription4_endDate';
    private readonly SUBSCRIPTION5_END_DATE = 'subscription5_endDate';
    private readonly SUBSCRIPTION1_PAYMENT_PERIOD_TYPE = 'subscription1_paymentPeriodType';
    private readonly SUBSCRIPTION2_PAYMENT_PERIOD_TYPE = 'subscription2_paymentPeriodType';
    private readonly SUBSCRIPTION3_PAYMENT_PERIOD_TYPE = 'subscription3_paymentPeriodType';
    private readonly SUBSCRIPTION4_PAYMENT_PERIOD_TYPE = 'subscription4_paymentPeriodType';
    private readonly SUBSCRIPTION5_PAYMENT_PERIOD_TYPE = 'subscription5_paymentPeriodType';
    private readonly CLASSIFICATION_INFO_LISTS = 'classificationInfo_lists';
    private readonly CLASSIFICATION_INFO_TAGS = 'classificationInfo_tags';
    private readonly PROPERTYINFO_ADDRESS = 'propertyInfo_propertyAddress';
    private readonly PROPERTYINFO_ADDRESS_STREET = 'propertyInfo_propertyAddress_street';
    private readonly PROPERTYINFO_ADDRESS_NEIGHBORHOOD = 'propertyInfo_propertyAddress_neighborhood';
    private readonly PROPERTYINFO_ADDRESS_ADDRESSLINE2 = 'propertyInfo_propertyAddress_addressline2';
    private readonly PROPERTYINFO_ADDRESS_CITY = 'propertyInfo_propertyAddress_city';
    private readonly PROPERTYINFO_ADDRESS_STATE_NAME = 'propertyInfo_propertyAddress_stateName';
    private readonly PROPERTYINFO_ADDRESS_STATE_CODE = 'propertyInfo_propertyAddress_stateId';
    private readonly PROPERTYINFO_ADDRESS_ZIP_CODE = 'propertyInfo_propertyAddress_zip';
    private readonly PROPERTYINFO_ADDRESS_COUNTRY_NAME = 'propertyInfo_propertyAddress_countryName';
    private readonly PROPERTYINFO_ADDRESS_COUNTRY_CODE = 'propertyInfo_propertyAddress_countryId';

    private readonly FIELDS_TO_CAPITALIZE = [
        this.FIRST_NAME_FIELD,
        this.MIDDLE_NAME_FIELD,
        this.LAST_NAME_FIELD,
        this.NICK_NAME_FIELD,
        this.NAME_PREFIX_FIELD,
        this.NAME_SUFFIX_FIELD,
        this.PERSONAL_FULL_ADDRESS_CITY,
        this.PERSONAL_FULL_ADDRESS2_CITY,
        this.PERSONAL_FULL_ADDRESS3_CITY,
        this.BUSINESS_COMPANY_FULL_ADDRESS_CITY,
        this.BUSINESS_WORK_FULL_ADDRESS_CITY,
        this.PROPERTYINFO_ADDRESS_CITY
    ];

    private readonly FIELDS_ARRAY = [
        this.CLASSIFICATION_INFO_LISTS,
        this.CLASSIFICATION_INFO_TAGS,
        this.PERSONAL_INTERESTS
    ];

    private readonly FIELDS_BOOLEAN = [
        this.BUSINESS_IS_EMPLOYED,
        this.PERSONAL_IS_US_CITIZEN,
        this.PERSONAL_IS_ACTIVE_MILITARY_DUTY,
        this.PERSONAL_IS_ACTIVE
    ];

    private readonly FIELDS_PHONE = [
        this.PERSONAL_PHONE1,
        this.PERSONAL_PHONE2,
        this.PERSONAL_MOBILE_PHONE,
        this.PERSONAL_HOME_PHONE,
        this.BUSINESS_COMPANY_PHONE,
        this.BUSINESS_WORK_PHONE_1,
        this.BUSINESS_WORK_PHONE_2,
        this.BUSINESS_FAX
    ];

    private readonly FIELDS_ORDER = [
        this.NAME_PREFIX_FIELD,
        this.FIRST_NAME_FIELD,
        this.MIDDLE_NAME_FIELD,
        this.LAST_NAME_FIELD,
        this.NAME_SUFFIX_FIELD,
        this.NICK_NAME_FIELD,
        this.COMPANY_NAME_FIELD
    ];

    private readonly FIELDS_AMOUNT = [
        this.LEAD_DEAL_AMOUNT,
        this.BUSINESS_ANNUAL_REVENUE,
        this.SUBSCRIPTION1_AMOUNT,
        this.SUBSCRIPTION2_AMOUNT,
        this.SUBSCRIPTION3_AMOUNT,
        this.SUBSCRIPTION4_AMOUNT,
        this.SUBSCRIPTION5_AMOUNT
    ];

    private readonly FIELDS_DATE_TIME = [
        this.DATE_CREATED,
        this.FOLLOW_UP_DATE
    ];

    private readonly FIELDS_DATE = [
        this.PERSONAL_DOB,
        this.BUSINESS_DATE_FOUNDED,
        this.BUSINESS_EMPLOYMENT_START_DATE,
        this.SUBSCRIPTION1_START_DATE,
        this.SUBSCRIPTION2_START_DATE,
        this.SUBSCRIPTION3_START_DATE,
        this.SUBSCRIPTION4_START_DATE,
        this.SUBSCRIPTION5_START_DATE,
        this.SUBSCRIPTION1_END_DATE,
        this.SUBSCRIPTION2_END_DATE,
        this.SUBSCRIPTION3_END_DATE,
        this.SUBSCRIPTION4_END_DATE,
        this.SUBSCRIPTION5_END_DATE
    ];

    private readonly FIELDS_EMAIL = [
        this.PERSONAL_EMAIL1,
        this.PERSONAL_EMAIL2,
        this.PERSONAL_EMAIL3,
        this.BUSINESS_WORK_EMAIL1,
        this.BUSINESS_WORK_EMAIL2,
        this.BUSINESS_WORK_EMAIL3
    ];

    private readonly FIELDS_CAPTIONS = [
        this.PERSONAL_FULL_ADDRESS_STREET,
        this.PERSONAL_FULL_ADDRESS_NEIGHBORHOOD,
        this.PERSONAL_FULL_ADDRESS_ADDRESSLINE2,
        this.PERSONAL_FULL_ADDRESS_CITY,
        this.PERSONAL_FULL_ADDRESS_STATE_NAME,
        this.PERSONAL_FULL_ADDRESS_STATE_CODE,
        this.PERSONAL_FULL_ADDRESS_ZIP_CODE,
        this.PERSONAL_FULL_ADDRESS_COUNTRY_NAME,
        this.PERSONAL_FULL_ADDRESS_COUNTRY_CODE,
        this.PERSONAL_FULL_ADDRESS2_STREET,
        this.PERSONAL_FULL_ADDRESS2_NEIGHBORHOOD,
        this.PERSONAL_FULL_ADDRESS2_ADDRESSLINE2,
        this.PERSONAL_FULL_ADDRESS2_CITY,
        this.PERSONAL_FULL_ADDRESS2_STATE_NAME,
        this.PERSONAL_FULL_ADDRESS2_STATE_CODE,
        this.PERSONAL_FULL_ADDRESS2_ZIP_CODE,
        this.PERSONAL_FULL_ADDRESS2_COUNTRY_NAME,
        this.PERSONAL_FULL_ADDRESS2_COUNTRY_CODE,
        this.PERSONAL_FULL_ADDRESS3_STREET,
        this.PERSONAL_FULL_ADDRESS3_NEIGHBORHOOD,
        this.PERSONAL_FULL_ADDRESS3_ADDRESSLINE2,
        this.PERSONAL_FULL_ADDRESS3_CITY,
        this.PERSONAL_FULL_ADDRESS3_STATE_NAME,
        this.PERSONAL_FULL_ADDRESS3_STATE_CODE,
        this.PERSONAL_FULL_ADDRESS3_ZIP_CODE,
        this.PERSONAL_FULL_ADDRESS3_COUNTRY_NAME,
        this.PERSONAL_FULL_ADDRESS3_COUNTRY_CODE,
        this.BUSINESS_COMPANY_FULL_ADDRESS_STREET,
        this.BUSINESS_COMPANY_FULL_ADDRESS_NEIGHBORHOOD,
        this.BUSINESS_COMPANY_FULL_ADDRESS_ADDRESSLINE2,
        this.BUSINESS_COMPANY_FULL_ADDRESS_CITY,
        this.BUSINESS_COMPANY_FULL_ADDRESS_STATE_NAME,
        this.BUSINESS_COMPANY_FULL_ADDRESS_STATE_CODE,
        this.BUSINESS_COMPANY_FULL_ADDRESS_ZIP_CODE,
        this.BUSINESS_COMPANY_FULL_ADDRESS_COUNTRY_NAME,
        this.BUSINESS_COMPANY_FULL_ADDRESS_COUNTRY_CODE,
        this.BUSINESS_WORK_FULL_ADDRESS_STREET,
        this.BUSINESS_WORK_FULL_ADDRESS_NEIGHBORHOOD,
        this.BUSINESS_WORK_FULL_ADDRESS_ADDRESSLINE2,
        this.BUSINESS_WORK_FULL_ADDRESS_CITY,
        this.BUSINESS_WORK_FULL_ADDRESS_STATE_NAME,
        this.BUSINESS_WORK_FULL_ADDRESS_STATE_CODE,
        this.BUSINESS_WORK_FULL_ADDRESS_ZIP_CODE,
        this.BUSINESS_WORK_FULL_ADDRESS_COUNTRY_NAME,
        this.BUSINESS_WORK_FULL_ADDRESS_COUNTRY_CODE,
        this.PROPERTYINFO_ADDRESS_STREET,
        this.PROPERTYINFO_ADDRESS_NEIGHBORHOOD,
        this.PROPERTYINFO_ADDRESS_ADDRESSLINE2,
        this.PROPERTYINFO_ADDRESS_CITY,
        this.PROPERTYINFO_ADDRESS_STATE_NAME,
        this.PROPERTYINFO_ADDRESS_STATE_CODE,
        this.PROPERTYINFO_ADDRESS_ZIP_CODE,
        this.PROPERTYINFO_ADDRESS_COUNTRY_NAME,
        this.PROPERTYINFO_ADDRESS_COUNTRY_CODE
    ];

    private readonly FIELDS_TO_IGNORE = [
        this.PERSONAL_CREDITSCORERATING
    ];

    private readonly FIELDS_PAYMENT_PERIOD_TYPE = [
        this.SUBSCRIPTION1_PAYMENT_PERIOD_TYPE,
        this.SUBSCRIPTION2_PAYMENT_PERIOD_TYPE,
        this.SUBSCRIPTION3_PAYMENT_PERIOD_TYPE,
        this.SUBSCRIPTION4_PAYMENT_PERIOD_TYPE,
        this.SUBSCRIPTION5_PAYMENT_PERIOD_TYPE
    ];

    importStatuses: any = ImportStatus;
    importStatus: ImportStatus;
    hideLeftMenu = false;

    totalCount = 0;
    importedCount = 0;
    failedCount = 0;
    mappingFields: any[] = [];
    importTypeIndex = 0;
    importType = ImportTypeInput.Lead;
    contactGroupId = ContactGroup.Client;
    manageCGPermission = '';
    fullName: ImportFullName;
    fullAddress: ImportAddressInput;
    sendWelcomeEmail = false;
    emailInvitation = false;
    isUserSelected = false;
    isListsSelected = false;
    isTagsSelected = false;
    isStarSelected = false;
    toolbarConfig: ToolbarGroupModel[] = [];
    selectedClientKeys: number[] = [];
    selectedStageId: number;
    selectedPartnerTypeName: string;
    ratingValue;
    stages = [];
    partnerTypes = [];
    private pipelinePurposeId: string = AppConsts.PipelinePurposeIds.lead;


    readonly importSubscriptionFields = {
        productCode: '',
        paymentPeriodType: '',
        startDate: moment(),
        endDate: moment()
    }

    readonly mappingObjectNames = {
        personalInfo: ImportPersonalInput.fromJS({interests: []}),
        fullName: ImportFullName.fromJS({}),
        fullAddress: ImportAddressInput.fromJS({}),
        fullAddress2: ImportAddressInput.fromJS({}),
        fullAddress3: ImportAddressInput.fromJS({}),
        businessInfo: ImportBusinessInput.fromJS({}),
        companyFullAddress: ImportAddressInput.fromJS({}),
        workFullAddress: ImportAddressInput.fromJS({}),
        customFields: CustomFieldsInput.fromJS({}),
        requestCustomInfo: CustomFieldsInput.fromJS({}),
        subscription1: this.importSubscriptionFields,
        subscription2: this.importSubscriptionFields,
        subscription3: this.importSubscriptionFields,
        subscription4: this.importSubscriptionFields,
        subscription5: this.importSubscriptionFields,
        propertyInfo: ImportPropertyInput.fromJS({}),
        propertyAddress: ImportAddressInput.fromJS({}),
        classificationInfo: ImportClassificationInput.fromJS({lists: [], tags: []})
    };

    readonly countryFields = {
        personal: {
            name: [this.PERSONAL_FULL_ADDRESS_COUNTRY_NAME, this.PERSONAL_FULL_ADDRESS2_COUNTRY_NAME, this.PERSONAL_FULL_ADDRESS3_COUNTRY_NAME],
            code: [this.PERSONAL_FULL_ADDRESS_COUNTRY_CODE, this.PERSONAL_FULL_ADDRESS2_COUNTRY_CODE, this.PERSONAL_FULL_ADDRESS3_COUNTRY_CODE]
        },
        company: {
            name: this.BUSINESS_COMPANY_FULL_ADDRESS_COUNTRY_NAME,
            code: this.BUSINESS_COMPANY_FULL_ADDRESS_COUNTRY_CODE
        },
        work: {
            name: this.BUSINESS_WORK_FULL_ADDRESS_COUNTRY_NAME,
            code: this.BUSINESS_WORK_FULL_ADDRESS_COUNTRY_CODE
        }
    };

    readonly phoneRelatedCountryFields = {
        [this.PERSONAL_PHONE1]: this.countryFields.personal,
        [this.PERSONAL_PHONE2]: this.countryFields.personal,
        [this.PERSONAL_HOME_PHONE]: this.countryFields.personal,
        [this.PERSONAL_MOBILE_PHONE]: this.countryFields.personal,
        [this.BUSINESS_COMPANY_PHONE]: this.countryFields.company,
        [this.BUSINESS_WORK_PHONE_1]: this.countryFields.work,
        [this.BUSINESS_WORK_PHONE_2]: this.countryFields.work,
        [this.BUSINESS_FAX]: this.countryFields.company
    };

    readonly compareFields: any = [
        [this.FIRST_NAME_FIELD + ':' + this.LAST_NAME_FIELD],
        [this.PERSONAL_EMAIL1, this.PERSONAL_EMAIL2, this.PERSONAL_EMAIL3, this.BUSINESS_COMPANY_EMAIL, this.BUSINESS_WORK_EMAIL1, this.BUSINESS_WORK_EMAIL2, this.BUSINESS_WORK_EMAIL3],
        [this.PERSONAL_MOBILE_PHONE, this.PERSONAL_HOME_PHONE, this.BUSINESS_COMPANY_PHONE, this.BUSINESS_WORK_PHONE_1, this.BUSINESS_WORK_PHONE_2],
        [this.PERSONAL_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD, this.BUSINESS_COMPANY_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD, this.BUSINESS_WORK_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD],
        [this.PERSONAL_FULL_ADDRESS2 + ':' + this.LAST_NAME_FIELD, this.BUSINESS_COMPANY_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD, this.BUSINESS_WORK_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD],
        [this.PERSONAL_FULL_ADDRESS3 + ':' + this.LAST_NAME_FIELD, this.BUSINESS_COMPANY_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD, this.BUSINESS_WORK_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD]
    ];

    private rootComponent: any;

    fieldsConfig = {};
    assignedUsersSelector = this.getAssignedUsersSelector(ContactGroup.Client);
    leftMenuCollapsed$: Observable<boolean> = this.leftMenuService.collapsed$;

    constructor(
        injector: Injector,
        private appService: AppService,
        private importProxy: ImportServiceProxy,
        private pipelineService: PipelineService,
        private nameParser: NameParserService,
        private importLeadsService: ImportLeadsService,
        private partnerService: PartnerServiceProxy,
        private zipFormatterPipe: ZipCodeFormatterPipe,
        private contactService: ContactsService,
        private userManagementService: UserManagementService,
        private leftMenuService: LeftMenuService,
        public importWizardService: ImportWizardService
    ) {
        super(injector);
        this.updateMappingFields();
        this.initFieldsConfig();
    }

    private importTypeChanged(event) {
        this.importTypeIndex = event.itemIndex;
        this.selectedStageId = null;
        let contactGroupId = event.itemData.contactGroupId,
            importType = event.itemData.value;
        this.userAssignmentComponent.assignedUsersSelector =
            this.getAssignedUsersSelector(contactGroupId);
        if (contactGroupId != this.contactGroupId || this.importType != importType) {
            this.importType = importType;
            if (this.contactGroupId = contactGroupId) {
                this.getStages();
                this.updateMappingFields();
            }
        }
        this.initToolbarConfig();
    }

    private updateMappingFields() {
        this.mappingFields = [];
        this.setMappingFields(ImportItemInput.fromJS({}));
    }

    private initFieldsConfig() {
        this.FIELDS_TO_CAPITALIZE.forEach(field => {
            this.fieldsConfig[field] = { cellTemplate: 'titleCaseCell' };
        });

        this.FIELDS_PHONE.forEach(field => {
            this.fieldsConfig[field] = { cellTemplate: 'phoneCell' };
        });

        this.FIELDS_AMOUNT.forEach(field => {
            this.fieldsConfig[field] = { cellTemplate: 'amountCell' };
        });

        this.FIELDS_DATE_TIME.forEach(field => {
            this.fieldsConfig[field] = { cellTemplate: 'datetimeCell' };
        });

        this.FIELDS_DATE.forEach(field => {
            this.fieldsConfig[field] = { cellTemplate: 'dateCell' };
        });

        this.FIELDS_BOOLEAN.forEach(field => {
            this.fieldsConfig[field] = { dataType: 'boolean' };
        });

        let fieldIndex = 1;
        this.FIELDS_ORDER.forEach(field => {
            if (this.fieldsConfig[field])
                _.extend(this.fieldsConfig[field], { visibleIndex: fieldIndex });
            else
                this.fieldsConfig[field] = { visibleIndex: fieldIndex };
            fieldIndex++;
        });

        this.FIELDS_CAPTIONS.forEach(field => {
            let caption = this.l(ImportWizardComponent.getFieldLocalizationName(field));
            if (field.indexOf(this.PERSONAL_FULL_ADDRESS) < 0 &&
                field.indexOf(this.PERSONAL_FULL_ADDRESS2) < 0 &&
                field.indexOf(this.PERSONAL_FULL_ADDRESS3) < 0
            ) {
                let parts = field.split(ImportWizardComponent.FieldSeparator);
                parts.pop();
                caption = this.l(ImportWizardComponent.getFieldLocalizationName(
                    parts.join(ImportWizardComponent.FieldSeparator))).split(' ').shift() + ' ' + caption;
            }
            if (this.fieldsConfig[field])
                this.fieldsConfig[field].caption = caption;
            else
                this.fieldsConfig[field] = {caption: caption};
        });
    }

    private setFieldIfDefined(value, fieldName, dataSource) {
        return (value || !isNaN(value)) && (dataSource[fieldName] = value);
    }

    private setFieldsIfDefined(list, dataSource) {
        _.mapObject(list, (val, key) => {
            this.setFieldIfDefined(val, key, dataSource);
        });
    }

    private parseFullNameIntoDataSource(fullName, dataSource) {
        let parsed = this.nameParser.getParsed(fullName);

        this.setFieldsIfDefined({
            [this.NAME_PREFIX_FIELD]: parsed.title,
            [this.FIRST_NAME_FIELD]: parsed.first,
            [this.MIDDLE_NAME_FIELD]: parsed.middle,
            [this.LAST_NAME_FIELD]: parsed.last,
            [this.NICK_NAME_FIELD]: parsed.nick,
            [this.NAME_SUFFIX_FIELD]: parsed.suffix
        }, dataSource);

        return true;
    }

    private parseFullAddressIntoDataSource(field, fullAddress, dataSource) {
        let parsed = addressParser.parseLocation(fullAddress);
        if (parsed)
            this.setFieldsIfDefined({
                [field.mappedField + (parsed.state && parsed.state.length > 3 ? '_stateName' : '_stateId')]: parsed.state,
                [field.mappedField + '_city']: parsed.city,
                [field.mappedField + '_zip']: parsed.plus4 ? parsed.zip + '-' + parsed.plus4 : parsed.zip,
                [field.mappedField + '_street']: [parsed.number, parsed.prefix, parsed.street, parsed.street1, parsed.street2, parsed.type].filter(Boolean).join(' '),
                [field.mappedField + '_addressLine2']: [parsed.sec_unit_type, parsed.sec_unit_num].filter(Boolean).join(' ')
            }, dataSource);
        return true;
    }

    private parseZipCode(field, zipCode, dataSource) {
        const parsed = this.zipFormatterPipe.transform(zipCode);
        if (parsed) {
            this.setFieldIfDefined(parsed, field.mappedField, dataSource);
        }
        return true;
    }

    private normalizePaymentPeriodType(field, value, dataSource) {
        if (![
            RecurringPaymentFrequency.Monthly.toLowerCase(), 
            RecurringPaymentFrequency.Annual.toLowerCase(), 
            RecurringPaymentFrequency.LifeTime.toLowerCase()
        ].includes(value.trim().toLowerCase())) {
            dataSource[field.mappedField] = undefined;
            return true;
        }                
    }

    private normalizePhoneNumber(field, phoneNumber, dataSource) {
        let value = phoneNumber.replace(/[^\d+]/g, '');
        this.setFieldIfDefined(value || phoneNumber, field.mappedField, dataSource);
        return true;
    }

    private normalizeBooleanValue(field, value, dataSource) {
        value = value.trim().toLowerCase();
        dataSource[field.mappedField] = value ?
            ['true', 'yes', 'y', '1'].indexOf(value) >= 0
            : undefined;
        return true;
    }

    private normalizeGenderValue(field, value, dataSource) {
        value = value.trim().toLowerCase();
        if (['f', 'female', '0'].indexOf(value) >= 0)
            dataSource[field.mappedField] = 'Female';
        else if (['m', 'male', '1'].indexOf(value) >= 0)
            dataSource[field.mappedField] = 'Male';
        else
            return false;
        return true;
    }

    private normalizeTODValue(field, value, dataSource) {
        value = value.trim().toLowerCase();
        for (let v in TimeOfDay) {
            if (v && v.toLowerCase() == value) {
                dataSource[field.mappedField] = TimeOfDay[v];
                return true;
            }
        }

        dataSource[field.mappedField] = undefined;
        return true;
    }

    private parseCurrency(field, value, dataSource) {
        let amount = isNaN(value) ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
        if (amount)
            amount *= ({
                'H': 100,
                'K': 1000,
                'M': 1000000,
                'B': 1000000000
            }[value.trim().split('').pop()] || 1);

        this.setFieldIfDefined(isNaN(amount) ? null : amount, field.mappedField, dataSource);

        return true;
    }

    cancel() {
        this.reset(() => {
            this._router.navigate(['app/crm/dashboard'], { queryParams: { refresh: true } });
        });
    }

    navigateToList() {
        this._router.navigate(['app/crm/import-list']);
    }

    reset(callback = null) {
        this.totalCount = 0;
        this.importedCount = 0;
        this.hideLeftMenu = false;
        this.importStatus = undefined;
        this.clearToolbarSelectedItems();
        this.wizard.reset(callback);
    }

    updateImportStatus(res: GetImportStatusOutput) {
        this.importStatus = <ImportStatus>res.statusId;
        this.importedCount = res.importedCount;
        this.failedCount = res.failedCount;
    }

    complete(data) {
        let uri = (this.importType + 's').toLowerCase();
        this.totalCount = data.records.length;
        this.message.confirm(
            this.l('LeadsImportComfirmation', this.totalCount, uri),
            isConfirmed => {
                if (isConfirmed) {
                    this.startLoading(true);
                    let leadsInput = this.createLeadsInput(data),
                        requestSize = Math.ceil(JSON.stringify(leadsInput).length / 1024 / 1024);
                    if (requestSize > this.MAX_REQUEST_SIZE) {
                        this.finishLoading(true);
                        this.message.info(this.l('LeadsImportSizeExceeds', requestSize, this.MAX_REQUEST_SIZE));
                    } else {
                        this.sendData(JSON.stringify(leadsInput)).pipe(
                            finalize(() => this.finishLoading(true))
                        ).subscribe((importId: number) => {
                            if (importId && !isNaN(importId))
                                setTimeout(() => {
                                    this.importProxy.getStatuses(importId).subscribe((res: GetImportStatusOutput[]) => {
                                        let importStatus: GetImportStatusOutput = res[0];
                                        this.updateImportStatus(importStatus);
                                        if (!this.showedFinishStep())
                                             this.wizard.showFinishStep();
                                        if (<ImportStatus>importStatus.statusId != ImportStatus.Completed) {
                                            this.importLeadsService.setupImportCheck(
                                                importId,
                                                (importStatus: GetImportStatusOutput) => {
                                                    this.updateImportStatus(importStatus);
                                                },
                                                uri
                                            );
                                        }
                                    });
                                }, 3000);
                            this.clearToolbarSelectedItems();
                        }, error => {
                            this.message.error(error.details, error.message);
                        });
                    }
                }
            }
        );
    }

    sendData(payload: string) {
        return new Observable(subscriber => {
            let xhr = new XMLHttpRequest();

            xhr.open('POST', AppConsts.remoteServiceBaseUrl + '/api/services/CRM/Import/Import');
            xhr.setRequestHeader('Authorization', 'Bearer ' + abp.auth.getToken());
            xhr.setRequestHeader('Content-Encoding', 'gzip');
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.addEventListener('load', () => {
                let response = JSON.parse(xhr.responseText);
                if (xhr.status === 200)
                    subscriber.next(response.result);
                else
                    subscriber.error(response.error);
                subscriber.complete();
            });

            xhr.send(pako.gzip(payload, { to: 'Uint8Array' }).buffer);
        });
    }

    createLeadsInput(data: any): ImportInput {
        let result = ImportInput.fromJS({
            fileName: this.wizard.fileName,
            fileSize: this.wizard.fileOrigSize,
            fileContent: this.wizard.fileContent,
            assignedUserId: this.userAssignmentComponent.selectedItemKey,
            ratingId: this.ratingValue,
            starId: this.starsListComponent.selectedItemKey,
            leadStageId: this.selectedStageId,
            partnerTypeName: this.importType === ImportTypeInput.Partner
                ? this.selectedPartnerTypeName
                : undefined,
            ignoreInvalidValues: data.importAll,
            sendWelcomeEmail: this.sendWelcomeEmail,
            fields: data.fields
        });
        result.items = [];
        result.lists = this.listsComponent.selectedItems;
        result.tags = this.tagsComponent.selectedItems;

        data.records.forEach(row => {
            let lead = new ImportItemInput();
            let keys = Object.keys(row);
            keys.forEach(key => {
                let path = key.split(ImportWizardComponent.FieldSeparator);
                if (path.length) {
                    let currentObj = lead;
                    for (let i = 0; i < path.length - 1; i++) {
                        if (!currentObj[path[i]]) {
                            currentObj[path[i]] = {};
                        }
                        currentObj = currentObj[path[i]];
                    }

                    currentObj[path[path.length - 1]] =
                        this.FIELDS_ARRAY.indexOf(key) >= 0 ?
                            row[key].split(',') : row[key];
                }
            });

            result.items.push(lead);
        });

        result.importType = this.importType;
        return ImportInput.fromJS(result);
    }

    resolveFieldLocalization(field: string): string {
        let path = field.split(ImportWizardComponent.FieldSeparator);
        return path.map((item, index) =>
            this.l(ImportWizardComponent.getFieldLocalizationName(path.slice(0, index + 1).join(ImportWizardComponent.FieldSeparator)))
        ).join(ImportWizardComponent.NameSeparator) + ImportWizardComponent.NameSeparator;
    }

    setMappingFields(obj: object, parent: string = null) {
        let keys: string[] = Object.keys(obj);
        keys.forEach(key => {
            let combinedName = parent ? `${parent}${ImportWizardComponent.FieldSeparator}${key}` : key,
                name = this.l(ImportWizardComponent.getFieldLocalizationName(combinedName));
            if (this.importType != ImportTypeInput.Client || key != 'leadStageName') {
                if (this.mappingObjectNames[key]) {
                    this.mappingFields.push({
                        id: combinedName,
                        name: name,
                        longName: (parent ? this.resolveFieldLocalization(parent) : '') + name,
                        parent: parent,
                        expanded: true
                    });
                    this.setMappingFields(this.mappingObjectNames[key], combinedName);
                } else {
                    if (this.FIELDS_TO_IGNORE.indexOf(combinedName) > -1)
                        return;
                    let parentField = parent || 'Other';
                    this.mappingFields.push({
                        id: combinedName,
                        name: name,
                        longName: (parentField ? this.resolveFieldLocalization(parentField) : '') + name,
                        parent: parentField
                    });
                }
            }
        });

        if (!parent) {
            let key = 'Other',
                name = this.l(ImportWizardComponent.getFieldLocalizationName(key));
            this.mappingFields.push({
                id: key,
                name: name,
                longName: name,
                parent: null,
                expanded: true
            });
        }
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.activate();
    }

    getStages() {
        this.pipelineService.getPipelineDefinitionObservable(this.pipelinePurposeId, this.contactGroupId)
            .subscribe(result => {
                this.stages = result.stages.map((stage) => {
                    return {
                        id: stage.id,
                        index: stage.sortOrder,
                        name: stage.name
                    };
                });
            });
    }

    ngOnDestroy() {
        this.deactivate();
    }

    showedFinishStep() {
        return this.wizard.stepper.selectedIndex == this.wizard.FINISH_STEP_INDEX;
    }

    activate() {
        this.rootComponent.overflowHidden(true);

        this.getStages();
        if (this.showedFinishStep())
            setTimeout(() => this.reset());
    }

    deactivate() {
        this.rootComponent.overflowHidden();
        this.importLeadsService.setupImportCheck();
    }

    checkZipUSCountryFields(field, data, zipField, countryCodeField, countryNameField): boolean {
        if (field.mappedField === zipField) {
            const isUSDefaultCountry = AppConsts.defaultCountryCode == Country.USA;
            if (data[countryCodeField])
                return data[countryCodeField] == Country.USA;
            else if (data[countryNameField]) {
                let country = _.findWhere(this.wizard.countries, {name: data[countryNameField].trim()});
                return !country && isUSDefaultCountry || country.code == Country.USA;
            } else
                return isUSDefaultCountry;
        }
        return false;
    }

    checkZipFormatingAllowed(field, data): boolean {
        return this.checkZipUSCountryFields(field, data, this.PERSONAL_FULL_ADDRESS_ZIP_CODE,
                this.PERSONAL_FULL_ADDRESS_COUNTRY_CODE, this.PERSONAL_FULL_ADDRESS_COUNTRY_NAME)
            || this.checkZipUSCountryFields(field, data, this.PERSONAL_FULL_ADDRESS2_ZIP_CODE,
                this.PERSONAL_FULL_ADDRESS2_COUNTRY_CODE, this.PERSONAL_FULL_ADDRESS2_COUNTRY_NAME)
            || this.checkZipUSCountryFields(field, data, this.PERSONAL_FULL_ADDRESS3_ZIP_CODE,
                this.PERSONAL_FULL_ADDRESS3_COUNTRY_CODE, this.PERSONAL_FULL_ADDRESS3_COUNTRY_NAME)
            || this.checkZipUSCountryFields(field, data, this.BUSINESS_COMPANY_FULL_ADDRESS_ZIP_CODE,
                this.BUSINESS_COMPANY_FULL_ADDRESS_COUNTRY_CODE, this.BUSINESS_COMPANY_FULL_ADDRESS_COUNTRY_NAME)
            || this.checkZipUSCountryFields(field, data, this.BUSINESS_WORK_FULL_ADDRESS_ZIP_CODE,
                this.BUSINESS_WORK_FULL_ADDRESS_COUNTRY_CODE, this.BUSINESS_WORK_FULL_ADDRESS_COUNTRY_NAME)
            || this.checkZipUSCountryFields(field, data, this.PROPERTYINFO_ADDRESS_ZIP_CODE,
                this.PROPERTYINFO_ADDRESS_COUNTRY_CODE, this.PROPERTYINFO_ADDRESS_COUNTRY_NAME);
    }

    preProcessFieldBeforeReview = (field, sourceValue, reviewDataSource) => {
        if (field.mappedField == this.FULL_NAME_FIELD) {
            return this.parseFullNameIntoDataSource(sourceValue, reviewDataSource);
        } else if (field.mappedField == this.PERSONAL_FULL_ADDRESS
            || field.mappedField == this.PERSONAL_FULL_ADDRESS2
            || field.mappedField == this.PERSONAL_FULL_ADDRESS3
            || field.mappedField == this.BUSINESS_COMPANY_FULL_ADDRESS
            || field.mappedField == this.BUSINESS_WORK_FULL_ADDRESS
            || field.mappedField == this.PROPERTYINFO_ADDRESS) {
            return this.parseFullAddressIntoDataSource(field, sourceValue, reviewDataSource);
        } else if (this.checkZipFormatingAllowed(field, reviewDataSource)) {
            return this.parseZipCode(field, sourceValue, reviewDataSource);
        } else if (this.FIELDS_PHONE.indexOf(field.mappedField) >= 0) {
            return this.normalizePhoneNumber(field, sourceValue, reviewDataSource);
        } else if (this.FIELDS_AMOUNT.indexOf(field.mappedField) >= 0) {
            return this.parseCurrency(field, sourceValue, reviewDataSource);
        } else if (this.FIELDS_DATE_TIME.indexOf(field.mappedField) >= 0) {
            if (moment(sourceValue).toJSON())
                reviewDataSource[field.mappedField] =
                    DateHelper.removeTimezoneOffset(new Date(sourceValue), true);
            else {
                reviewDataSource[field.mappedField] = undefined;
                return true;
            }
        } else if (this.FIELDS_DATE.indexOf(field.mappedField) >= 0) {
            if (moment(sourceValue).toJSON())
                reviewDataSource[field.mappedField] =
                    DateHelper.removeTimezoneOffset(new Date(sourceValue));
        } else if (this.FIELDS_BOOLEAN.indexOf(field.mappedField) >= 0) {
            return this.normalizeBooleanValue(field, sourceValue, reviewDataSource);
        } else if (this.PERSONAL_GENDER == field.mappedField) {
            return this.normalizeGenderValue(field, sourceValue, reviewDataSource);
        } else if (this.PERSONAL_PREFERREDTOD == field.mappedField) {
            return this.normalizeTODValue(field, sourceValue, reviewDataSource);
        } else if (this.FIELDS_PAYMENT_PERIOD_TYPE.includes(field.mappedField)) {
            return this.normalizePaymentPeriodType(field, sourceValue, reviewDataSource);
        }

        return false;
    }

    validateFieldsMapping = (rows) => {
        let isFistName = false,
            isLastName = false,
            isFullName = false,
            isCompanyName = false,
            isEmail = false;

        let result = { isMapped: false, error: null };
        result.isMapped = rows.every((row) => {
            isFistName = isFistName || (row.mappedField && row.mappedField == this.FIRST_NAME_FIELD);
            isLastName = isLastName || (row.mappedField && row.mappedField == this.LAST_NAME_FIELD);
            isFullName  = isFullName || (row.mappedField && row.mappedField == this.FULL_NAME_FIELD);
            isCompanyName = isCompanyName || (row.mappedField && row.mappedField == this.COMPANY_NAME_FIELD);
            isEmail = isEmail || (row.mappedField && this.FIELDS_EMAIL.indexOf(row.mappedField) >= 0);
            return !!row.mappedField;
        });

        if (!isCompanyName && !isFullName && !isFistName && !isLastName && !isEmail)
            result.error = this.l('FieldsMapError');

        return result;
    }

    onUserAssignmentChanged(event) {
        this.isUserSelected = !!event.addedItems.length;
        this.initToolbarConfig();
    }

    onStagesChanged(event) {
        this.selectedStageId = event.id;
        this.stagesComponent.tooltipVisible = false;
        this.initToolbarConfig();
    }

    onPartnerTypeChanged(event) {
        this.selectedPartnerTypeName = event.selectedRowsData[0].name;
        this.initToolbarConfig();
    }

    onListsChanged(event) {
        this.isListsSelected = !!event.selectedRowKeys.length;
        this.initToolbarConfig();
    }

    onTagsChanged(event) {
        this.isTagsSelected = !!event.selectedRowKeys.length;
        this.initToolbarConfig();
    }

    onRatingChanged(event) {
        this.ratingValue = event.value;
        this.initToolbarConfig();
    }

    onStarsChanged(event) {
        this.isStarSelected = !!event.addedItems.length;
        this.initToolbarConfig();
    }

    private initToolbarConfig() {
        this.manageCGPermission = this.permission.getCGPermissionKey([this.contactGroupId], 'Manage');
        let disabledManage = !this.permission.checkCGPermission([this.contactGroupId]);
        this.toolbarConfig = [
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        text: '',
                        name: 'select-box',
                        widget: 'dxDropDownMenu',
                        options: {
                            width: 130,
                            selectedIndex: this.importTypeIndex,
                            hint: this.l('Import Type'),
                            items: Object.keys(ImportTypeInput)
                                .map((importType: ImportTypeInput) => {
                                    const text = this.l(importType + 's');
                                    const contactGroup = this.importLeadsService.getContactGroupFromInputType(importType);
                                    return {
                                        disabled: importType == ImportTypeInput.Order
                                            || !this.permission.checkCGPermission([contactGroup]),
                                        action: this.importTypeChanged.bind(this),
                                        contactGroupId: contactGroup,
                                        text: text,
                                        value: importType
                                    };
                                })
                        }
                    }
                ]
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'assign',
                        action: () => this.userAssignmentComponent.toggle(),
                        disabled: !this.permission.checkCGPermission([this.contactGroupId], 'ManageAssignments'),
                        attr: {
                            'filter-selected': this.isUserSelected,
                            class: 'assign-to'
                        }
                    },
                    {
                        name: 'stage',
                        action: () => this.stagesComponent.toggle(),
                        attr: {
                            'filter-selected': !!this.selectedStageId
                        },
                        disabled: this.importType === ImportTypeInput.Client || disabledManage
                    },
                    {
                        name: 'partnerType',
                        action: () => this.partnerTypesComponent.toggle(),
                        attr: {
                            'filter-selected': this.importType === ImportTypeInput.Partner && !!this.selectedPartnerTypeName
                        },
                        disabled: this.importType != ImportTypeInput.Partner || disabledManage
                    },
                    {
                        name: 'lists',
                        action: () => this.listsComponent.toggle(),
                        disabled: disabledManage,
                        attr: {
                            'filter-selected': this.isListsSelected
                        }
                    },
                    {
                        name: 'tags',
                        action: () => this.tagsComponent.toggle(),
                        disabled: disabledManage,
                        attr: {
                            'filter-selected': this.isTagsSelected
                        }
                    },
                    {
                        name: 'rating',
                        action: () => this.ratingComponent.toggle(),
                        disabled: disabledManage,
                        attr: {
                            'filter-selected': !!this.ratingValue
                        }
                    },
                    {
                        name: 'star',
                        options: {
                            width: 30
                        },
                        action: () => this.starsListComponent.toggle(),
                        disabled: disabledManage,
                        visible: !this.userManagementService.isLayout(LayoutType.BankCode),
                        attr: {
                            'filter-selected': this.isStarSelected
                        }
                    }
                ]
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        text: '',
                        name: 'check-box',
                        widget: 'dxCheckBox',
                        options: {
                            width: '200px',
                            value: this.sendWelcomeEmail,
                            disabled: !this.emailInvitation,
                            text: this.l('SendUserInvitation'),
                            onValueChanged: event => {
                                this.sendWelcomeEmail = event.value;
                                this.initToolbarConfig();
                            }
                        }
                    }
                ]
            }
        ];
    }

    onMappingChanged(event) {
        let selected = event.selectedRowsData.some(item => item.mappedField == this.USER_PASSWORD);
        if (this.emailInvitation != selected) {
            this.emailInvitation = selected;
            this.initToolbarConfig();
        }
    }

    clearToolbarSelectedItems() {
        this.sendWelcomeEmail = false;
        this.selectedStageId = null;
        this.selectedPartnerTypeName = null;
        this.starsListComponent.selectedItemKey = undefined;
        this.userAssignmentComponent.selectedItemKey = null;
        this.userAssignmentComponent.selectedKeys = [];
        this.listsComponent.reset();
        this.tagsComponent.reset();
        this.ratingValue = undefined;
    }

    cancelImport() {
        this.importWizardService.cancelImport();
        this.importWizardService.finishStatusCheck();
        this.navigateToList();
    }

    onStepChanged(event) {
        if (event)
            this.hideLeftMenu = event.selectedIndex
                != this.wizard.UPLOAD_STEP_INDEX;
        else
            setTimeout(() => this.initToolbarConfig());
    }

    private getAssignedUsersSelector(contactGroup: ContactGroup) {
        return select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, { contactGroup: contactGroup });
    }

    getUserAssignmentPermissionKey() {
        return this.permission.getCGPermissionKey(this.contactGroupId, 'ManageAssignments');
    }
}
