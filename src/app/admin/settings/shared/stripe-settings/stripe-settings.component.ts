/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    ImportStripeDataInput,
    StripeEntityType,
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
    tenantName = this.isHost ? AppConsts.defaultTenantName : this.appSession.tenantName;

    showImportSection = false;
    importInProgress = false;
    selectedImportType: StripeEntityType = 0;
    StripeEntityType = StripeEntityType;
    importTypes: any[] = Object.values(StripeEntityType).filter(x => typeof x === "number");

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
                    this.updateShowImportSection();
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

    afterSave() {
        this.updateShowImportSection();
        this.changeDetection.detectChanges();
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

    getImportTypeValue(importType: StripeEntityType): boolean {
        return (this.selectedImportType & importType) != 0;
    }

    getImportTypeDisabled(importType: StripeEntityType) {
        if (this.selectedImportType >= StripeEntityType.Payment && importType < StripeEntityType.Payment)
            return true;
        if (this.selectedImportType >= StripeEntityType.Subscription && importType < StripeEntityType.Subscription)
            return true;

        return false;
    }

    updateShowImportSection() {
        this.showImportSection = this.stripePaymentSettings.isEnabled &&
            (this.stripePaymentSettings.isConnectedAccountSetUpCompleted || !!this.stripePaymentSettings.apiKey);
    }

    onImportTypeChanged(event, importType: StripeEntityType) {
        if (event.value) {
            this.selectedImportType |= importType;
        }
        else {
            this.selectedImportType &= ~importType;
        }
        let baseTypes = StripeEntityType.Product | StripeEntityType.Coupon | StripeEntityType.Customer;
        if (importType == StripeEntityType.Payment) {
            this.selectedImportType |= baseTypes;
        }
        if (importType == StripeEntityType.Subscription) {
            this.selectedImportType |= (baseTypes | StripeEntityType.Payment);
        }
        this.changeDetection.detectChanges();
    }

    import() {
        if (this.importInProgress)
            return;

        this.importInProgress = true;
        this.startLoading();
        this.tenantPaymentSettingsService.importStripeData(new ImportStripeDataInput({ type: this.selectedImportType }))
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(() => {
                this.notify.info(this.l('Import started'));
                this.changeDetection.detectChanges();
            }, (e) => {
                this.importInProgress = false;
                this.changeDetection.detectChanges();
            });
    }
}