/** Core imports */
import { Component, Injector, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { finalize } from 'rxjs/operators';
import * as addressParser from 'parse-address';
import * as _ from 'underscore';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppStore, PartnerTypesStoreSelectors, CustomerAssignedUsersStoreSelectors, PartnerAssignedUsersStoreSelectors, LeadAssignedUsersStoreSelectors } from '@app/store';
import { ImportWizardService } from '@app/shared/common/import-wizard/import-wizard.service';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { StaticListComponent } from '@app/crm/shared/static-list/static-list.component';
import { TagsListComponent } from '@app/crm/shared/tags-list/tags-list.component';
import { ListsListComponent } from '@app/crm/shared/lists-list/lists-list.component';
import { TypesListComponent } from '@app/crm/shared/types-list/types-list.component';
import { UserAssignmentComponent } from '@app/crm/shared/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '@app/crm/shared/rating/rating.component';
import { StarsListComponent } from '@app/crm/shared/stars-list/stars-list.component';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { ImportWizardComponent } from '@app/shared/common/import-wizard/import-wizard.component';
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ZipCodeFormatterPipe } from '@shared/common/pipes/zip-code-formatter/zip-code-formatter.pipe';
import {
    ImportItemInput, ImportInput, ImportPersonalInput, ImportBusinessInput, ImportFullName, ImportAddressInput,
    ImportServiceProxy, ImportInputImportType, PartnerServiceProxy
} from '@shared/service-proxies/service-proxies';
import { ImportLeadsService } from './import-leads.service';
import { ImportStatus } from '@shared/AppEnums';

