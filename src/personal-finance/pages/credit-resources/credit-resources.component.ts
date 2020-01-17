import { Component } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-credit-resources',
    templateUrl: './credit-resources.component.html',
    styleUrls: ['./credit-resources.component.less'],
    animations: [appModuleAnimation()]
})
export class CreditResourcesComponent {

    constructor(public ls: AppLocalizationService) {}

}
