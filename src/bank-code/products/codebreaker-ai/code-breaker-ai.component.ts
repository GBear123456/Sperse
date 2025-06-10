/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

/** Third party imports */
import { Observable, zip } from 'rxjs';
import { tap, map } from 'rxjs/operators';

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
    dataIsLoading = true;
    hasSubscription$: Observable<boolean> = zip(
        this.profileService.checkServiceSubscription(BankCodeServiceType.CodebreakerAI),
        this.profileService.checkServiceSubscription(BankCodeServiceType.BANKVault),
        this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass)
    ).pipe(
        map((res: boolean[]) => res.some(Boolean)),
        tap(() => setTimeout(() => {
            this.changeDetectorRef.detectChanges();
        }))
    );

    environmentLink$: Observable<SafeUrl> = this.productsService.getResourceLink('codebreaker-ai-landing');

    constructor(
        private profileService: ProfileService,
        private productsService: ProductsService,
        private changeDetectorRef: ChangeDetectorRef
    ) {}

    onIframeLoad(e) {
        if (e.target.src !== '') {
            this.dataIsLoading = false;
        }
    }
}
