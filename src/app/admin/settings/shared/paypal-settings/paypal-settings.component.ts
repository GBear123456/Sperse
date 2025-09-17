/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatTabChangeEvent } from '@angular/material/tabs';

/** Application imports */
import {
    PayPalSettingsDto,
    TenantPaymentSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@root/shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { SettingsComponentBase } from './../settings-base.component';
import { AlertCircle, ChevronDown, CreditCard, ExternalLink, House, PictureInPicture, Settings, TestTube } from 'lucide-angular';

@Component({
    selector: 'paypal-settings',
    templateUrl: './paypal-settings.component.html',
    styleUrls: ['./paypal-settings.component.less', './../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantPaymentSettingsServiceProxy]
})
export class PaypalSettingsComponent extends SettingsComponentBase {
    readonly HouseIcon = House;
    readonly SettingsIcon = Settings;
    readonly TestTubeIcon = TestTube;
    readonly MaximizeIcon = PictureInPicture;
    readonly ExternalIcon = ExternalLink;
    readonly ChevronIcon = ChevronDown;
    readonly AlertIcon = AlertCircle
    readonly CreditCardIcon = CreditCard;

    isPaymentsEnabled: boolean = abp.features.isEnabled(AppFeatures.CRMPayments);
    paypalPaymentSettings: PayPalSettingsDto = new PayPalSettingsDto();

    faqs = [
        {
            title: "I've got a PayPal account, how do I connect it?",
            content: "Sign in to your PayPal Developer Dashboard at developer.paypal.com. Create a new app under \"My Apps & Credentials\" to get your API credentials. Then enter these credentials in the API Settings tab."
        },
        {
            title: "What's PayPal and how do I get started?",
            content: "PayPal is a global payment processor that lets customers pay using credit cards or their PayPal account balance. Sign up at paypal.com to create a business account, then visit developer.paypal.com to access API credentials."
        },
    ]

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
                    if (!this.paypalPaymentSettings.environment)
                        this.paypalPaymentSettings.environment = 'sandbox';
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
                    this.selectedTabIndex = 0;
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

    onTabChange(tab: MatTabChangeEvent) {
        if (tab.index === 0) {
            this.paypalPaymentSettings.environment = 'sandbox';
        }
        else if (tab.index === 1) {
            this.paypalPaymentSettings.environment = 'live';
        }
    }

    createConnectedAccount() {
        // if (this.isHost || !this.stripePaymentSettings.isHostAccountEnabled || (setting && setting.isConnectedAccountSetUpCompleted))
        //     return;

        // this.message.confirm('', this.l('Do you want to connect Stripe account ?'), (isConfirmed) => {
        //     if (isConfirmed) {
        //         this.startLoading();
        //         let method = setting ?
        //             this.tenantPaymentSettingsService.connectStripeAccount(setting.id) :
        //             this.tenantPaymentSettingsService.getConnectOAuthAuthorizeUrl();
        //         method.pipe(
        //             finalize(() => this.finishLoading())
        //         ).subscribe((url) => {
        //             window.location.href = url;
        //         });
        //     }
        // });
    }
}