import { Component, Injector, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ActivatedRoute, Router } from '@angular/router';
import { ImportWizardComponent } from '@app/shared/common/import-wizard/import-wizard.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
  templateUrl: 'import-leads.component.html',
  styleUrls: ['import-leads.component.less']
})
export class ImportLeadsComponent extends AppComponentBase {
    @ViewChild(ImportWizardComponent) wizard: ImportWizardComponent;
    imported: boolean = false;
    importedCount: number = 0;

    constructor(
        injector: Injector,
        private _router: Router
    ) { 
        super(injector, AppConsts.localization.CRMLocalizationSourceName);       
    }

    cancel() {
        this._router.navigate(['app/crm/dashboard']);
    }

    reset() {
        this.imported = false;
        this.wizard.reset();
    }

    complete() {
        this.imported = true;
    }
}