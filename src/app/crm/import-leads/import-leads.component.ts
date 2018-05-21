import { Component, Injector, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ActivatedRoute, Router } from '@angular/router';
import { ImportWizardComponent } from '@app/shared/common/import-wizard/import-wizard.component';
import { AppConsts } from '@shared/AppConsts';

import { ImportLeadBusinessInput, LeadServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
  templateUrl: 'import-leads.component.html',
  styleUrls: ['import-leads.component.less']
})
export class ImportLeadsComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(ImportWizardComponent) wizard: ImportWizardComponent;
    imported: boolean = false;
    importedCount: number = 0;
    mappingFileds: any = [];

    private rootComponent: any;

    constructor(
        injector: Injector,
        private _leadService: LeadServiceProxy,
        private _router: Router
    ) { 
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
            
        this.mappingFileds = Object.keys(ImportLeadBusinessInput.fromJS({}));
    }

    cancel() {
        this._router.navigate(['app/crm/dashboard']);
    }

    reset() {
        this.imported = false;
        this.wizard.reset();
    }

    complete(data) {
        this.startLoading();
        this.imported = true;
        this.finishLoading()
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