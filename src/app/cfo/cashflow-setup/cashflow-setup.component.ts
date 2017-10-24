import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { SetupStepComponent } from '../shared/setup-steps/setup-steps.component';

@Component({
    templateUrl: "./cashflow-setup.component.html",
    styleUrls: ["./cashflow-setup.component.less"],
    animations: [appModuleAnimation()]
})
export class CashflowSetupComponent extends AppComponentBase implements OnInit {
    constructor(injector: Injector) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit(): void {
    }
}
