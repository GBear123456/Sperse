import { Injectable } from '@angular/core';
import { ImportWizardService } from '@app/shared/common/import-wizard/import-wizard.service';
import { ImportServiceProxy, ImportTypeInput } from '@shared/service-proxies/service-proxies';
import { ContactGroup } from '@shared/AppEnums';

@Injectable()
export class ImportLeadsService {
    constructor(
        private importWizardService: ImportWizardService,
        private importProxy: ImportServiceProxy
    ) {
        importWizardService.cancelListen((importIds) => {
            if (importIds && importIds.length)
                importIds.forEach((id) => importProxy.cancel(id).subscribe());
            else if (importWizardService.activeImportId)
                importProxy.cancel(importWizardService.activeImportId).subscribe(() => {
                    importWizardService.activeImportId = undefined;
                });
        });
    }

    setupImportCheck(importId?: number, method?: Function, uri = 'leads') {
        this.importWizardService.startStatusCheck(importId, method, uri);
    }

    stopImportCheck() {
        this.importWizardService.finishStatusCheck();
    }

    getContactGroupFromInputType(importType: ImportTypeInput): ContactGroup {
        let contactGroup: ContactGroup = importType;
        if (importType === ImportTypeInput.Lead)
            contactGroup = 'Client';
        if (importType === ImportTypeInput.Employee)
            contactGroup = 'UserProfile';
        return ContactGroup[contactGroup as string];
    }
}
