/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    PayPalSettings,
    TenantPaymentSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@root/shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'paypal-settings',
    templateUrl: './paypal-settings.component.html',
    styleUrls: ['./paypal-settings.component.less', './../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantPaymentSettingsServiceProxy]
})
export class PaypalSettingsComponent extends SettingsComponentBase {
    isPaymentsEnabled: boolean = abp.features.isEnabled(AppFeatures.CRMPayments);
    paypalPaymentSettings: PayPalSettings = new PayPalSettings();

    payPalEnvironments = [
        { value: 'sandbox', text: 'Sandbox' },
        { value: 'live', text: 'Live' }
    ];

    constructor(
        _injector: Injector,
        private tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        if (this.isPaymentsEnabled) {
            this.tenantPaymentSettingsService.getPayPalSettings()
                .pipe(
                    finalize(() => this.finishLoading())
                )
                .subscribe(res => {
                    this.paypalPaymentSettings = res;
                    this.changeDetection.detectChanges();
                })
        }
    }

    getSaveObs(): Observable<any> {
        return this.tenantPaymentSettingsService.updatePayPalSettings(this.paypalPaymentSettings);
    }

    getPayPalWebhookUrl(): string {
        let key = this.paypalPaymentSettings.webhookKey || '{webhook_key}';
        let tenantId = this.appSession.tenantId || '';
        return AppConsts.remoteServiceBaseUrl + `/api/paypal/ProcessWebhook?tenantId=${tenantId}&key=${key}`;
    }
}