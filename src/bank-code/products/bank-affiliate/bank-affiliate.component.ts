import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ProductsService } from '@root/bank-code/products/products.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'bank-affiliate',
    templateUrl: 'bank-affiliate.component.html',
    styleUrls: ['./bank-affiliate.component.less']
})
export class BankAffiliateComponent {
    hasSubscription$: Observable<boolean> = this.productsService.checkServiceSubscription('BANKAffiliate');

    constructor(
        private productsService: ProductsService,
        public ls: AppLocalizationService
    ) {}
}
