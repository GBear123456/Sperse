import { Component, Injector, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ActivatedRoute, Router } from '@angular/router';
import { ImportWizardComponent } from '@app/shared/common/import-wizard/import-wizard.component';
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import {
    ImportLeadInput, ImportLeadsInput, ImportLeadPersonalInput, ImportLeadBusinessInput, ImportLeadFullName, ImportLeadAddressInput,
    LeadServiceProxy
} from '@shared/service-proxies/service-proxies';

import * as _s from 'underscore.string';

@Component({
    templateUrl: 'import-leads.component.html',
    styleUrls: ['import-leads.component.less'],
    animations: [appModuleAnimation()]
})
export class ImportLeadsComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(ImportWizardComponent) wizard: ImportWizardComponent;

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

    private fieldConfig = {
        cssClass: 'capitalize'
    };
    private phoneConfig = {
        cellTemplate: 'phoneCell'
    };
    private rootComponent: any;

    fieldsConfig = {
        phoneNumber: this.phoneConfig,
        faxNumber: this.phoneConfig,
        firstName: this.fieldConfig,
        nickName: this.fieldConfig,
        middleName: this.fieldConfig,
        lastName: this.fieldConfig,
        city: this.fieldConfig
    };

    constructor(
        injector: Injector,
        private _leadService: LeadServiceProxy,
        private _router: Router
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.setMappingFields(ImportLeadInput.fromJS({}));
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
        this.startLoading(true);
        this.totalCount = data.length;
        let leadsInput = this.createLeadsInput(data);
        this._leadService.importLeads(leadsInput).finally(() => this.finishLoading(true)).subscribe((res) => {
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
}