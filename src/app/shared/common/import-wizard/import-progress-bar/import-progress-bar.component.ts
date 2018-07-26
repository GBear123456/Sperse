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
  
    constructor(
        injector: Injector,
        private _importService: ImportWizardService
    ) {
        super(injector);

        _importService.progressListen((progress) => {
            this.progress = progress;
        });
    }

    showStatus = () => {
        return this.progress + '% ' + this.l('Import Progress');
    }

    cancelImport() {
        this._importService.cancelImport();
    }

    ngOnDestroy() {
        this._importService.unsubscribe();
    }
}