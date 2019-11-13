/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppTimezoneScope } from '@shared/AppEnums';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    ComboboxItemDto, CommonLookupServiceProxy, SettingScopes, HostSettingsEditDto, HostSettingsServiceProxy, SendTestEmailInput, PayPalSettings,
    BaseCommercePaymentSettings, TenantPaymentSettingsServiceProxy, ACHWorksSettings, RecurlyPaymentSettings
} from '@shared/service-proxies/service-proxies';
import { AppPermissions } from '@shared/AppPermissions';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';

@Component({
    templateUrl: './host-settings.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['../../shared/common/styles/checkbox-radio.less', './host-settings.component.less'],
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
    recurlySettings: RecurlyPaymentSettings = new RecurlyPaymentSettings();
    usingDefaultTimeZone = false;
    initialTimeZone: string = undefined;
    private rootComponent;
    headlineButtons: HeadlineButton[] = [
        {
            enabled: this.isGranted(AppPermissions.AdministrationLanguagesCreate),
            action: this.saveAll.bind(this),
            icon: 'la la la-floppy-o',
            label: this.l('SaveAll')
        }
    ];

    constructor(
        injector: Injector,
        private hostSettingService: HostSettingsServiceProxy,
        private commonLookupService: CommonLookupServiceProxy,
        private tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy,
        private appSessionService: AppSessionService,
        private changeDetection: ChangeDetectorRef
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
            this.tenantPaymentSettingsService.getRecurlyPaymentSettings()
        ).pipe(
            finalize(() => { this.changeDetection.detectChanges(); })
        ).subscribe(([allSettings, baseCommerceSettings, payPalSettings, achWorksSettings, recurlySettings]) => {
            this.hostSettings = allSettings;
            this.initialTimeZone = allSettings.general.timezone;
            this.usingDefaultTimeZone = allSettings.general.timezoneForComparison === this.setting.get('Abp.Timing.TimeZone');
            this.baseCommercePaymentSettings = baseCommerceSettings;
            this.payPalPaymentSettings = payPalSettings;
            this.achWorksSettings = achWorksSettings;
            this.recurlySettings = recurlySettings;
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
            this.hostSettingService.updateAllSettings(this.hostSettings),
            this.tenantPaymentSettingsService.updateBaseCommercePaymentSettings(this.baseCommercePaymentSettings),
            this.tenantPaymentSettingsService.updatePayPalSettings(this.payPalPaymentSettings),
            this.tenantPaymentSettingsService.updateACHWorksSettings(this.achWorksSettings),
            this.tenantPaymentSettingsService.updateRecurlyPaymentSettings(this.recurlySettings)
        ).subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));

            if (abp.clock.provider.supportsMultipleTimezone && this.usingDefaultTimeZone && this.initialTimeZone !== this.hostSettings.general.timezone) {
                this.message.info(this.l('TimeZoneSettingChangedRefreshPageNotification')).done(function () {
                    window.location.reload();
                });
            }
        });
    }
}
