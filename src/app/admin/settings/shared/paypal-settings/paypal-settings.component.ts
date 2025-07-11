/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    PayPalSettingsDto,
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
    paypalPaymentSettings: PayPalSettingsDto = new PayPalSettingsDto();

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
        this.loadSettings();
    }

    loadSettings() {
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

    createConnectedAccount() {
        if (this.isHost || !this.paypalPaymentSettings.isHostAccountEnabled || (this.paypalPaymentSettings && this.paypalPaymentSettings.merchantId))
            return;

        this.message.confirm('', this.l('Do you want to connect Paypal account ?'), (isConfirmed) => {
            if (isConfirmed) {
                this.startLoading();
                this.tenantPaymentSettingsService.getPayPalPartnerConnectUrl().pipe(
                    finalize(() => this.finishLoading())
                ).subscribe((url) => {
                    window.location.href = url;
                });
            }
        });
    }

    unlinkMerchant() {
        if (this.isHost || !this.paypalPaymentSettings.merchantId)
            return;

        this.message.confirm('', this.l('Do you want to unlink Paypal account ?'), (isConfirmed) => {
            if (isConfirmed) {
                this.startLoading();
                this.tenantPaymentSettingsService.unlinkPayPalMerchant().pipe(
                    finalize(() => this.finishLoading())
                ).subscribe(() => {
                    this.loadSettings();
                });
            }
        });
    }

    getSaveObs(): Observable<any> {
        return this.tenantPaymentSettingsService.updatePayPalSettings(this.paypalPaymentSettings);
    }

    getPayPalWebhookUrl(): string {
        let tenantId = this.appSession.tenantId || '';
        return AppConsts.remoteServiceBaseUrl + `/api/paypal/ProcessWebhook?tenantId=${tenantId}`;
    }

    get isMerchantConnected(): boolean {
        return this.paypalPaymentSettings.merchantId && this.paypalPaymentSettings.merchantEmailConfirmed && this.paypalPaymentSettings.merchantPaymentsReceivable;
    }

    copyToClipboard(value: string) {
        this.clipboardService.copyFromContent(value.trim());
        this.notify.info(this.l('SavedToClipboard'));
    }
}