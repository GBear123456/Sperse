/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Application imports */
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { ProductsService } from '@root/bank-code/products/products.service';

@Component({
    selector: 'bank-vault',
    templateUrl: 'bank-vault.component.html',
    styleUrls: ['./bank-vault.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankVaultComponent {
    dataIsLoading = true;
    hasSubscription$: Observable<boolean> = this.profileService.checkServiceSubscription(BankCodeServiceType.BANKVault).pipe(
        tap(() => setTimeout(() => {
            this.changeDetectorRef.detectChanges();
        }))
    );
    environmentLink$: Observable<SafeUrl> = this.productsService.getResourceLink('the-vault-landing');
    accessLink$: Observable<SafeUrl> = this.productsService.getResourceLink('the-vault-access');

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
