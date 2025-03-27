/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    GetStripeSettingsDto,
    ImportStripeDataInput,
    InvoicePaymentMethod,
    StripeImportType,
    StripeSettingsDto, TenantPaymentSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@root/shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { SettingsComponentBase } from '../settings-base.component';
import { AppPermissions } from '../../../../../shared/AppPermissions';
import { Blocks, House, PictureInPicture, Users } from 'lucide-angular';

@Component({
    selector: 'razorpay-settings',
    templateUrl: './razorpay-settings.component.html',
    styleUrls: ['./razorpay-settings.component.less', './../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantPaymentSettingsServiceProxy]
})
export class RazorPaySettingsComponent extends SettingsComponentBase {
    readonly HouseIcon = House;
    readonly PeopleIcon = Users;
    readonly BlocksIcon = Blocks;
    readonly MaximizeIcon = PictureInPicture

    isPaymentsEnabled: boolean = abp.features.isEnabled(AppFeatures.CRMPayments);
    stripePaymentSettings: GetStripeSettingsDto = new GetStripeSettingsDto();

    tenantName = this.appSession.tenantName || AppConsts.defaultTenantName;

    apiKeySettings: StripeSettingsDto[];
    connectedSettings: StripeSettingsDto[];

    StripeImportType = StripeImportType;
    importTypes: any[] = Object.values(StripeImportType).filter(x => typeof x === "number");

    constructor(
        _injector: Injector,
        private tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.loadSettings();
        this.subscribeToEvent('abp.notifications.received', this.onImportFinished.bind(this));
    }

    loadSettings() {
        this.startLoading();
        if (this.isPaymentsEnabled) {
            this.tenantPaymentSettingsService.getAllStripeSettings()
                .pipe(
                    finalize(() => this.finishLoading())
                )
                .subscribe(res => {
                    this.stripePaymentSettings = res;
                    this.stripePaymentSettings.stripeAccountSettings.forEach(v => this.setPaymentMethods(v));

                    this.apiKeySettings = res.stripeAccountSettings.filter(v => !!v.apiKey && !v.connectedAccountId).sort((a, b) => a.isActive || a.id > b.id ? -1 : 1);
                    this.connectedSettings = res.stripeAccountSettings.filter(v => !!v.connectedAccountId).sort((a, b) => a.isActive || a.id > b.id ? -1 : 1);

                    this.updateShowImportSection();
                    this.changeDetection.detectChanges();
                })
        }
    }

    addApiKeySettings() {
        let newItem = new StripeSettingsDto();
        newItem.ignoreExternalConnectedAccounts = false;
        newItem.ignoreExternalWebhooks = false;
        newItem.displayName = 'New API Key';
        this.apiKeySettings.push(newItem);

        this.changeDetection.detectChanges();
    }

    setIsActive(setting: StripeSettingsDto) {
        this.message.confirm(`'${setting.displayName}' will be set as active and affect all future payments, which will use the new configuration.`, null, (isConfirmed) => {
            if (isConfirmed) {
                this.apiKeySettings.concat(this.connectedSettings).forEach(v => v.isActive = false);
                setting.isActive = true;
                this.changeDetection.detectChanges();
            }
        });
    }

    delete(setting: StripeSettingsDto) {
        this.message.confirm(`'${setting.displayName}' will be deleted.`, null, (isConfirmed) => {
            if (isConfirmed) {
                if (!setting.id) {
                    this.loadSettings();
                    return;
                }

                this.startLoading();
                this.tenantPaymentSettingsService.deleteStripeAccount(setting.id).pipe(
                    finalize(() => this.finishLoading())
                ).subscribe(() => {
                    this.notify.info(this.l('SuccessfullyDeleted'));
                    this.loadSettings();
                });
            }
        });
    }

    createConnectedAccount(setting: StripeSettingsDto) {
        if (this.isHost || !this.stripePaymentSettings.isHostAccountEnabled || (setting && setting.isConnectedAccountSetUpCompleted))
            return;

        this.message.confirm('', this.l('Do you want to connect Stripe account ?'), (isConfirmed) => {
            if (isConfirmed) {
                this.startLoading();
                let method = setting ?
                    this.tenantPaymentSettingsService.connectStripeAccount(setting.id) :
                    this.tenantPaymentSettingsService.getConnectOAuthAuthorizeUrl();
                method.pipe(
                    finalize(() => this.finishLoading())
                ).subscribe((url) => {
                    window.location.href = url;
                });
            }
        });
    }

    createWebhook(setting: StripeSettingsDto, isConnected) {
        if (!setting.id) {
            this.message.info('Please save the settings before creating webhooks.');
            return;
        }

        this.startLoading();
        this.tenantPaymentSettingsService.createStripeWebhook(setting.id, isConnected)
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(() => {
                this.notify.info(this.l('SuccessfullyGenerated'));
                this.loadSettings();
            })
    }

    isValid(): boolean {
        if (this.apiKeySettings.concat(this.connectedSettings).some(v => !v.displayName)) {
            this.notify.warn(this.l('RequiredField', 'Display Name'));
            return false;
        }
        if (this.apiKeySettings.some(v => !v.apiKey)) {
            this.notify.warn(this.l('RequiredField', 'Secret Key'));
            return false;
        }
        if (this.apiKeySettings.some(v => !v.publishableKey)) {
            this.notify.warn(this.l('RequiredField', 'Publishable Key'));
            return false;
        }

        return super.isValid();
    }

    getSaveObs(): Observable<any> {
        return this.tenantPaymentSettingsService.updateStripeSettings(this.stripePaymentSettings.isEnabled, this.apiKeySettings.concat(this.connectedSettings));
    }

    afterSave() {
        this.loadSettings();
        this.changeDetection.detectChanges();
    }

    getStripeOAuthConnectRedirectUrl(): string {
        return AppConsts.remoteServiceBaseUrl + `/stripeConnectAccount/oauth`;
    }

    showImportType(importType: StripeImportType) { //TODO: calculate all on the beginning
        if (importType == StripeImportType.Payment)
            return this.feature.isEnabled(AppFeatures.CRMInvoicesManagement) && this.permission.isGranted(AppPermissions.CRMOrdersInvoicesManage);
        if (importType == StripeImportType.Subscription)
            return this.feature.isEnabled(AppFeatures.CRMInvoicesManagement) && this.permission.isGranted(AppPermissions.CRMOrdersInvoicesManage) &&
                this.feature.isEnabled(AppFeatures.CRMSubscriptionManagementSystem) && this.permission.isGranted(AppPermissions.CRMOrdersManage);
        return true;
    }

    getImportTypeValue(settingDto, importType: StripeImportType): boolean {
        return (settingDto.selectedImportType & importType) != 0;
    }

    getImportTypeDisabled(settingDto, importType: StripeImportType) {
        if (settingDto.selectedImportType >= StripeImportType.Payment && importType < StripeImportType.Payment)
            return true;
        if (settingDto.selectedImportType >= StripeImportType.Subscription && importType < StripeImportType.Subscription)
            return true;

        return false;
    }

    setPaymentMethods(settingsDto: StripeSettingsDto) {
        let availablePaymentMethods = '';

        let separator = '';
        if ((settingsDto.unsupportedPaymentMethods & InvoicePaymentMethod.BankCard) != InvoicePaymentMethod.BankCard) {
            availablePaymentMethods += 'Bank Card';
            separator = ', ';
        }
        if ((settingsDto.unsupportedPaymentMethods & InvoicePaymentMethod.ACH) != InvoicePaymentMethod.ACH) {
            availablePaymentMethods += separator + 'ACH';
        }

        settingsDto['availablePaymentMethods'] = availablePaymentMethods;
    }

    updatePaymentMethods(settingDto: StripeSettingsDto) {
        if (settingDto['paymentMethodUpdateInProgress'])
            return;

        settingDto['paymentMethodUpdateInProgress'] = true;
        this.changeDetection.detectChanges();
        this.tenantPaymentSettingsService.updateConnectedAccountPaymentMethods(settingDto.id)
            .pipe(
                finalize(() => {
                    settingDto['paymentMethodUpdateInProgress'] = false;
                    this.changeDetection.detectChanges();
                })
            )
            .subscribe(result => {
                settingDto.unsupportedPaymentMethods = result;
                this.setPaymentMethods(settingDto);
                this.notify.info(this.l('Payment methods have been refreshed.'));
            })
    }

    updateShowImportSection() {
        this.apiKeySettings.concat(this.connectedSettings).forEach(v => {
            v['showImportSection'] = this.stripePaymentSettings.isEnabled && (v.isConnectedAccountSetUpCompleted || !!v.apiKey);
            v['selectedImportType'] = 0;
        });
    }

    onImportTypeChanged(event, settingDto, importType: StripeImportType) {
        if (event.value) {
            settingDto.selectedImportType |= importType;
        }
        else {
            settingDto.selectedImportType &= ~importType;
        }
        let baseTypes = StripeImportType.Product | StripeImportType.Coupon | StripeImportType.Customer;
        if (importType == StripeImportType.Payment) {
            settingDto.selectedImportType |= baseTypes;
        }
        if (importType == StripeImportType.Subscription) {
            settingDto.selectedImportType |= (baseTypes | StripeImportType.Payment);
        }
        this.changeDetection.detectChanges();
    }

    import(settingDto: StripeSettingsDto) {
        if (settingDto.hasRunningImport || !settingDto['selectedImportType'])
            return;

        settingDto.hasRunningImport = true;
        this.startLoading();
        this.tenantPaymentSettingsService.importStripeData(new ImportStripeDataInput({
            settingsId: settingDto.id,
            type: settingDto['selectedImportType']
        })).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.notify.info(this.l('Stripe Import Started'));
            this.changeDetection.detectChanges();
        }, (e) => {
            this.onImportFinished();
        });
    }

    onImportFinished(userNotification = null) {
        if (userNotification != null && userNotification.notification.notificationName != 'CRM.StripeImportFinished')
            return;

        let settingDto = this.apiKeySettings.concat(this.connectedSettings).find(v => v.id == userNotification.notification.entityId);
        if (settingDto)
            settingDto.hasRunningImport = false;
        this.changeDetection.detectChanges();
    }

    enableAutomaticTaxation(settingDto: StripeSettingsDto) {
        this.startLoading();
        this.tenantPaymentSettingsService.changeIsStripeTaxationEnabledSettings(settingDto.id, !settingDto.isTaxationEnabled)
        .pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            settingDto.isTaxationEnabled = !settingDto.isTaxationEnabled;
            this.notify.info((this.l('Stripe Taxation ') + (settingDto.isTaxationEnabled ? 'Enabled' : 'Disabled')));
            this.changeDetection.detectChanges();
        });
    }

    copyToClipboard(value: string) {
        this.clipboardService.copyFromContent(value.trim());
        this.notify.info(this.l('SavedToClipboard'));
    }
}