/** Core imports */
import { Component, ChangeDetectionStrategy } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { ProductsService } from '@root/bank-code/products/products.service';
import { SafeUrl } from '@angular/platform-browser';

@Component({
    selector: 'bank-vault',
    templateUrl: 'bank-vault.component.html',
    styleUrls: ['./bank-vault.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankVaultComponent {
    hasSubscription$: Observable<boolean> = this.profileService.checkServiceSubscription(BankCodeServiceType.BANKVault);
    environmentLink$: Observable<SafeUrl> = this.productsService.getResourceLink('the-vault-landing');

    constructor(
        private profileService: ProfileService,
        private productsService: ProductsService
    ) {}
}
