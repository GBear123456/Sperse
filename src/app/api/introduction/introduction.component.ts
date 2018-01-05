import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

import { appModuleAnimation } from '@shared/animations/routerTransition';

@Component({
    templateUrl: './introduction.component.html',
    styleUrls: ['./introduction.component.less'],
    animations: [appModuleAnimation()]
})
export class IntroductionComponent extends AppComponentBase implements OnInit {
    public headlineConfig = {
        names: [this.l("Interactive API Documentation")],
        icon: 'magic-wand',
        buttons: []
    };

    constructor(injector: Injector) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit(): void {
    }
}
