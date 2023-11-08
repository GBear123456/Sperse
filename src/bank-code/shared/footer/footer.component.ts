import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-code-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.less']
})
export class FooterComponent {
    currentYear = new Date().getFullYear();

    constructor(
        public ls: AppLocalizationService
    ) {}
}
