/** Core imports */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';
// import '@node_modules/ngx-extended-pdf-viewer/assets/pdf-es5.js';
// import '@node_modules/ngx-extended-pdf-viewer/assets/pdf.worker-es5.js';
// import '@node_modules/ngx-extended-pdf-viewer/assets/viewer-es5.js';

/** Application imports */
import { ProductsService } from '@root/bank-code/products/products.service';
import { AppConsts } from '@shared/AppConsts';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { environment } from '@root/environments/environment';

@Component({
    selector: 'why-they-buy',
    templateUrl: './why-they-buy.component.html',
    styleUrls: ['./why-they-buy.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhyTheyBuyComponent {
    hasSubscription$: Observable<boolean> = this.productsService.checkServiceSubscription(BankCodeServiceType.WTBeBook);
    bookSrc = AppConsts.appBaseHref + 'assets/documents/Why+They+Buy+eBook+-+Black.pdf';

    environmentLink = {
        development: 'https://wp.bankcode.pro/why-they-buy-digital-landing/',
        production: 'https://codebreakertech.com/why-they-buy-digital-landing/',
        staging: 'https://wp.bankcode.pro/why-they-buy-digital-landing/',
        beta: 'https://wp.bankcode.pro/why-they-buy-digital-landing/'
    }[environment.releaseStage];

    constructor(
        private productsService: ProductsService,
        public sanitizer: DomSanitizer
    ) {}
}