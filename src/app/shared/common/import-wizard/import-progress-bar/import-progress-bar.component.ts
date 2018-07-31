/** Core imports */
import { Component, Injector, Input, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';

/** Third party imports */
import { DxProgressBarComponent } from 'devextreme-angular';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

import { ImportWizardService } from '../import-wizard.service';

@Component({
    selector: 'import-progress-bar',
    templateUrl: 'import-progress-bar.component.html',
    styleUrls: ['import-progress-bar.component.less']
})
export class ImportProgressBarComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxProgressBarComponent) progressComponent: DxProgressBarComponent;
             
    progress: number = 0;
    tooltipVisible: boolean;
    tooltipTimeout: any; 

    totalCount: number = 0;
    importedCount: number = 0;
    failedCount: number = 0;
  
    constructor(
        injector: Injector,
        private _importService: ImportWizardService
    ) {
        super(injector);

        _importService.progressListen((data) => {
            this.progress = data.progress;
            this.totalCount = data.totalCount;
            this.importedCount = data.importedCount;
            this.failedCount = data.failedCount;
        });
    }

    showStatus = () => {
        return this.progress + '% ' + this.l('ImportProgress');
    }

    cancelImport() {
        this._importService.cancelImport();
    }

    toggleTooltip(visible) {
        clearTimeout(this.tooltipTimeout);
        this.tooltipTimeout = setTimeout(() => {
            this.tooltipVisible =  visible;
        }, 1000);
    }

    ngOnDestroy() {
        this._importService.unsubscribe();
    }
}