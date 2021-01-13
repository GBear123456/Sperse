import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: [ './privacy-policy.component.less' ]
})
export class PrivacyPolicyComponent {
    constructor(public ls: AppLocalizationService) {}
}
