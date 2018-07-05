/** Core imports */
import { Component, Injector, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { finalize } from 'rxjs/operators';
import * as _s from 'underscore.string';

/** Application imports */
import { ImportWizardComponent } from '@app/shared/common/import-wizard/import-wizard.component';
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ImportLeadInput, ImportLeadsInput, ImportLeadPersonalInput, ImportLeadBusinessInput, ImportLeadFullName, ImportLeadAddressInput,
    LeadServiceProxy
} from '@shared/service-proxies/service-proxies';

import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';

import * as _ from 'underscore';
@Component({
    templateUrl: 'import-leads.component.html',
    styleUrls: ['import-leads.component.less'],
    animations: [appModuleAnimation()]
})
export class ImportLeadsComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(ImportWizardComponent) wizard: ImportWizardComponent;

    private readonly FULL_NAME_FIELD = 'personalInfo_fullName';
    private readonly NAME_PREFIX_FIELD = 'personalInfo_fullName_prefix';
    private readonly FIRST_NAME_FIELD = 'personalInfo_fullName_firstName';
    private readonly MIDDLE_NAME_FIELD = 'personalInfo_fullName_middleName';
    private readonly LAST_NAME_FIELD = 'personalInfo_fullName_lastName';
    private readonly NICK_NAME_FIELD = 'personalInfo_fullName_nickName';
    private readonly NAME_SUFFIX_FIELD = 'personalInfo_fullName_suffix';
    private readonly COMPANY_NAME_FIELD = 'businessInfo_companyName';
    private readonly PERSONAL_ADDRESS_CITY = 'personalInfo_fullAddress_city';
    private readonly BUSINESS_ADDRESS_CITY = 'businessInfo_companyFullAddress_city';
    private readonly PERSONAL_MOBILE_PHONE = 'personalInfo_mobilePhone';
    private readonly PERSONAL_HOME_PHONE = 'personalInfo_homePhone';
    private readonly BUSINESS_COMPANY_PHONE = 'businessInfo_companyPhone';
    private readonly BUSINESS_WORK_PHONE_1 = 'businessInfo_workPhone1';
    private readonly BUSINESS_WORK_PHONE_2 = 'businessInfo_workPhone2';
    private readonly BUSINESS_FAX = 'businessInfo_companyFaxNumber';

    private readonly FIELDS_TO_CAPITALIZE = [
        this.FIRST_NAME_FIELD,
        this.MIDDLE_NAME_FIELD,
        this.LAST_NAME_FIELD,
        this.NICK_NAME_FIELD,
        this.PERSONAL_ADDRESS_CITY,
        this.BUSINESS_ADDRESS_CITY
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

    totalCount: number = 0;
    importedCount: number = 0;
    mappingFields: any[] = [];

    fullName: ImportLeadFullName;
    fullAddress: ImportLeadAddressInput;

    readonly mappingObjectNames = {
        personalInfo: ImportLeadPersonalInput.fromJS({}),
        businessInfo: ImportLeadBusinessInput.fromJS({}),
        fullName: ImportLeadFullName.fromJS({}),
        fullAddress: ImportLeadAddressInput.fromJS({})
    };

    private readonly compareFields: any = [
        ['personalInfo_fullName_firstName:personalInfo_fullName_lastName'],
        ['personalInfo_email1', 'personalInfo_email2', 'personalInfo_email3', 'businessInfo_companyEmail', 'businessInfo_workEmail1', 'businessInfo_workEmail2', 'businessInfo_workEmail3'],
        ['personalInfo_mobilePhone', 'personalInfo_homePhone', 'personalInfo_homePhone', 'businessInfo_companyPhone', 'businessInfo_workPhone1', 'businessInfo_workPhone2'],
        ['personalInfo_fullAddress', 'businessInfo_companyFullAddress']
    ];

    private rootComponent: any;

    fieldsConfig = {};

    constructor(
        injector: Injector,
        private _leadService: LeadServiceProxy,
        private _router: Router,
        private _nameParser: NameParserService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.setMappingFields(ImportLeadInput.fromJS({}));
        this.initFieldsConfig();
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
    }

    private setNamePartFieldIfDefined(value, fieldName, dataSource) {
        if (value)
            dataSource[fieldName] = value;
    }

    private parseFullNameIntoDataSource(fullName, dataSource) {
        var parsed = this._nameParser.getParsed(fullName);
        this.setNamePartFieldIfDefined(parsed.title, this.NAME_PREFIX_FIELD, dataSource);
        this.setNamePartFieldIfDefined(parsed.first, this.FIRST_NAME_FIELD, dataSource);
        this.setNamePartFieldIfDefined(parsed.middle, this.MIDDLE_NAME_FIELD, dataSource);
        this.setNamePartFieldIfDefined(parsed.last, this.LAST_NAME_FIELD, dataSource);
        this.setNamePartFieldIfDefined(parsed.nick, this.NICK_NAME_FIELD, dataSource);
        this.setNamePartFieldIfDefined(parsed.suffix, this.NAME_SUFFIX_FIELD, dataSource);
    }

    cancel() {
        this.reset(() => {
            this._router.navigate(['app/crm/dashboard']);
        });
    }

    reset(callback = null) {
        this.totalCount = 0;
        this.importedCount = 0;
        this.wizard.reset(callback);
    }

    complete(data) {
        this.totalCount = data.length;
        this.message.confirm(
            this.l('LeadsImportComfirmation', [this.totalCount]),
            isConfirmed => {
                if (isConfirmed) {
                    this.startLoading(true);
                    let leadsInput = this.createLeadsInput(data);
                    this._leadService.importLeads(leadsInput)
                        .pipe(
                            finalize(() => this.finishLoading(true))
                        ).subscribe((res) => {
                            res.forEach((reff) => {
                                if (!reff.errorMessage)
                                    this.importedCount++;
                            });
                            if (this.importedCount > 0)
                                this.wizard.showFinishStep();
                            else
                                this.message.error(res[0].errorMessage);
                        });
                }                    
            }
        );
    }

    createLeadsInput(data: any[]): ImportLeadsInput {
        let result = ImportLeadsInput.fromJS({});
        result.leads = [];

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

        return ImportLeadsInput.fromJS(result);
    }

    setMappingFields(obj: object, parent: string = null) {
        let keys: string[] = Object.keys(obj);
        keys.forEach(v => {
            let combinedName = parent ? `${parent}${ImportWizardComponent.FieldSeparator}${v}` : v;
            if (this.mappingObjectNames[v]) {
                this.mappingFields.push({
                    id: combinedName, name: _s.humanize(v), parent: parent, expanded: true
                });
                this.setMappingFields(this.mappingObjectNames[v], combinedName);
            }
            else {
                this.mappingFields.push({ id: combinedName, name: _s.humanize(v), parent: parent || 'Other' });
            }
        });

        if (!parent) {
            this.mappingFields.push({
                id: 'Other', name: this.capitalize('Other'), parent: null, expanded: true
            });
        }
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.activate();
    }

    ngOnDestroy() {
        this.deactivate();
    }

    activate() {
        this.rootComponent.overflowHidden(true);
    }

    deactivate() {
        this.rootComponent.overflowHidden();
    }

    checkSimilarRecord = (record1, record2) => {
        record1.compared = record1.personalInfo_fullName_firstName +
            ' ' + record1.personalInfo_fullName_lastName;

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
        if (field.mappedField == this.FULL_NAME_FIELD) {
            this.parseFullNameIntoDataSource(sourceValue, reviewDataSource);
            return true;
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

        if (!(isCompanyName || isFullName || (isFistName && isLastName)))
            result.error = this.l('FieldsMapError');

        return result;
    }
}