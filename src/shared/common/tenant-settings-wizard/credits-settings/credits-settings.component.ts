/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component
} from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    TenantPaymentSettingsServiceProxy,
    CreditSettings,
    ProductServiceProxy,
    ProductType,
    ProductDto
} from '@shared/service-proxies/service-proxies';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

@Component({
    selector: 'credits-settings',
    templateUrl: 'credits-settings.component.html',
    styleUrls: [
        '../shared/styles/common.less',
        'credits-settings.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ProductServiceProxy]
})
export class CreditsSettingsComponent implements ITenantSettingsStepComponent {
    creditSettings: CreditSettings;

    products$: Observable<ProductDto[]> = this.productProxy.getProducts(ProductType.General, undefined, false, true)
        .pipe(map(values => {
            return values.filter(v => v.isPublished);
        }));

    constructor(
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private productProxy: ProductServiceProxy,
        public ls: AppLocalizationService
    ) {
        this.tenantPaymentSettingsProxy.getCreditSettings().subscribe((creditSettings) => {
            this.creditSettings = creditSettings;
            this.changeDetectorRef.detectChanges();
        });
    }

    save(): Observable<any> {
        return this.tenantPaymentSettingsProxy.updateCreditSettings(this.creditSettings);
    }
}