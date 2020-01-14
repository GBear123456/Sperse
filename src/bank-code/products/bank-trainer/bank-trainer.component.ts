/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

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
export class BankTrainerComponent implements AfterViewInit {
    dataIsLoading = true;
    environmentLink$: Observable<SafeUrl> = this.productsService.getResourceLink('become-a-trainer-landing');

    constructor(
        private productsService: ProductsService,
        public ls: AppLocalizationService,
        private changeDetectorRef: ChangeDetectorRef,
        @Inject(DOCUMENT) private document: any
    ) {}

    ngAfterViewInit() {
        this.document.querySelector('iframe').addEventListener('load', () => {
            this.dataIsLoading = false;
            this.changeDetectorRef.detectChanges();
        });
    }
}
