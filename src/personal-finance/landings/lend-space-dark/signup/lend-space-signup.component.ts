import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { AppComponentBase } from 'shared/common/app-component-base';
import { AppConsts } from 'shared/AppConsts';

@Component({
    selector: 'lend-space-signup',
    templateUrl: './lend-space-signup.component.html',
    styleUrls: ['./lend-space-signup.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LendSpaceSignupComponent extends AppComponentBase {
    constructor(
        injector: Injector
    ) {
        super(injector, AppConsts.localization.PFMLocalizationSourceName);
    }
}
