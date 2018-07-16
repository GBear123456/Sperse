import { Component, Injector, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Router, RouteReuseStrategy } from '@angular/router';
import { ImportWizardComponent } from '@app/shared/common/import-wizard/import-wizard.component';
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import {
    ImportLeadInput, ImportLeadsInput, ImportLeadPersonalInput, ImportLeadBusinessInput, ImportLeadFullName, ImportLeadAddressInput,
    LeadServiceProxy, CustomerListInput, ImportLeadsInputImportType
} from '@shared/service-proxies/service-proxies';

import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { StaticListComponent } from '@app/crm/shared/static-list/static-list.component';
import { TagsListComponent } from '@app/crm/shared/tags-list/tags-list.component';
import { ListsListComponent } from '@app/crm/shared/lists-list/lists-list.component';
import { UserAssignmentComponent } from '@app/crm/shared/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '@app/crm/shared/rating/rating.component';
import { StarsListComponent } from '@app/crm/shared/stars-list/stars-list.component';

import * as addressParser from 'parse-address';

import * as _ from 'underscore';
import {PipelineService} from '@app/shared/pipeline/pipeline.service';

@Component({
    templateUrl: 'import-leads.component.html',
    styleUrls: ['import-leads.component.less'],
    animations: [appModuleAnimation()]
})
export class ImportLeadsComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(ImportWizardComponent) wizard: ImportWizardComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: ListsListComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;
    @ViewChild(StaticListComponent) stagesComponent: StaticListComponent;

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

    totalCount: number = 0;
    importedCount: number = 0;
    mappingFields: any[] = [];
    importTypeIndex: number = 0;
    importType: ImportLeadsInputImportType = ImportLeadsInputImportType.Lead;

    fullName: ImportLeadFullName;
    fullAddress: ImportLeadAddressInput;

    userId: any;
    isUserSelected = true;
    isRatingSelected = true;
    isListsSelected = false;
    isTagsSelected = false;
    isStarSelected = false;
    isStageSelected = false;
    toolbarConfig = [];
    selectedClientKeys: any = [];
    defaultRating = 5;
    leadStages = [];
    private pipelinePurposeId: string = AppConsts.PipelinePurposeIds.lead;

    readonly mappingObjectNames = {
        personalInfo: ImportLeadPersonalInput.fromJS({}),
        fullName: ImportLeadFullName.fromJS({}),
        fullAddress: ImportLeadAddressInput.fromJS({}),
        businessInfo: ImportLeadBusinessInput.fromJS({}),
        companyFullAddress: ImportLeadAddressInput.fromJS({}),
        workFullAddress: ImportLeadAddressInput.fromJS({})
    };

    private readonly compareFields: any = [
        [this.FIRST_NAME_FIELD + ':' + this.LAST_NAME_FIELD],
        [this.PERSONAL_EMAIL1, this.PERSONAL_EMAIL2, this.PERSONAL_EMAIL3, this.BUSINESS_COMPANY_EMAIL, this.BUSINESS_WORK_EMAIL1, this.BUSINESS_WORK_EMAIL2, this.BUSINESS_WORK_EMAIL3],
        [this.PERSONAL_MOBILE_PHONE, this.PERSONAL_HOME_PHONE, this.BUSINESS_COMPANY_PHONE, this.BUSINESS_WORK_PHONE_1, this.BUSINESS_WORK_PHONE_2],
        [this.PERSONAL_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD, this.BUSINESS_COMPANY_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD, this.BUSINESS_WORK_FULL_ADDRESS + ':' + this.LAST_NAME_FIELD]
    ];

    private rootComponent: any;

    fieldsConfig = {};

    constructor(
        injector: Injector,
        private _reuseService: RouteReuseStrategy,
        private _leadService: LeadServiceProxy,
        private _router: Router,
        private _pipelineService: PipelineService,
        private _nameParser: NameParserService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.setMappingFields(ImportLeadInput.fromJS({}));
        this.initFieldsConfig();
        this.userId = abp.session.userId;
        this.selectedClientKeys.push(this.userId);
    }

    private importTypeChanged(event) {
        const IMPORT_TYPE_ITEM_INDEX = 0;

        this.importTypeIndex = event.itemIndex;
        this.importType = event.itemData.value;


        if (this.importTypeIndex != IMPORT_TYPE_ITEM_INDEX)
            this.stagesComponent.selectedItems = [];

        this.initToolbarConfig();
    }

    private initFieldsConfig() {
        this.FIELDS_TO_CAPITALIZE.forEach(field => {
            this.fieldsConfig[field] = { cssClass: 'capitalize' };
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
            this.setFieldIfDefined('US', field.mappedField + '_countryCode', dataSource);            
            this.setFieldIfDefined(parsed.state, field.mappedField + 
                (parsed.state && parsed.state.length > 3 ? '_stateName' : '_stateCode'), dataSource);
            this.setFieldIfDefined(parsed.city, field.mappedField + '_city', dataSource);
            this.setFieldIfDefined(parsed.zip, field.mappedField + '_zipCode', dataSource);
            this.setFieldIfDefined([parsed.number, parsed.prefix, parsed.street,
                parsed.street1, parsed.street2, parsed.type].filter(Boolean).join(' '),
                    field.mappedField + '_street', dataSource);
        }

        return true;
    }

    cancel() {
        this.reset(() => {
            this._router.navigate(['app/crm/dashboard']);
        });
    }

    reset(callback = null) {
        this.totalCount = 0;
        this.importedCount = 0;
        this.clearToolbarSelectedItems();
        this.wizard.reset(callback);
    }

    complete(data) {
        this.startLoading(true);
        this.totalCount = data.length;
        let leadsInput = this.createLeadsInput(data);
        this._leadService.importLeads(leadsInput).finally(() => this.finishLoading(true)).subscribe((res) => {
            res.forEach((reff) => {
                if (!reff.errorMessage)
                    this.importedCount++;
            });
            if (this.importedCount > 0) {
                this.wizard.showFinishStep();
                this.clearToolbarSelectedItems();
                (<any>this._reuseService).invalidate('leads');
            } else
                this.message.error(res[0].errorMessage);
        });
    }

    createLeadsInput(data: any[]): ImportLeadsInput {
        let result = ImportLeadsInput.fromJS({
            assignedUserId: this.userAssignmentComponent.selectedItemKey || this.userId,
            ratingId: this.ratingComponent.ratingValue || this.defaultRating,
            starId: this.starsListComponent.selectedItemKey,
            leadStageId: this.stagesComponent.selectedItems.length ? this.stagesComponent.selectedItems[0].id : undefined
        });
        result.leads = [];
        result.lists = this.listsComponent.selectedItems;
        result.tags = this.tagsComponent.selectedItems;

        data.forEach(v => {
            let lead = new ImportLeadInput();
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

            result.leads.push(lead);
        });

        result.importType = this.importType;
        return ImportLeadsInput.fromJS(result);
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

    activate() {
        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();
        this.getStages();
    }

    deactivate() {
        this.rootComponent.overflowHidden();
    }

    checkSimilarRecord = (record1, record2) => {
        record2.compared = (record2[this.FIRST_NAME_FIELD] || ''
            + ' ' + record2[this.LAST_NAME_FIELD] || '').trim();

        return !this.compareFields.every((fields) => {
            return fields.every((field1) => {
                return !fields.some((field2) => {
                    let complexField1 = field1.split(':'),
                        complexField2 = field2.split(':');
                    if (complexField1.length > 1)
                        return complexField1.map((fld) => record1[fld] || 1).join('_')
                            == complexField2.map((fld) => record2[fld] || 2).join('_');
                    else
                        return record1[field1] && record2[field2] &&
                            (record1[field1].toLowerCase() == record2[field2].toLowerCase());
                });
            });
        });
    }

    preProcessFieldBeforeReview = (field, sourceValue, reviewDataSource) => {
        if (field.mappedField == this.FULL_NAME_FIELD)
            return this.parseFullNameIntoDataSource(sourceValue, reviewDataSource);
        else if (field.mappedField == this.PERSONAL_FULL_ADDRESS
            || field.mappedField == this.BUSINESS_COMPANY_FULL_ADDRESS
            || field.mappedField == this.BUSINESS_WORK_FULL_ADDRESS
        )
            return this.parseFullAddressIntoDataSource(field, sourceValue, reviewDataSource);
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
        this.isStageSelected = !!event.addedItems.length;
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
                location: 'before', items: [
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
                                    value: ImportLeadsInputImportType.Lead
                                }, {
                                    action: this.importTypeChanged.bind(this),
                                    text: this.l('Clients'),
                                    value: ImportLeadsInputImportType.Client
                                }, {
                                    disabled: true,
                                    action: this.importTypeChanged.bind(this),
                                    text: this.l('Partners'),
                                    value: ImportLeadsInputImportType.Partner
                                }, {
                                    disabled: true,
                                    action: this.importTypeChanged.bind(this),
                                    text: this.l('Orders'),
                                    value: ImportLeadsInputImportType.Order
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
                            'filter-selected': this.isStageSelected
                        },
                        disabled: Boolean(this.importTypeIndex)
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
    }

    clearToolbarSelectedItems() {
        this.stagesComponent.selectedItems = [];
        this.starsListComponent.selectedItemKey = undefined;
        this.userAssignmentComponent.selectedKeys = [this.userId];
        this.listsComponent.reset();
        this.tagsComponent.reset();
        this.ratingComponent.ratingValue = this.defaultRating;
    }
}
