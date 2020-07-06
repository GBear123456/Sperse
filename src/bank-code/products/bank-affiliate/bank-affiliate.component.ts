/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { ProductsService } from '@root/bank-code/products/products.service';

@Component({
    selector: 'bank-affiliate',
    templateUrl: 'bank-affiliate.component.html',
    styleUrls: ['./bank-affiliate.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankAffiliateComponent {
    dataIsLoading = true;
    hasSubscription$: Observable<boolean> = this.profileService.checkServiceSubscription(BankCodeServiceType.BANKAffiliate).pipe(
        tap(() => setTimeout(() => {
            this.changeDetectorRef.detectChanges();
        }))
    );
    environmentLink$: Observable<SafeUrl> = this.productsService.getResourceLink('affiliate-landing');

    constructor(
        private profileService: ProfileService,
        private productsService: ProductsService,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    onIframeLoad(e) {
        if (e.target.src !== '') {
            this.dataIsLoading = false;
        }
    }
}
