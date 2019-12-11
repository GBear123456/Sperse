import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ProductsService } from '@root/bank-code/products/products.service';

@Component({
    selector: 'bank-affiliate',
    templateUrl: 'bank-affiliate.component.html',
    styleUrls: ['./bank-affiliate.component.less']
})
export class BankAffiliateComponent {
    hasSubscription: boolean = this.productsService.checkServiceSubscription('BANKAffiliate');

    constructor(
        private productsService: ProductsService,
        public ls: AppLocalizationService
    ) {}
}
