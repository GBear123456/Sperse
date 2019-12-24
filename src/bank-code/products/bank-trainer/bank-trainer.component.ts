/** Core imports */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ProductsService } from '@root/bank-code/products/products.service';

@Component({
    selector: 'bank-trainer',
    templateUrl: 'bank-trainer.component.html',
    styleUrls: ['./bank-trainer.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankTrainerComponent {
    environmentLink$: Observable<SafeUrl> = this.productsService.getResourceLink('become-a-trainer-landing');

    constructor(
        private productsService: ProductsService,
        public ls: AppLocalizationService
    ) {}
}
