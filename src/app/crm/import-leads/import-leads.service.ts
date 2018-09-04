import { Injectable, Injector } from '@angular/core';
import { ImportWizardService } from '@app/shared/common/import-wizard/import-wizard.service';
import { ImportServiceProxy } from '@shared/service-proxies/service-proxies';

@Injectable()
export class ImportLeadsService {
    constructor(injector: Injector,
        private _importWizardService: ImportWizardService,
        private _importProxy: ImportServiceProxy
    ) {    
        _importWizardService.cancelListen((importIds) => {
            if (importIds && importIds.length) 
                importIds.forEach((id) => _importProxy.cancel(id).subscribe());
            else if (_importWizardService.activeImportId)
                _importProxy.cancel(_importWizardService.activeImportId).subscribe(() => {
                    _importWizardService.activeImportId = undefined;
                });
        });
    }

    setupImportCheck(importId = undefined, method = undefined, uri = 'leads') {
        this._importWizardService.startStatusCheck(importId, method, uri);
    }

    stopImportCheck() {
        this._importWizardService.finishStatusCheck();
    }
}