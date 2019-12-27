/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { ProductsService } from '@root/bank-code/products/products.service';

@Component({
    selector: 'code-breaker-ai',
    templateUrl: 'code-breaker-ai.component.html',
    styleUrls: ['./code-breaker-ai.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeBreakerAiComponent {
    hasSubscription$: Observable<boolean> = this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass);
    environmentLink$: Observable<SafeUrl> = this.productsService.getResourceLink('codebreaker-ai-landing');

    constructor(
        private profileService: ProfileService,
        private productsService: ProductsService
    ) {}
}
