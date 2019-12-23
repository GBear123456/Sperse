/** Core imports */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
    environmentLink$: Observable<any> = this.profileService.secureId$.pipe((
        map((secureId: string) => {
            return this.sanitizer.bypassSecurityTrustResourceUrl({
                development: 'https://wp.bankcode.pro/become-a-trainer-landing/?WPSecureID=' + secureId,
                production: 'https://codebreakertech.com/become-a-trainer-landing/?WPSecureID=' + secureId,
                staging: 'https://wp.bankcode.pro/become-a-trainer-landing/?WPSecureID=' + secureId,
                beta: 'https://wp.bankcode.pro/become-a-trainer-landing/?WPSecureID=' + secureId
            }[environment.releaseStage]);
        })
    ));

    constructor(
        public ls: AppLocalizationService,
        public profileService: ProfileService,
        public sanitizer: DomSanitizer
    ) {}
}
