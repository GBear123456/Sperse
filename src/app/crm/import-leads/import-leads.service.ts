import { Injectable, Injector } from '@angular/core';
import { ImportWizardService } from '@app/shared/common/import-wizard/import-wizard.service';

@Injectable()
export class ImportLeadsService {
    constructor(injector: Injector,
        private _importWizardService: ImportWizardService
    ) {    }

    setupImportCheck(importId, method = undefined) {
        this._importWizardService.setupImportCheck(importId, method, 'leads');
    }
}