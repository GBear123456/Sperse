/** Core imports */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ProductsService } from '@root/bank-code/products/products.service';
import { Observable } from 'rxjs';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { environment } from '@root/environments/environment';

@Component({
    selector: 'bank-affiliate',
    templateUrl: 'bank-affiliate.component.html',
    styleUrls: ['./bank-affiliate.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankAffiliateComponent {
    hasSubscription$: Observable<boolean> = this.productsService.checkServiceSubscription(BankCodeServiceType.BANKAffiliate);

    environmentLink = {
        development: 'https://wp.bankcode.pro/affiliate-landing/',
        production: 'https://codebreakertech.com/affiliate-landing/',
        staging: 'https://wp.bankcode.pro/affiliate-landing/',
        beta: 'https://wp.bankcode.pro/affiliate-landing/'
    }[environment.releaseStage];

    constructor(
        private productsService: ProductsService,
        public ls: AppLocalizationService,
        public sanitizer: DomSanitizer
    ) {}
}
