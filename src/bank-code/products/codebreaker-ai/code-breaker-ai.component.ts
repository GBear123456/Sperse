/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { environment } from '@root/environments/environment';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'code-breaker-ai',
    templateUrl: 'code-breaker-ai.component.html',
    styleUrls: ['./code-breaker-ai.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeBreakerAiComponent {
    hasSubscription$: Observable<boolean> = this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass);
    environmentLink$: Observable<any> = this.profileService.secureId$.pipe((
        map((secureId: string) => {
            return this.sanitizer.bypassSecurityTrustResourceUrl({
                development: 'https://wp.bankcode.pro/codebreaker-ai-landing/?WPSecureID=' + secureId,
                production: 'https://codebreakertech.com/codebreaker-ai-landing/?WPSecureID=' + secureId,
                staging: 'https://wp.bankcode.pro/codebreaker-ai-landing/?WPSecureID=' + secureId,
                beta: 'https://wp.bankcode.pro/codebreaker-ai-landing/?WPSecureID=' + secureId
            }[environment.releaseStage]);
        })
    ));

    constructor(
        private profileService: ProfileService,
        public sanitizer: DomSanitizer
    ) {}
}
