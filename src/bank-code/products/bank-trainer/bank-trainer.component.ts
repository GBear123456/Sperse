/** Core imports */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { environment } from '@root/environments/environment';

@Component({
    selector: 'bank-trainer',
    templateUrl: 'bank-trainer.component.html',
    styleUrls: ['./bank-trainer.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankTrainerComponent {
    environmentLink = {
        development: 'https://wp.bankcode.pro/become-a-trainer-landing/',
        production: 'https://codebreakertech.com/become-a-trainer-landing/',
        staging: 'https://wp.bankcode.pro/become-a-trainer-landing/',
        beta: 'https://wp.bankcode.pro/become-a-trainer-landing/'
    }[environment.releaseStage];

    constructor(
        public ls: AppLocalizationService,
        public sanitizer: DomSanitizer
    ) {}
}
