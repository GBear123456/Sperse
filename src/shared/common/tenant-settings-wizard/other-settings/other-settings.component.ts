/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component
} from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    TenantPaymentSettingsServiceProxy,
    SubscriptionSettings
} from '@shared/service-proxies/service-proxies';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

@Component({
    selector: 'other-settings',
    templateUrl: 'other-settings.component.html',
    styleUrls: [
        '../shared/styles/common.less',
        'other-settings.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OtherSettingsComponent implements ITenantSettingsStepComponent {
    subsSettings: SubscriptionSettings;

    constructor(
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.tenantPaymentSettingsProxy.getSubscriptionSettings().subscribe((subsSettings) => {
            this.subsSettings = subsSettings;
            this.changeDetectorRef.detectChanges();
        });
    }

    save(): Observable<any> {
        if (this.subsSettings.defaultSubscriptionGracePeriodDayCount == undefined)
            this.subsSettings.defaultSubscriptionGracePeriodDayCount = 0;
        return this.tenantPaymentSettingsProxy.updateSubscriptionSettings(this.subsSettings);
    }
}