@Component({
    templateUrl: 'import-leads.component.html',
    styleUrls: ['import-leads.component.less'],
    animations: [appModuleAnimation()],
    providers: [ ZipCodeFormatterPipe, PartnerServiceProxy ]
})
export class ImportLeadsComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(ImportWizardComponent) wizard: ImportWizardComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: ListsListComponent;
    @ViewChild(TypesListComponent) partnerTypesComponent: TypesListComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;
    @ViewChild('stagesList') stagesComponent: StaticListComponent;

    private readonly FULL_NAME_FIELD = 'personalInfo_fullName';
    private readonly NAME_PREFIX_FIELD = 'personalInfo_fullName_prefix';
    private readonly FIRST_NAME_FIELD = 'personalInfo_fullName_firstName';
    private readonly MIDDLE_NAME_FIELD = 'personalInfo_fullName_middleName';
    private readonly LAST_NAME_FIELD = 'personalInfo_fullName_lastName';
    private readonly NICK_NAME_FIELD = 'personalInfo_fullName_nickName';
    private readonly NAME_SUFFIX_FIELD = 'personalInfo_fullName_suffix';
    private readonly COMPANY_NAME_FIELD = 'businessInfo_companyName';
    private readonly PERSONAL_FULL_ADDRESS = 'personalInfo_fullAddress';
    private readonly PERSONAL_FULL_ADDRESS_STREET = 'personalInfo_fullAddress_street';
    private readonly PERSONAL_FULL_ADDRESS_CITY = 'personalInfo_fullAddress_city';
    private readonly PERSONAL_FULL_ADDRESS_STATE_NAME = 'personalInfo_fullAddress_stateName';
    private readonly PERSONAL_FULL_ADDRESS_STATE_CODE = 'personalInfo_fullAddress_stateCode';
    private readonly PERSONAL_FULL_ADDRESS_ZIP_CODE = 'personalInfo_fullAddress_zipCode';
    private readonly PERSONAL_FULL_ADDRESS_COUNTRY_NAME = 'personalInfo_fullAddress_countryName';
    private readonly PERSONAL_FULL_ADDRESS_COUNTRY_CODE = 'personalInfo_fullAddress_countryCode';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS = 'businessInfo_companyFullAddress';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_STREET = 'businessInfo_companyFullAddress_street';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_CITY = 'businessInfo_companyFullAddress_city';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_STATE_NAME = 'businessInfo_companyFullAddress_stateName';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_STATE_CODE = 'businessInfo_companyFullAddress_stateCode';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_ZIP_CODE = 'businessInfo_companyFullAddress_zipCode';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_COUNTRY_NAME = 'businessInfo_companyFullAddress_countryName';
    private readonly BUSINESS_COMPANY_FULL_ADDRESS_COUNTRY_CODE = 'businessInfo_companyFullAddress_countryCode';
    private readonly BUSINESS_WORK_FULL_ADDRESS = 'businessInfo_workFullAddress';
    private readonly BUSINESS_WORK_FULL_ADDRESS_STREET = 'businessInfo_workFullAddress_street';
    private readonly BUSINESS_WORK_FULL_ADDRESS_CITY = 'businessInfo_workFullAddress_city';
    private readonly BUSINESS_WORK_FULL_ADDRESS_STATE_NAME = 'businessInfo_workFullAddress_stateName';
    private readonly BUSINESS_WORK_FULL_ADDRESS_STATE_CODE = 'businessInfo_workFullAddress_stateCode';
    private readonly BUSINESS_WORK_FULL_ADDRESS_ZIP_CODE = 'businessInfo_workFullAddress_zipCode';
    private readonly BUSINESS_WORK_FULL_ADDRESS_COUNTRY_NAME = 'businessInfo_workFullAddress_countryName';
    private readonly BUSINESS_WORK_FULL_ADDRESS_COUNTRY_CODE = 'businessInfo_workFullAddress_countryCode';
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

    private readonly IMPORT_TYPE_LEAD_INDEX = 0;
    private readonly IMPORT_TYPE_CLIENT_INDEX = 1;
    private readonly IMPORT_TYPE_PARTNER_INDEX = 2;
    private readonly IMPORT_TYPE_ORDER_INDEX = 3;

    private readonly FIELDS_TO_CAPITALIZE = [
        this.FIRST_NAME_FIELD,
        this.MIDDLE_NAME_FIELD,
        this.LAST_NAME_FIELD,
        this.NICK_NAME_FIELD,
        this.NAME_PREFIX_FIELD,
        this.NAME_SUFFIX_FIELD,
        this.PERSONAL_FULL_ADDRESS_CITY,
        this.BUSINESS_COMPANY_FULL_ADDRESS_CITY,
        this.BUSINESS_WORK_FULL_ADDRESS_CITY
    ];

    private readonly PHONE_FIELDS = [
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

    private readonly FIELDS_CAPTIONS = [
        this.PERSONAL_FULL_ADDRESS_STREET,
        this.PERSONAL_FULL_ADDRESS_CITY,
        this.PERSONAL_FULL_ADDRESS_STATE_NAME,
        this.PERSONAL_FULL_ADDRESS_STATE_CODE,
        this.PERSONAL_FULL_ADDRESS_ZIP_CODE,
        this.PERSONAL_FULL_ADDRESS_COUNTRY_NAME,
        this.PERSONAL_FULL_ADDRESS_COUNTRY_CODE,
        this.BUSINESS_COMPANY_FULL_ADDRESS_STREET,
        this.BUSINESS_COMPANY_FULL_ADDRESS_CITY,
        this.BUSINESS_COMPANY_FULL_ADDRESS_STATE_NAME,
        this.BUSINESS_COMPANY_FULL_ADDRESS_STATE_CODE,
        this.BUSINESS_COMPANY_FULL_ADDRESS_ZIP_CODE,
        this.BUSINESS_COMPANY_FULL_ADDRESS_COUNTRY_NAME,
        this.BUSINESS_COMPANY_FULL_ADDRESS_COUNTRY_CODE,
        this.BUSINESS_WORK_FULL_ADDRESS_STREET,
        this.BUSINESS_WORK_FULL_ADDRESS_CITY,
        this.BUSINESS_WORK_FULL_ADDRESS_STATE_NAME,
        this.BUSINESS_WORK_FULL_ADDRESS_STATE_CODE,
        this.BUSINESS_WORK_FULL_ADDRESS_ZIP_CODE,
        this.BUSINESS_WORK_FULL_ADDRESS_COUNTRY_NAME,
        this.BUSINESS_WORK_FULL_ADDRESS_COUNTRY_CODE
    ];

    importStatuses: any = ImportStatus;
    importStatus: ImportStatus;
    hideLeftMenu = false;

    totalCount: number = 0;
    importedCount: number = 0;
    failedCount: number = 0;
    mappingFields: any[] = [];
    importTypeIndex: number = 0;
    importType: ImportInputImportType = ImportInputImportType.Lead;

    fullName: ImportFullName;
    fullAddress: ImportAddressInput;

    userId: any;
    isUserSelected = true;
    isRatingSelected = true;
    isListsSelected = false;
    isTagsSelected = false;
    isStarSelected = false;
    toolbarConfig = [];
    selectedClientKeys: any = [];
    selectedStageId: number;
    selectedPartnerTypeName: string;
    defaultRating = 5;
    leadStages = [];
    partnerTypes = [];
    private pipelinePurposeId: string = AppConsts.PipelinePurposeIds.lead;

    readonly mappingObjectNames = {
        personalInfo: ImportPersonalInput.fromJS({}),
        fullName: ImportFullName.fromJS({}),
        fullAddress: ImportAddressInput.fromJS({}),
        businessInfo: ImportBusinessInput.fromJS({}),
        companyFullAddress: ImportAddressInput.fromJS({}),
        workFullAddress: ImportAddressInput.fromJS({})
    };

    public readonly compareFields: any = [
        [this.FIRST_NAME_FIELD + ':' + this.LAST_NAME_FIELD],
        [this.PERSONAL_EMAIL1, this.PERSONAL_EMAIL2, this.PERSONAL_EMAIL3, this.BUSINESS_COMPANY_EMAIL, this.BUSINESS_WORK_EMAIL1, this.BUSINESS_WORK_EMAIL2, this.BUSINESS_WORK_EMAIL3],
        [this.PERSONAL_MOBILE_PHONE, this.PERSONAL_HOME_PHONE, this.BUSINESS_COMPANY_PHONE, this.BUSINESS_WORK_PHONE_1, this.BUSINESS_WORK_PHONE_2],
        [this.PERSONAL_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD, this.BUSINESS_COMPANY_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD, this.BUSINESS_WORK_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD]
    ];

    private rootComponent: any;

    fieldsConfig = {};

    constructor(
        injector: Injector,
        private _appService: AppService,
        private _importProxy: ImportServiceProxy,
        private _router: Router,
        private _pipelineService: PipelineService,
        private _nameParser: NameParserService,
        private _importLeadsService: ImportLeadsService,
        private _partnerService: PartnerServiceProxy,
        private zipFormatterPipe: ZipCodeFormatterPipe,
        public importWizardService: ImportWizardService,
        private store$: Store<AppStore.State>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.setMappingFields(ImportItemInput.fromJS({}));
        this.initFieldsConfig();
        this.userId = abp.session.userId;
        this.selectedClientKeys.push(this.userId);
    }

    private importTypeChanged(event) {
        this.importTypeIndex = event.itemIndex;
        this.importType = event.itemData.value;

        if (this.importTypeIndex != this.IMPORT_TYPE_LEAD_INDEX)
            this.selectedStageId = null;

        if (this.importTypeIndex != this.IMPORT_TYPE_PARTNER_INDEX)
            this.selectedPartnerTypeName = null;

        this.userAssignmentComponent.getAssignedUsersSelector = this.getAssignedUsersStoreSelectors();
        this.userAssignmentComponent.refreshList();

        this.initToolbarConfig();
    }

    getAssignedUsersStoreSelectors() {
        if (this.importType === ImportInputImportType.Client)
            return CustomerAssignedUsersStoreSelectors.getAssignedUsers;

        if (this.importType === ImportInputImportType.Partner)
            return PartnerAssignedUsersStoreSelectors.getAssignedUsers;

        if (this.importType === ImportInputImportType.Lead)
            return LeadAssignedUsersStoreSelectors.getAssignedUsers;
    }

    private initFieldsConfig() {
        this.FIELDS_TO_CAPITALIZE.forEach(field => {
            this.fieldsConfig[field] = { cellTemplate: 'titleCaseCell' };
        });

        this.PHONE_FIELDS.forEach(field => {
            this.fieldsConfig[field] = { cellTemplate: 'phoneCell' };
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
            if (field.indexOf(this.PERSONAL_FULL_ADDRESS) < 0) {
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
        value && (dataSource[fieldName] = value);
    }

    private parseFullNameIntoDataSource(fullName, dataSource) {
        let parsed = this._nameParser.getParsed(fullName);

        this.setFieldIfDefined(parsed.title, this.NAME_PREFIX_FIELD, dataSource);
        this.setFieldIfDefined(parsed.first, this.FIRST_NAME_FIELD, dataSource);
        this.setFieldIfDefined(parsed.middle, this.MIDDLE_NAME_FIELD, dataSource);
        this.setFieldIfDefined(parsed.last, this.LAST_NAME_FIELD, dataSource);
        this.setFieldIfDefined(parsed.nick, this.NICK_NAME_FIELD, dataSource);
        this.setFieldIfDefined(parsed.suffix, this.NAME_SUFFIX_FIELD, dataSource);

        return true;
    }

    private parseFullAddressIntoDataSource(field, fullAddress, dataSource) {
        let parsed = addressParser.parseLocation(fullAddress);

        if (parsed) {
            this.setFieldIfDefined(AppConsts.defaultCountry, field.mappedField + '_countryCode', dataSource);
            this.setFieldIfDefined(parsed.state, field.mappedField +
                (parsed.state && parsed.state.length > 3 ? '_stateName' : '_stateCode'), dataSource);
            this.setFieldIfDefined(parsed.city, field.mappedField + '_city', dataSource);
            const zipCode = parsed.plus4 ? parsed.zip + '-' + parsed.plus4 : parsed.zip;
            this.setFieldIfDefined(zipCode, field.mappedField + '_zipCode', dataSource);
            this.setFieldIfDefined([parsed.number, parsed.prefix, parsed.street,
                parsed.street1, parsed.street2, parsed.type].filter(Boolean).join(' '),
                    field.mappedField + '_street', dataSource);
        }

        return true;
    }

    private parseZipCode(field, zipCode, dataSource) {
        const parsed = this.zipFormatterPipe.transform(zipCode);
        if (parsed) {
            this.setFieldIfDefined(parsed, field.mappedField, dataSource);
        }
        return true;
    }

    private normalizePhoneNumber(field, phoneNumber, dataSource) {
        let value = phoneNumber.replace(/[^\d+]/g, '');
        this.setFieldIfDefined(value || phoneNumber, field.mappedField, dataSource);
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

    updateImportStatus(res) {
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
                    let leadsInput = this.createLeadsInput(data);
                    this._importProxy.import(leadsInput)
                        .pipe(
                            finalize(() => this.finishLoading(true))
                        ).subscribe((importId) => {
                            if (importId && !isNaN(importId))
                                this._importProxy.getStatuses(importId).subscribe((res) => {
                                    let importStatus  = res[0];
                                    this.updateImportStatus(importStatus);
                                    if (!this.showedFinishStep())
                                         this.wizard.showFinishStep();
                                    if (<ImportStatus>importStatus.statusId == ImportStatus.InProgress)
                                        this._importLeadsService.setupImportCheck(importId, (importStatus) => {
                                            this.updateImportStatus(importStatus);
                                        }, uri);
                                });
                            this.clearToolbarSelectedItems();
                        });
                }
            }
        );
    }

    createLeadsInput(data: any): ImportInput {
        let result = ImportInput.fromJS({
            fileName: this.wizard.fileName,
            fileSize: this.wizard.fileOrigSize,
            fileContent: this.wizard.fileContent,
            assignedUserId: this.userAssignmentComponent.selectedItemKey || this.userId,
            ratingId: this.ratingComponent.ratingValue || this.defaultRating,
            starId: this.starsListComponent.selectedItemKey,
            leadStageId: this.selectedStageId,
            partnerTypeName: this.selectedPartnerTypeName,
            ignoreInvalidValues: data.importAll,
            fields: data.fields
        });
        result.items = [];
        result.lists = this.listsComponent.selectedItems;
        result.tags = this.tagsComponent.selectedItems;

        data.records.forEach(v => {
            let lead = new ImportItemInput();
            let keys = Object.keys(v);
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

                    currentObj[path[path.length - 1]] = v[key];
                }
            });

            result.items.push(lead);
        });

        result.importType = this.importType;
        return ImportInput.fromJS(result);
    }

    setMappingFields(obj: object, parent: string = null) {
        let keys: string[] = Object.keys(obj);
        keys.forEach(v => {
            let combinedName = parent ? `${parent}${ImportWizardComponent.FieldSeparator}${v}` : v;
            if (this.mappingObjectNames[v]) {
                this.mappingFields.push({
                    id: combinedName,
                    name: this.l(ImportWizardComponent.getFieldLocalizationName(combinedName)),
                    parent: parent,
                    expanded: true
                });
                this.setMappingFields(this.mappingObjectNames[v], combinedName);
            }
            else {
                this.mappingFields.push({
                    id: combinedName,
                    name: this.l(ImportWizardComponent.getFieldLocalizationName(combinedName)),
                    parent: parent || 'Other'
                });
            }
        });

        if (!parent) {
            this.mappingFields.push({
                id: 'Other', name: this.l('Import_Other'), parent: null, expanded: true
            });
        }
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.activate();
    }

    getStages() {
        this._pipelineService.getPipelineDefinitionObservable(this.pipelinePurposeId)
            .subscribe(result => {
                this.leadStages = result.stages;
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
        this._importLeadsService.setupImportCheck();
    }

    preProcessFieldBeforeReview = (field, sourceValue, reviewDataSource) => {
        if (field.mappedField == this.FULL_NAME_FIELD) {
            return this.parseFullNameIntoDataSource(sourceValue, reviewDataSource);
        } else if (field.mappedField == this.PERSONAL_FULL_ADDRESS
            || field.mappedField == this.BUSINESS_COMPANY_FULL_ADDRESS
            || field.mappedField == this.BUSINESS_WORK_FULL_ADDRESS) {
            return this.parseFullAddressIntoDataSource(field, sourceValue, reviewDataSource);
        } else if (field.mappedField === this.PERSONAL_FULL_ADDRESS_ZIP_CODE
            || field.mappedField == this.BUSINESS_COMPANY_FULL_ADDRESS_ZIP_CODE
            || field.mappedField == this.BUSINESS_WORK_FULL_ADDRESS_ZIP_CODE) {
            return this.parseZipCode(field, sourceValue, reviewDataSource);
        } else if (this.PHONE_FIELDS.indexOf(field.mappedField) >= 0) {
            return this.normalizePhoneNumber(field, sourceValue, reviewDataSource);
        }
        return false;
    }

    validateFieldsMapping = (rows) => {
        let isFistName = false,
            isLastName = false,
            isFullName = false,
            isCompanyName = false;

        let result = { isMapped: false, error: null };
        result.isMapped = rows.every((row) => {
            isFistName = isFistName || (row.mappedField && row.mappedField == this.FIRST_NAME_FIELD),
            isLastName = isLastName || (row.mappedField && row.mappedField == this.LAST_NAME_FIELD),
            isFullName  = isFullName || (row.mappedField && row.mappedField == this.FULL_NAME_FIELD),
            isCompanyName = isCompanyName || (row.mappedField && row.mappedField == this.COMPANY_NAME_FIELD);
            return !!row.mappedField;
        });

        if (!isCompanyName && !isFullName && !isFistName && !isLastName)
            result.error = this.l('FieldsMapError');

        return result;
    }

    onUserAssignmentChanged(event) {
        this.isUserSelected = !!event.addedItems.length;
        this.initToolbarConfig();
    }

    onStagesChanged(event) {
        this.selectedStageId = event.id;
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
        this.isRatingSelected = !!event.value;
        this.initToolbarConfig();
    }

    onStarsChanged(event) {
        this.isStarSelected = !!event.addedItems.length;
        this.initToolbarConfig();
    }

    initToolbarConfig() {
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
                            items: [
                                {
                                    action: this.importTypeChanged.bind(this),
                                    text: this.l('Leads'),
                                    value: ImportInputImportType.Lead
                                }, {
                                    action: this.importTypeChanged.bind(this),
                                    text: this.l('Clients'),
                                    value: ImportInputImportType.Client
                                }, {
                                    action: this.importTypeChanged.bind(this),
                                    text: this.l('Partners'),
                                    value: ImportInputImportType.Partner
                                }, {
                                    disabled: true,
                                    action: this.importTypeChanged.bind(this),
                                    text: this.l('Orders'),
                                    value: ImportInputImportType.Order
                                }
                            ]
                        }
                    },
                    {
                        name: 'assign',
                        action: () => this.userAssignmentComponent.toggle(),
                        attr: {
                            'filter-selected': this.isUserSelected
                        }
                    },
                    {
                        name: 'stage',
                        action: () => this.stagesComponent.toggle(),
                        attr: {
                            'filter-selected': !!this.selectedStageId
                        },
                        disabled: this.importTypeIndex != this.IMPORT_TYPE_LEAD_INDEX
                    },
                    {
                        name: 'partnerType',
                        action: () => this.partnerTypesComponent.toggle(),
                        attr: {
                            'filter-selected': !!this.selectedPartnerTypeName
                        },
                        disabled: this.importTypeIndex != this.IMPORT_TYPE_PARTNER_INDEX
                    },
                    {
                        name: 'lists',
                        action: () => this.listsComponent.toggle(),
                        attr: {
                            'filter-selected': this.isListsSelected
                        }
                    },
                    {
                        name: 'tags',
                        action: () => this.tagsComponent.toggle(),
                        attr: {
                            'filter-selected': this.isTagsSelected
                        }
                    },
                    {
                        name: 'rating',
                        action: () => this.ratingComponent.toggle(),
                        attr: {
                            'filter-selected': this.isRatingSelected
                        }
                    },
                    {
                        name: 'star',
                        options: {
                            width: 30,
                        },
                        action: () => this.starsListComponent.toggle(),
                        attr: {
                            'filter-selected': this.isStarSelected
                        }
                    }
                ]
            }
        ];
        this._appService.updateToolbar(null);
    }

    clearToolbarSelectedItems() {
        this.selectedStageId = null;
        this.selectedPartnerTypeName = null;
        this.starsListComponent.selectedItemKey = undefined;
        this.userAssignmentComponent.selectedItemKey = this.userId;
        this.userAssignmentComponent.selectedKeys = [this.userId];
        this.listsComponent.reset();
        this.tagsComponent.reset();
        this.ratingComponent.ratingValue = this.defaultRating;
        this._appService.updateToolbar(null);
    }

    cancelImport() {
        this.importWizardService.cancelImport();
    }

    loadPartnerTypes() {
        this.store$.pipe(select(PartnerTypesStoreSelectors.getPartnerTypes)).subscribe(
            partnerTypes => this.partnerTypes = partnerTypes
        );
    }

    onStepChanged(event) {
        if (event)
            this.hideLeftMenu = event.selectedIndex
                != this.wizard.UPLOAD_STEP_INDEX;
        else
            setTimeout(() => this.initToolbarConfig());
    }
}
