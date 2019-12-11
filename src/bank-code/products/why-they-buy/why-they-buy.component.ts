import { Component } from '@angular/core';
import { ProductsService } from '@root/bank-code/products/products.service';

@Component({
    selector: 'why-they-buy',
    templateUrl: './why-they-buy.component.html',
    styleUrls: ['./why-they-buy.component.less']
})
export class WhyTheyBuyComponent {
    hasWTBBookSubscription: boolean = this.productsService.checkServiceSubscription('WTBeBook');

    constructor(private productsService: ProductsService) {}
}
