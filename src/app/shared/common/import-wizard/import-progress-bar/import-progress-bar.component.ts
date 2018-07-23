/** Core imports */
import { Component, Injector, Input, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';

/** Third party imports */
import { DxProgressBarComponent } from 'devextreme-angular';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'import-progress-bar',
    templateUrl: 'import-progress-bar.component.html',
    styleUrls: ['import-progress-bar.component.less']
})
export class ImportProgressBarComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxProgressBarComponent) progressComponent: DxProgressBarComponent;
             
    progress: number = 0;
    tooltipVisible: boolean;
  
    constructor(
        injector: Injector,
    ) {
        super(injector);
    }

    ngOnInit() {
         //!! check import progress
    }

    showStatus = () => () {
        return this.progress + '% ' + this.l('Import Progress');
    }

    cancelImport() {
        //!!run corresponding api method
    }
}