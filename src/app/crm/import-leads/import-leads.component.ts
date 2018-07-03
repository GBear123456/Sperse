import { Component, Injector, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ActivatedRoute, Router } from '@angular/router';
import { ImportWizardComponent } from '@app/shared/common/import-wizard/import-wizard.component';
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { ImportLeadBusinessInput, ImportLeadBusinessesInput, LeadServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
  templateUrl: 'import-leads.component.html',
  styleUrls: ['import-leads.component.less'],
  animations: [appModuleAnimation()]
})
export class ImportLeadsComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(ImportWizardComponent) wizard: ImportWizardComponent;

    totalCount:  number = 0;
    importedCount: number = 0;
    mappingFileds: any = [];

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
            
        this.mappingFileds = Object.keys(ImportLeadBusinessInput.fromJS({}));
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
        this._leadService.importLeadBusinesses(ImportLeadBusinessesInput.fromJS({
            leads: data
        })).finally(() => this.finishLoading(true)).subscribe((res) => {
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

    checkSimilarRecord = (list, row, index) => {
        for (let i = 1; i < list.length; i++) //!!VP Temporary solution(stub), will be implemented separate logic to determinate similar records
            if (i != index && list[i] && list[i].join(',').indexOf(row['email1']) >= 0)
                return row.compared = 'Similar items "' + row['email1'] + '"';
    }
}
