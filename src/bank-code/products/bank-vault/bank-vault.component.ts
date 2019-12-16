/** Core imports */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { ProductsService } from '@root/bank-code/products/products.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { environment } from '@root/environments/environment';

@Component({
    selector: 'bank-vault',
    templateUrl: 'bank-vault.component.html',
    styleUrls: ['./bank-vault.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankVaultComponent {
    offerId = 546;
    hasSubscription$: Observable<boolean> = this.productsService.checkServiceSubscription(BankCodeServiceType.BANKVault);

    environmentLink = {
        development: 'https://wp.bankcode.pro/the-vault-landing/',
        production: 'https://codebreakertech.com/the-vault-landing/',
        staging: 'https://wp.bankcode.pro/the-vault-landing/',
        beta: 'https://wp.bankcode.pro/the-vault-landing/'
    }[environment.releaseStage];

    constructor(
        private productsService: ProductsService,
        public sanitizer: DomSanitizer
    ) {}
}