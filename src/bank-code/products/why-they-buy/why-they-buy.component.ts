/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { ProductsService } from '@root/bank-code/products/products.service';

@Component({
    selector: 'why-they-buy',
    templateUrl: './why-they-buy.component.html',
    styleUrls: ['./why-they-buy.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhyTheyBuyComponent {
    dataIsLoading = true;
    hasSubscription$: Observable<boolean> = this.profileService.checkServiceSubscription(BankCodeServiceType.WTBeBook).pipe(
        tap((hasSubscription) => setTimeout(() => {
            if (hasSubscription) this.dataIsLoading = false;
            this.changeDetectorRef.detectChanges();
        }))
    );
    bookSrc = AppConsts.appBaseHref + 'assets/documents/Why+They+Buy+eBook+-+Black.pdf';
    environmentLink$: Observable<SafeUrl> = this.productsService.getResourceLink('why-they-buy-digital-landing');

    constructor(
        private profileService: ProfileService,
        private productsService: ProductsService,
        private changeDetectorRef: ChangeDetectorRef
    ) {}

    onIframeLoad(e) {
        if (e.target.src !== '') {
            this.dataIsLoading = false;
        }
    }
}
