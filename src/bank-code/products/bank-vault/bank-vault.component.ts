import { Component } from '@angular/core';
import { ProductsService } from '@root/bank-code/products/products.service';
import { Observable } from 'rxjs';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';

@Component({
    selector: 'bank-vault',
    templateUrl: 'bank-vault.component.html',
    styleUrls: ['./bank-vault.component.less']
})
export class BankVaultComponent {
    offerId = 546;
    hasSubscription$: Observable<boolean> = this.productsService.checkServiceSubscription(BankCodeServiceType.BANKVault);

    constructor(private productsService: ProductsService) {}
}
