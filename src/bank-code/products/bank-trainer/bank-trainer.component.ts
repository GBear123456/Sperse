/** Core imports */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { environment } from '@root/environments/environment';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'bank-trainer',
    templateUrl: 'bank-trainer.component.html',
    styleUrls: ['./bank-trainer.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankTrainerComponent {
    environmentLink = {
        development: 'https://wp.bankcode.pro/become-a-trainer-landing/?WPSecureID=' + this.profileService.secureId,
        production: 'https://codebreakertech.com/become-a-trainer-landing/?WPSecureID=' + this.profileService.secureId,
        staging: 'https://wp.bankcode.pro/become-a-trainer-landing/?WPSecureID=' + this.profileService.secureId,
        beta: 'https://wp.bankcode.pro/become-a-trainer-landing/?WPSecureID=' + this.profileService.secureId
    }[environment.releaseStage];

    constructor(
        public ls: AppLocalizationService,
        public profileService: ProfileService,
        public sanitizer: DomSanitizer
    ) {}
}
