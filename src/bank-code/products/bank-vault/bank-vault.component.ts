/** Core imports */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { environment } from '@root/environments/environment';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'bank-vault',
    templateUrl: 'bank-vault.component.html',
    styleUrls: ['./bank-vault.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankVaultComponent {
    offerId = 546;
    hasSubscription$: Observable<boolean> = this.profileService.checkServiceSubscription(BankCodeServiceType.BANKVault);

    environmentLink = {
        development: 'https://wp.bankcode.pro/the-vault-landing/',
        production: 'https://codebreakertech.com/the-vault-landing/',
        staging: 'https://wp.bankcode.pro/the-vault-landing/',
        beta: 'https://wp.bankcode.pro/the-vault-landing/'
    }[environment.releaseStage];

    constructor(
        private profileService: ProfileService,
        public sanitizer: DomSanitizer
    ) {}
}