/** Core imports */
import { Component, Injector, Input, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';

/** Third party imports */
import { DxProgressBarComponent } from 'devextreme-angular';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { ImportStatus } from '@shared/AppEnums';

import { ImportWizardService } from '../import-wizard.service';

@Component({
    selector: 'import-progress-bar',
    templateUrl: 'import-progress-bar.component.html',
    styleUrls: ['import-progress-bar.component.less']
})
export class ImportProgressBarComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxProgressBarComponent) progressComponent: DxProgressBarComponent;
             
    @Input() summaryTooltip: boolean = true;

    importStatuses = ImportStatus;

    progress: number = 100;
    tooltipVisible: boolean;
    tooltipTimeout: any; 

    totalCount: number = 0;
    importedCount: number = 0;
    failedCount: number = 0;
    
    list: any = [];
  
    private subscription: any;

    constructor(
        injector: Injector,
        private _importService: ImportWizardService
    ) {
        super(injector);

        this.subscription = _importService.progressListen((data) => {
            if (data && data.length) {
                this.progress = 0;
                this.list = data;
                data.forEach((entity) => {
                    entity.progress = Math.round((entity.importedCount 
                        + entity.failedCount) / entity.totalCount * 100);
                    this.progress += entity.progress;
                });
                this.progress = Math.round(this.progress / data.length);
                if (this.progress >= 100)
                    _importService.finishStatusCheck();
            } else {
                this.progress = 100;
                _importService.finishStatusCheck();
            }
        });
    }

    showStatus = () => {
        return this.progress + '% ' + this.l('ImportProgress');
    }

    cancelImport(importId = undefined) {
        this.tooltipVisible = false;
        this.message.confirm(
            this.l('ImportCancelConfirmation'),
            this.l(importId ? 'CancelImport': 'CancelAllImports'),
            isConfirmed => {
                if (isConfirmed)
                    this._importService.cancelImport(importId ? 
                        [importId]: this.list.map((item) => item.id));
            }
        );
    }

    toggleTooltip(visible) {
        if (this.summaryTooltip) {
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = setTimeout(() => {
                this.tooltipVisible =  visible;
            }, 1000);
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}