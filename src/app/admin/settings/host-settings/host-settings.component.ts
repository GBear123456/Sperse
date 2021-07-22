/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { forkJoin } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppTimezoneScope, Country } from '@shared/AppEnums';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    ComboboxItemDto, CommonLookupServiceProxy, SettingScopes, HostSettingsEditDto, HostSettingsServiceProxy, SendTestEmailInput, PayPalSettings,
    BaseCommercePaymentSettings, TenantPaymentSettingsServiceProxy, ACHWorksSettings, RecurlyPaymentSettings, YTelSettingsEditDto, EmailTemplateType, StripeSettings
} from '@shared/service-proxies/service-proxies';
import { AppPermissions } from '@shared/AppPermissions';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { AppConsts } from '@root/shared/AppConsts';
import { ContactsService } from '@app/crm/contacts/contacts.service';

@Component({
    templateUrl: './host-settings.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['../../../shared/common/styles/checkbox-radio.less', './host-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantPaymentSettingsServiceProxy]
})
export class HostSettingsComponent extends AppComponentBase implements OnInit, OnDestroy {

    loading = false;
    hostSettings: HostSettingsEditDto;
    editions: ComboboxItemDto[] = undefined;
    testEmailAddress: string = undefined;
    showTimezoneSelection = abp.clock.provider.supportsMultipleTimezone;
    defaultTimezoneScope: SettingScopes = AppTimezoneScope.Application;
    baseCommercePaymentSettings: BaseCommercePaymentSettings = new BaseCommercePaymentSettings();
    payPalPaymentSettings: PayPalSettings = new PayPalSettings();
    achWorksSettings: ACHWorksSettings = new ACHWorksSettings();
    stripePaymentSettings: StripeSettings = new StripeSettings();
    recurlySettings: RecurlyPaymentSettings = new RecurlyPaymentSettings();
    yTelSettings: YTelSettingsEditDto = new YTelSettingsEditDto();
    supportedCountries = Object.keys(Country).map(item => {
        return {
            key: Country[item],
            text: this.l(item)
        };
    });

    initialDefaultCountry: string;
    usingDefaultTimeZone = false;
    initialTimeZone: string;
    private rootComponent;
    masks = AppConsts.masks;
    headlineButtons: HeadlineButton[] = [
        {
            enabled: this.isGranted(AppPermissions.AdministrationLanguagesCreate),
            action: this.saveAll.bind(this),
            icon: 'la la la-floppy-o',
            label: this.l('SaveAll')
        }
    ];
    EmailTemplateType = EmailTemplateType;

    constructor(
        injector: Injector,
        private hostSettingService: HostSettingsServiceProxy,
        private commonLookupService: CommonLookupServiceProxy,
        private tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy,
        private appSessionService: AppSessionService,
        private changeDetection: ChangeDetectorRef,
        private clipboardService: ClipboardService,
        private contactService: ContactsService,
        public dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    loadHostSettings(): void {
        forkJoin(
            this.hostSettingService.getAllSettings(),
            this.tenantPaymentSettingsService.getBaseCommercePaymentSettings(),
            this.tenantPaymentSettingsService.getPayPalSettings(),
            this.tenantPaymentSettingsService.getACHWorksSettings(),
            this.tenantPaymentSettingsService.getStripeSettings(),
            this.tenantPaymentSettingsService.getRecurlyPaymentSettings(),
            this.hostSettingService.getYTelSettings()
        ).pipe(
            finalize(() => { this.changeDetection.detectChanges(); })
        ).subscribe(([allSettings, baseCommerceSettings, payPalSettings, achWorksSettings, stripeSettings, recurlySettings, yTelSettings]) => {
            this.hostSettings = allSettings;
            this.initialDefaultCountry = allSettings.general.defaultCountryCode;
            this.initialTimeZone = allSettings.general.timezone;
            this.usingDefaultTimeZone = allSettings.general.timezoneForComparison === this.setting.get('Abp.Timing.TimeZone');
            this.baseCommercePaymentSettings = baseCommerceSettings;
            this.payPalPaymentSettings = payPalSettings;
            this.achWorksSettings = achWorksSettings;
            this.stripePaymentSettings = stripeSettings;
            this.recurlySettings = recurlySettings;
            this.yTelSettings = yTelSettings;
        });
    }

    loadEditions(): void {
        const self = this;
        self.commonLookupService.getEditionsForCombobox(false).subscribe((result) => {
            self.editions = result.items;

            const notAssignedEdition = new ComboboxItemDto();
            notAssignedEdition.value = null;
            notAssignedEdition.displayText = self.l('NotAssigned');

            self.editions.unshift(notAssignedEdition);
        });
    }

    init(): void {
        const self = this;
        self.testEmailAddress = self.appSessionService.user.emailAddress;
        self.showTimezoneSelection = abp.clock.provider.supportsMultipleTimezone;
        self.loadHostSettings();
        self.loadEditions();
    }

    ngOnInit(): void {
        const self = this;
        self.init();
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden(false);
    }

    sendTestEmail(): void {
        const self = this;
        const input = new SendTestEmailInput();
        input.emailAddress = self.testEmailAddress;
        self.hostSettingService.sendTestEmail(input).subscribe(() => {
            self.notify.info(self.l('TestEmailSentSuccessfully'));
        });
    }

    saveAll(): void {
        forkJoin(
            this.hostSettingService.updateAllSettings(this.hostSettings).pipe(tap(() => {
                this.appSessionService.checkSetDefaultCountry(this.hostSettings.general.defaultCountryCode);
            })),
            this.tenantPaymentSettingsService.updateBaseCommercePaymentSettings(this.baseCommercePaymentSettings),
            this.tenantPaymentSettingsService.updatePayPalSettings(this.payPalPaymentSettings),
            this.tenantPaymentSettingsService.updateACHWorksSettings(this.achWorksSettings),
            this.tenantPaymentSettingsService.updateStripeSettings(this.stripePaymentSettings),
            this.tenantPaymentSettingsService.updateRecurlyPaymentSettings(this.recurlySettings),
            this.hostSettingService.updateYTelSettings(this.yTelSettings)
        ).subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));
            if (this.initialDefaultCountry !== this.hostSettings.general.defaultCountryCode) {
                this.message.info(this.l('DefaultCountrySettingChangedRefreshPageNotification')).done(function () {
                    window.location.reload();
                });
            }

            if (abp.clock.provider.supportsMultipleTimezone && this.usingDefaultTimeZone &&
                this.initialTimeZone !== this.hostSettings.general.timezone
            ) {
                this.message.info(this.l('TimeZoneSettingChangedRefreshPageNotification')).done(function () {
                    window.location.reload();
                });
            }
        });
    }

    getYtelInboundSMSUrl(): string {
        let key = this.yTelSettings.inboundSmsKey || '{inbound_sms_key}';
        return AppConsts.remoteServiceBaseUrl + `/api/YTel/ProcessInboundSms?tenantId=&key=${key}`;
    }

    getStripeWebhookUrl(): string {
        return AppConsts.remoteServiceBaseUrl + `/api/stripe/processWebhook`;
    }

    copyToClipboard(event) {
        this.clipboardService.copyFromContent(event.target.parentNode.innerText.trim());
        this.notify.info(this.l('SavedToClipboard'));
    }
}
