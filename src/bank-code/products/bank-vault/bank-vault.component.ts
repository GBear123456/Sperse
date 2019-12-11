import { Component } from '@angular/core';
import { ProductsService } from '@root/bank-code/products/products.service';

@Component({
    selector: 'bank-vault',
    templateUrl: 'bank-vault.component.html',
    styleUrls: ['./bank-vault.component.less']
})
export class BankVaultComponent {
    offerId = 546;
    hasSubscription: boolean = this.productsService.checkServiceSubscription('BANKVault');

    constructor(private productsService: ProductsService) {}
}
