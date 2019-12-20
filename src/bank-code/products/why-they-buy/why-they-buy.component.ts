/** Core imports */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { environment } from '@root/environments/environment';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'why-they-buy',
    templateUrl: './why-they-buy.component.html',
    styleUrls: ['./why-they-buy.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhyTheyBuyComponent {
    hasSubscription$: Observable<boolean> = this.profileService.checkServiceSubscription(BankCodeServiceType.WTBeBook);
    bookSrc = AppConsts.appBaseHref + 'assets/documents/Why+They+Buy+eBook+-+Black.pdf';

    environmentLink = {
        development: 'https://wp.bankcode.pro/why-they-buy-digital-landing/?WPSecureID=' + this.profileService.secureId,
        production: 'https://codebreakertech.com/why-they-buy-digital-landing/?WPSecureID=' + this.profileService.secureId,
        staging: 'https://wp.bankcode.pro/why-they-buy-digital-landing/?WPSecureID=' + this.profileService.secureId,
        beta: 'https://wp.bankcode.pro/why-they-buy-digital-landing/?WPSecureID=' + this.profileService.secureId
    }[environment.releaseStage];

    constructor(
        private profileService: ProfileService,
        public sanitizer: DomSanitizer
    ) {}
}