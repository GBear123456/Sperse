import { Injectable, Injector } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';

import { ImportStatus } from '@shared/AppEnums';
import { ImportWizardService } from '@app/shared/common/import-wizard/import-wizard.service';
import { ImportServiceProxy } from '@shared/service-proxies/service-proxies';

import { Subscription, Subject } from 'rxjs';

@Injectable()
export class ImportLeadsService {
    constructor(injector: Injector,
        private _importService: ImportWizardService,
        private _reuseService: RouteReuseStrategy,
        private _importProxy: ImportServiceProxy
    ) {    }

    setupImportCheck(importId, method = undefined) {
        this._importService.activeImportId = importId;
        this._importService.setupStatusCheck((callback) => {
            this._importProxy.getStatus(importId).subscribe((res) => {
                method && method(res);
                if ([ImportStatus.Completed, ImportStatus.Cancelled].indexOf(<ImportStatus>res.statusId) >= 0) {
                    this._importService.activeImportId = undefined;
                    (<any>this._reuseService).invalidate('leads');
                }                    
                callback({
                    progress: !this._importService.activeImportId ? 100: 
                        Math.round(((res.importedCount || 0) + (res.failedCount || 0)) / res.totalCount * 100),
                    totalCount: res.totalCount,
                    importedCount: res.importedCount,
                    failedCount: res.failedCount
                });
            })
        });
    }
}