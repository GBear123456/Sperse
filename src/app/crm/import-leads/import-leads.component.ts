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
        first: this.fieldConfig,
        nick: this.fieldConfig,
        middle: this.fieldConfig,
        last: this.fieldConfig,
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
}
