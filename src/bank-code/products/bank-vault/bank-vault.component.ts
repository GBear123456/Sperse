/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

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
        tap((hasSubscription) => setTimeout(() => {
            if (hasSubscription) this.dataIsLoading = false;
            this.changeDetectorRef.detectChanges();
        }))
    );
    environmentLink$: Observable<SafeUrl> = this.productsService.getResourceLink('the-vault-landing');
    accessLink$: Observable<SafeUrl> = this.productsService.getResourceLink('the-vault-access');

    constructor(
        private profileService: ProfileService,
        private productsService: ProductsService,
        private changeDetectorRef: ChangeDetectorRef,
        @Inject(DOCUMENT) private document: any
    ) {}

    onIframeLoad() {
        this.dataIsLoading = false;
        this.changeDetectorRef.detectChanges();
    }
}
