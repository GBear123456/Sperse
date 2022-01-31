/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, ViewChild, ElementRef,
    OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

/** Third party imports */
import { Observable, forkJoin } from 'rxjs';
import { finalize, tap, first, map, delay } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppTimezoneScope, Country } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    ComboboxItemDto, CommonLookupServiceProxy, SettingScopes, HostSettingsEditDto, HostSettingsServiceProxy,
    PayPalSettings, TenantPaymentSettingsServiceProxy, ACHWorksSettings, RecurlyPaymentSettings,
    StripeSettings, YTelSettingsEditDto, EmailTemplateType
} from '@shared/service-proxies/service-proxies';
import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { AppConsts } from '@root/shared/AppConsts';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppService } from '@app/app.service';
import { EmailSmtpSettingsService } from '@shared/common/settings/email-smtp-settings.service';
import { DomHelper } from '@shared/helpers/DomHelper';

@Component({
    templateUrl: './host-settings.component.html',
    styleUrls: ['../../../shared/common/styles/checkbox-radio.less', './host-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantPaymentSettingsServiceProxy]
})
export class HostSettingsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('tabGroup') tabGroup: ElementRef;

    loading = false;
    hostSettings: HostSettingsEditDto;
    editions: ComboboxItemDto[] = undefined;
    testEmailAddress: string = undefined;
    showTimezoneSelection = abp.clock.provider.supportsMultipleTimezone;
    defaultTimezoneScope: SettingScopes = AppTimezoneScope.Application;
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
    tabIndex: Observable<number>;

    isTenantHosts: boolean = this.isGranted(AppPermissions.AdministrationTenantHosts);
    isAdminCustomizations: boolean = abp.features.isEnabled(AppFeatures.AdminCustomizations);

    constructor(
        injector: Injector,
        private route: ActivatedRoute,
        private hostSettingService: HostSettingsServiceProxy,
        private commonLookupService: CommonLookupServiceProxy,
        private tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy,
        private appSessionService: AppSessionService,
        private changeDetection: ChangeDetectorRef,
        private clipboardService: ClipboardService,
        private contactService: ContactsService,
        private appService: AppService,
        private emailSmtpSettingsService: EmailSmtpSettingsService,
        public dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    loadHostSettings(): void {
        forkJoin(
            this.hostSettingService.getAllSettings(),
            this.tenantPaymentSettingsService.getPayPalSettings(),
            this.tenantPaymentSettingsService.getACHWorksSettings(),
            this.tenantPaymentSettingsService.getStripeSettings(),
            this.tenantPaymentSettingsService.getRecurlyPaymentSettings(),
            this.hostSettingService.getYTelSettings()
        ).pipe(
            finalize(() => { this.changeDetection.detectChanges(); })
        ).subscribe(([allSettings, payPalSettings, achWorksSettings, stripeSettings, recurlySettings, yTelSettings]) => {
            this.hostSettings = allSettings;
            this.initialDefaultCountry = allSettings.general.defaultCountryCode;
            this.initialTimeZone = allSettings.general.timezone;
            this.usingDefaultTimeZone = allSettings.general.timezoneForComparison === this.setting.get('Abp.Timing.TimeZone');
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
        this.appService.isClientSearchDisabled = true;
        const self = this;
        self.init();
    }

    ngAfterViewInit() {
        this.tabIndex = this.route.queryParams.pipe(
            first(), delay(100), 
            map((params: Params) => {
                return (params['tab'] == 'smtp' ? 
                    DomHelper.getElementIndexByInnerText(
                        this.tabGroup.nativeElement.getElementsByClassName('mat-tab-label'), 
                        this.l('EmailSmtp')
                    ) : 0
                );
            })
        );        
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden(false);
    }

    sendTestEmail(): void {
        this.startLoading();
        let input = this.emailSmtpSettingsService.getSendTestEmailInput(this.testEmailAddress, this.hostSettings.email);
        this.emailSmtpSettingsService.sendTestEmail(input, this.finishLoading.bind(this));
    }

    saveAll(): void {
        this.startLoading();
        forkJoin(
            this.hostSettingService.updateAllSettings(this.hostSettings).pipe(tap(() => {
                this.appSessionService.checkSetDefaultCountry(this.hostSettings.general.defaultCountryCode);
            })),
            this.tenantPaymentSettingsService.updatePayPalSettings(this.payPalPaymentSettings),
            this.tenantPaymentSettingsService.updateACHWorksSettings(this.achWorksSettings),
            this.tenantPaymentSettingsService.updateStripeSettings(this.stripePaymentSettings),
            this.tenantPaymentSettingsService.updateRecurlyPaymentSettings(this.recurlySettings),
            this.hostSettingService.updateYTelSettings(this.yTelSettings)
        ).pipe(
            finalize(() => this.finishLoading())
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
