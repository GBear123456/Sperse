import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { SetupStepComponent } from '../shared/setup-steps/setup-steps.component';
import { ActivatedRoute } from '@angular/router';

@Component({
    templateUrl: './cashflow-setup.component.html',
    styleUrls: ['./cashflow-setup.component.less'],
    animations: [appModuleAnimation()]
})
export class CashflowSetupComponent extends CFOComponentBase implements OnInit {
    public headlineConfig;

    constructor(injector: Injector, route: ActivatedRoute) {
        super(injector, route);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.headlineConfig = { 
            names: [this.l('CashflowSetup_Title')], 
            iconSrc: 'assets/common/icons/magic-stick-icon.svg',
            buttons: []
        }
    }
}
