import { Component, Input } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@root/shared/AppConsts';

@Component({
    selector: 'api-welcome',
    templateUrl: './api-welcome.component.html',
    styleUrls: ['./api-welcome.component.less']
})
export class ApiWelcomeComponent {
    @Input() small: false;

    defaultTenantName = AppConsts.defaultTenantName;

    constructor(
        public ls: AppLocalizationService
    ) {}
}
