import { Component, Injector, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ActivatedRoute, Router } from '@angular/router';
import { ImportWizardComponent } from '@app/shared/common/import-wizard/import-wizard.component';
import { AppConsts } from '@shared/AppConsts';

import { ImportLeadBusinessInput, ImportLeadBusinessesInput, LeadServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
  templateUrl: 'import-leads.component.html',
  styleUrls: ['import-leads.component.less']
})
export class ImportLeadsComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(ImportWizardComponent) wizard: ImportWizardComponent;

    totalCount:  number = 0;
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
        this.totalCount = 0;
        this.importedCount = 0;

        this._router.navigate(['app/crm/dashboard']);
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
}
