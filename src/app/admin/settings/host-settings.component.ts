import { AfterViewChecked, Component, Injector, OnInit, OnDestroy } from '@angular/core';
import { AppTimezoneScope } from '@shared/AppEnums';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    ComboboxItemDto, CommonLookupServiceProxy, DefaultTimezoneScope, HostSettingsEditDto, HostSettingsServiceProxy, SendTestEmailInput, PayPalSettings,
    BaseCommercePaymentSettings, TenantPaymentSettingsServiceProxy, ACHWorksSettings, RecurlyPaymentSettings
} from '@shared/service-proxies/service-proxies';
import { Observable, forkJoin } from 'rxjs';

@Component({
    templateUrl: './host-settings.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./host-settings.component.less'],
    providers: [TenantPaymentSettingsServiceProxy]
})
export class HostSettingsComponent extends AppComponentBase implements OnInit, OnDestroy, AfterViewChecked {

    loading = false;
    hostSettings: HostSettingsEditDto;
    editions: ComboboxItemDto[] = undefined;
    testEmailAddress: string = undefined;
    showTimezoneSelection = abp.clock.provider.supportsMultipleTimezone;
    defaultTimezoneScope: DefaultTimezoneScope = AppTimezoneScope.Application;
    baseCommercePaymentSettings: BaseCommercePaymentSettings = new BaseCommercePaymentSettings();
    payPalPaymentSettings: PayPalSettings = new PayPalSettings();
    achWorksSettings: ACHWorksSettings = new ACHWorksSettings();
    recurlySettings: RecurlyPaymentSettings = new RecurlyPaymentSettings();

    usingDefaultTimeZone = false;
    initialTimeZone: string = undefined;
    private rootComponent;

    constructor(
        injector: Injector,
        private _hostSettingService: HostSettingsServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy,
        private _tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy,
        private _appSessionService: AppSessionService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.pageHeaderFixed();
    }

    loadHostSettings(): void {
        forkJoin(
            this._hostSettingService.getAllSettings(),
            this._tenantPaymentSettingsService.getBaseCommercePaymentSettings(),
            this._tenantPaymentSettingsService.getPayPalSettings(),
            this._tenantPaymentSettingsService.getACHWorksSettings(),
            this._tenantPaymentSettingsService.getRecurlyPaymentSettings()
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
        self._commonLookupService.getEditionsForCombobox(false).subscribe((result) => {
            self.editions = result.items;

            const notAssignedEdition = new ComboboxItemDto();
            notAssignedEdition.value = null;
            notAssignedEdition.displayText = self.l('NotAssigned');

            self.editions.unshift(notAssignedEdition);
        });
    }

    init(): void {
        const self = this;
        self.testEmailAddress = self._appSessionService.user.emailAddress;
        self.showTimezoneSelection = abp.clock.provider.supportsMultipleTimezone;
        self.loadHostSettings();
        self.loadEditions();
    }

    ngOnInit(): void {
        const self = this;
        self.init();
    }

    ngAfterViewChecked(): void {
        //Temporary fix for: https://github.com/valor-software/ngx-bootstrap/issues/1508
        $('tabset ul.nav').addClass('m-tabs-line');
        $('tabset ul.nav li a.nav-link').addClass('m-tabs__link');
    }

    ngOnDestroy() {
        this.rootComponent.pageHeaderFixed(true);
    }

    sendTestEmail(): void {
        const self = this;
        const input = new SendTestEmailInput();
        input.emailAddress = self.testEmailAddress;
        self._hostSettingService.sendTestEmail(input).subscribe(result => {
            self.notify.info(self.l('TestEmailSentSuccessfully'));
        });
    }

    saveAll(): void {
        forkJoin(
            this._hostSettingService.updateAllSettings(this.hostSettings),
            this._tenantPaymentSettingsService.updateBaseCommercePaymentSettings(this.baseCommercePaymentSettings),
            this._tenantPaymentSettingsService.updatePayPalSettings(this.payPalPaymentSettings),
            this._tenantPaymentSettingsService.updateACHWorksSettings(this.achWorksSettings),
            this._tenantPaymentSettingsService.updateRecurlyPaymentSettings(this.recurlySettings)
        ).subscribe(result => {
            this.notify.info(this.l('SavedSuccessfully'));

            if (abp.clock.provider.supportsMultipleTimezone && this.usingDefaultTimeZone && this.initialTimeZone !== this.hostSettings.general.timezone) {
                this.message.info(this.l('TimeZoneSettingChangedRefreshPageNotification')).done(function () {
                    window.location.reload();
                });
            }
        });
    }
}
