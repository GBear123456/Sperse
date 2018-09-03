import { Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

import { appModuleAnimation } from '@shared/animations/routerTransition';

@Component({
    templateUrl: './introduction.component.html',
    styleUrls: ['./introduction.component.less'],
    animations: [appModuleAnimation()]
})
export class IntroductionComponent extends AppComponentBase implements OnInit, OnDestroy {
    public headlineConfig = {
        names: [this.l('Interactive API Documentation')],
        iconSrc: 'assets/common/icons/api-icon.svg',
        buttons: []
    };

    constructor(injector: Injector) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit(): void {
        let input: any = $('.code-input');
        input.inputmask('AAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAA');
        this.getRootComponent().overflowHidden(true);
    }

    ngOnDestroy() {
        this.getRootComponent().overflowHidden();
    }
}
