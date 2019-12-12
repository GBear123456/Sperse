/** Core imports */
import { Component } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
// import '@node_modules/ngx-extended-pdf-viewer/assets/pdf-es5.js';
// import '@node_modules/ngx-extended-pdf-viewer/assets/pdf.worker-es5.js';
// import '@node_modules/ngx-extended-pdf-viewer/assets/viewer-es5.js';

/** Application imports */
import { ProductsService } from '@root/bank-code/products/products.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'why-they-buy',
    templateUrl: './why-they-buy.component.html',
    styleUrls: ['./why-they-buy.component.less']
})
export class WhyTheyBuyComponent {
    hasSubscription$: Observable<boolean> = this.productsService.checkServiceSubscription('WTBeBook');
    bookSrc = AppConsts.appBaseHref + 'assets/documents/Why+They+Buy+eBook+-+Black.pdf';

    constructor(private productsService: ProductsService) {}
}
