/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    StripeSettingsDto, TenantPaymentSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@root/shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'stripe-settings',
    templateUrl: './stripe-settings.component.html',
    styleUrls: ['./stripe-settings.component.less', './../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantPaymentSettingsServiceProxy]
})
export class StripeSettingsComponent extends SettingsComponentBase {
    isPaymentsEnabled: boolean = abp.features.isEnabled(AppFeatures.CRMPayments);
    stripePaymentSettings: StripeSettingsDto = new StripeSettingsDto();

    showAdvancedSettings = this.isHost;

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
            this.tenantPaymentSettingsService.getStripeSettings()
                .pipe(
                    finalize(() => this.finishLoading())
                )
                .subscribe(res => {
                    this.stripePaymentSettings = res;
                    this.showAdvancedSettings = this.isHost || !!this.stripePaymentSettings.apiKey;
                    this.changeDetection.detectChanges();
                })
        }
    }

    createConnectedAccount() {
        if (this.isHost || !this.stripePaymentSettings.isHostAccountEnabled || this.stripePaymentSettings.isConnectedAccountSetUpCompleted)
            return;

        this.message.confirm('', this.l('Do you want to connect Stripe account ?'), (isConfirmed) => {
            if (isConfirmed) {
                this.startLoading();
                let method = this.stripePaymentSettings.connectedAccountId ?
                    this.tenantPaymentSettingsService.connectStripeAccount() :
                    this.tenantPaymentSettingsService.getConnectOAuthAuthorizeUrl();
                method.pipe(
                    finalize(() => this.finishLoading())
                ).subscribe((url) => {
                    window.location.href = url;
                });
            }
        });
    }

    disconnedConnectedAccount() {
        alert('disconnectConnectedAccount');
    }

    createWebhook(isConnected) {
        this.startLoading();
        this.tenantPaymentSettingsService.createStripeWebhook(isConnected)
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(() => {
                this.notify.info(this.l('SuccessfullyGenerated'));
                this.loadSettings();
            })
    }

    getSaveObs(): Observable<any> {
        return this.tenantPaymentSettingsService.updateStripeSettings(this.stripePaymentSettings);
    }

    getStripeWebhookUrl(): string {
        let tenantParam = this.appSession.tenantId ? `?tenantId=${this.appSession.tenantId}` : '';
        return AppConsts.remoteServiceBaseUrl + `/api/stripe/processWebhook${tenantParam}`;
    }

    getStripeConnectWebhookUrl(): string {
        let tenantParam = this.appSession.tenantId ? `?tenantId=${this.appSession.tenantId}` : '';
        return AppConsts.remoteServiceBaseUrl + `/api/stripe/processConnectWebhook${tenantParam}`;
    }

    getStripeOAuthConnectRedirectUrl(): string {
        return AppConsts.remoteServiceBaseUrl + `/stripeConnectAccount/oauth`;
    }
}