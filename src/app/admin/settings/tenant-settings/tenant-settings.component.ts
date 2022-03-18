/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { ClipboardService } from 'ngx-clipboard';

/** Third party imports */
import { IAjaxResponse } from '@abp/abpHttpInterceptor';
import { FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import { Observable, forkJoin, of } from 'rxjs';
import { finalize, tap, first, map, delay } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import kebabCase from 'lodash/kebabCase';

/** Application imports */
import { TokenService } from '@abp/auth/token.service';
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope, Country } from '@shared/AppEnums';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    SettingScopes,
    TenantSettingsEditDto,
    TenantSettingsServiceProxy,
    TenantCustomizationServiceProxy,
    MemberPortalSettingsDto,
    IdcsSettings,
    TenantSettingsCreditReportServiceProxy,
    TenantPaymentSettingsServiceProxy,
    EPCVIPOfferProviderSettings,
    TenantOfferProviderSettingsServiceProxy,
    TenantCustomizationInfoDto,
    EPCVIPMailerSettingsEditDto,
    EPCVIPServer,
    OngageSettingsEditDto,
    IAgeSettingsEditDto,
    SendGridSettingsDto,
    YTelSettingsEditDto,
    LayoutType,
    RapidSettingsDto,
    EmailTemplateType,
    StripeSettings,
    CustomCssType
} from '@shared/service-proxies/service-proxies';
import { FaviconService } from '@shared/common/favicon-service/favicon.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppService } from '@app/app.service';
import { EmailSmtpSettingsService } from '@shared/common/settings/email-smtp-settings.service';
import { DomHelper } from '@shared/helpers/DomHelper';

@Component({
    templateUrl: './tenant-settings.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['../../../shared/common/styles/checkbox-radio.less', './tenant-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        TenantSettingsCreditReportServiceProxy,
        TenantPaymentSettingsServiceProxy,
        TenantOfferProviderSettingsServiceProxy
    ]
})
export class TenantSettingsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild('tabGroup', { static: false }) tabGroup: ElementRef;
    @ViewChild('privacyInput', { static: false }) privacyInput: ElementRef;
    @ViewChild('tosInput', { static: false }) tosInput: ElementRef;
    @ViewChild('logoInput', { static: false }) logoInput: ElementRef;
    @ViewChild('faviconInput', { static: false }) faviconInput: ElementRef;
    usingDefaultTimeZone = false;
    initialTimeZone: string;
    initialDefaultCountry: string;
    testEmailAddress: string = undefined;
    isMultiTenancyEnabled: boolean = this.multiTenancy.isEnabled;
    showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    loading = false;
    settings: TenantSettingsEditDto = undefined;
    memberPortalSettings: MemberPortalSettingsDto = new MemberPortalSettingsDto();
    idcsSettings: IdcsSettings = new IdcsSettings();
    stripePaymentSettings: StripeSettings = new StripeSettings();
    isTenantHosts: boolean = this.permission.isGranted(AppPermissions.AdministrationTenantHosts);
    isAdminCustomizations: boolean = abp.features.isEnabled(AppFeatures.AdminCustomizations);
    isCreditReportFeatureEnabled: boolean = abp.features.isEnabled(AppFeatures.PFMCreditReport);
    isPFMApplicationsFeatureEnabled: boolean = abp.features.isEnabled(AppFeatures.PFM) && abp.features.isEnabled(AppFeatures.PFMApplications);
    isRapidTenantLayout: boolean = this.appSession.tenant && this.appSession.tenant.customLayoutType == LayoutType.Rapid;
    isPerformancePartner: boolean = this.appSession.isPerformancePartnerTenant;
    epcvipSettings: EPCVIPOfferProviderSettings = new EPCVIPOfferProviderSettings();
    epcvipEmailSettings: EPCVIPMailerSettingsEditDto = new EPCVIPMailerSettingsEditDto();
    epcvipEmailServers: string[] = [];
    ongageSettings: OngageSettingsEditDto = new OngageSettingsEditDto();
    iageSettings: IAgeSettingsEditDto = new IAgeSettingsEditDto();
    sendGridSettings: SendGridSettingsDto = new SendGridSettingsDto();
    yTelSettings: YTelSettingsEditDto = new YTelSettingsEditDto();
    rapidSettings: RapidSettingsDto = new RapidSettingsDto();
    logoUploader: FileUploader;
    faviconsUploader: FileUploader;
    customCssUploaders: { [cssType: string]: FileUploader } = {};
    customToSUploader: FileUploader;
    customPrivacyPolicyUploader: FileUploader;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    urlRegexPattern = AppConsts.regexPatterns.url;
    siteUrlRegexPattern = AppConsts.regexPatterns.siteUrl;
    defaultTimezoneScope: SettingScopes = AppTimezoneScope.Tenant;
    masks = AppConsts.masks;
    private rootComponent;
    supportedCountries = Object.keys(Country).map(item => {
        return {
            key: Country[item],
            text: this.l(item)
        };
    });
    headlineButtons: HeadlineButton[] = [
        {
            enabled: true, // this.isGranted(AppPermissions.AdministrationLanguagesCreate),
            action: this.saveAll.bind(this),
            icon: 'la la la-floppy-o',
            label: this.l('SaveAll')
        }
    ];
    EmailTemplateType = EmailTemplateType;
    CustomCssType = CustomCssType;
    tabIndex: Observable<number>;

    constructor(
        injector: Injector,
        private route: ActivatedRoute,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private tenantCustomizationService: TenantCustomizationServiceProxy,
        private tenantSettingsCreditReportService: TenantSettingsCreditReportServiceProxy,
        private tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy,
        private appSessionService: AppSessionService,
        private tokenService: TokenService,
        private tenantOfferProviderSettingsService: TenantOfferProviderSettingsServiceProxy,
        private faviconsService: FaviconService,
        private clipboardService: ClipboardService,
        private contactService: ContactsService,
        private appService: AppService,
        private emailSmtpSettingsService: EmailSmtpSettingsService,
        public changeDetection: ChangeDetectorRef,
        public dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnInit(): void {
        this.appService.isClientSearchDisabled = true;
        this.testEmailAddress = this.appSessionService.user.emailAddress;
        this.getSettings();
        this.initUploaders();
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

    getSettings(): void {
        this.loading = true;

        let requests: Observable<any>[] = [
            this.tenantSettingsService.getAllSettings(),
            this.isAdminCustomizations ? this.tenantSettingsService.getMemberPortalSettings() : of<MemberPortalSettingsDto>(<any>null),
            this.tenantPaymentSettingsService.getStripeSettings(),
            this.isCreditReportFeatureEnabled ? this.tenantSettingsCreditReportService.getIdcsSettings() : of<IdcsSettings>(<any>null),
            this.isPFMApplicationsFeatureEnabled ? this.tenantOfferProviderSettingsService.getEPCVIPOfferProviderSettings() : of<EPCVIPOfferProviderSettings>(<any>null),
            this.isPFMApplicationsFeatureEnabled ? this.tenantSettingsService.getEPCVIPMailerSettings() : of<EPCVIPMailerSettingsEditDto>(<any>null),
            this.isPFMApplicationsFeatureEnabled ? this.tenantSettingsService.getOngageSettings() : of<OngageSettingsEditDto>(<any>null),
            this.isPFMApplicationsFeatureEnabled ? this.tenantSettingsService.getIAgeSettings() : of<IAgeSettingsEditDto>(<any>null),
            this.tenantSettingsService.getSendGridSettings(),
            this.tenantSettingsService.getYTelSettings(),
            this.isRapidTenantLayout ? this.tenantSettingsService.getRapidSettings() : of<RapidSettingsDto>(<any>null)
        ];
        if (this.isPFMApplicationsFeatureEnabled) {
            this.epcvipEmailServers = Object.keys(EPCVIPServer);
        }

        forkJoin(requests)
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.changeDetection.detectChanges();
                })
            ).subscribe((results) => {
                [
                    this.settings,
                    this.memberPortalSettings,
                    this.stripePaymentSettings,
                    this.idcsSettings,
                    this.epcvipSettings,
                    this.epcvipEmailSettings,
                    this.ongageSettings,
                    this.iageSettings,
                    this.sendGridSettings,
                    this.yTelSettings,
                    this.rapidSettings
                ] = results;

                if (this.settings.general) {
                    this.initialTimeZone = this.settings.general.timezone;
                    this.initialDefaultCountry = this.settings.general.defaultCountryCode;
                    this.usingDefaultTimeZone = this.settings.general.timezoneForComparison === abp.setting.values['Abp.Timing.TimeZone'];
                }
            });
    }

    initUploaders(): void {
        this.logoUploader = this.createUploader(
            '/api/TenantCustomization/UploadLogo',
            result => {
                this.appSessionService.tenant.logoFileType = result.fileType;
                this.appSessionService.tenant.logoId = result.id;
            }
        );

        for (var type in CustomCssType) {
            let cssType = type;
            let uploader = this.createUploader(
                `/api/TenantCustomization/UploadCustomCss?cssType=${cssType}`,
                result => {
                    this.setCustomCssTenantProperty(cssType as CustomCssType, result.id);
                    if (cssType == CustomCssType.Platform) {
                        let linkId = `${cssType}CustomCss`;
                        $(`#${linkId}`).remove();
                        $('head').append(`<link id="${linkId}" href="` + AppConsts.remoteServiceBaseUrl + '/api/TenantCustomization/GetCustomCss/' + result.id + '/' + this.appSession.tenant.id + '" rel="stylesheet"/>');
                    }
                    this.changeDetection.detectChanges();
                }
            );
            this.customCssUploaders[type] = uploader;
        }

        this.faviconsUploader = this.createUploader(
            '/api/TenantCustomization/UploadFavicons',
            (result: TenantCustomizationInfoDto) => {
                if (result && result.faviconBaseUrl && result.favicons && result.favicons.length) {
                    this.appSession.tenant.tenantCustomizations = <any>{ ...this.appSession.tenant.tenantCustomizations, ...result };
                    this.faviconsService.updateFavicons(this.appSession.tenant.tenantCustomizations.favicons, this.appSession.tenant.tenantCustomizations.faviconBaseUrl);
                }
            }
        );

        this.customToSUploader = this.createUploader(
            '/api/TenantCustomization/UploadCustomToSDocument',
            result => {
                this.appSession.tenant.customToSDocumentId = result.id;
            }
        );

        this.customPrivacyPolicyUploader = this.createUploader(
            '/api/TenantCustomization/UploadCustomPrivacyPolicyDocument',
            result => {
                this.appSession.tenant.customPrivacyPolicyDocumentId = result.id;
            }
        );
    }

    setCustomCssTenantProperty(cssType: CustomCssType, value: string) {
        switch (cssType) {
            case CustomCssType.Platform:
                this.appSession.tenant.customCssId = value;
                break;
            case CustomCssType.Login:
                this.appSession.tenant.loginCustomCssId = value;
                break;
            case CustomCssType.Portal:
                this.appSession.tenant.portalCustomCssId = value;
                break;
        }
    }

    resetInput(input: ElementRef) {
        input.nativeElement.value = null;
    }

    createUploader(url: string, success?: (result: any) => void): FileUploader {
        const uploader = new FileUploader({ url: AppConsts.remoteServiceBaseUrl + url });

        uploader.onAfterAddingFile = (file) => {
            file.withCredentials = false;
        };

        uploader.onSuccessItem = (item, response) => {
            const ajaxResponse = <IAjaxResponse>JSON.parse(response);
            if (ajaxResponse.success) {
                this.notify.info(this.l('SavedSuccessfully'));
                if (success) {
                    success(ajaxResponse.result);
                }
            } else {
                this.message.error(ajaxResponse.error.message);
            }
            this.changeDetection.detectChanges();
        };
        const uploaderOptions: FileUploaderOptions = {};
        uploaderOptions.authToken = 'Bearer ' + this.tokenService.getToken();
        uploaderOptions.removeAfterUpload = true;
        uploader.setOptions(uploaderOptions);
        return uploader;
    }

    uploadLogo(): void {
        this.logoUploader.uploadAll();
        this.resetInput(this.logoInput);
    }

    uploadFavicons(): void {
        this.faviconsUploader.uploadAll();
        this.resetInput(this.faviconInput);
    }

    uploadCustomCss(cssType: CustomCssType, input): void {
        this.customCssUploaders[cssType].uploadAll();
        input.value = null;
    }

    uploadCustomPrivacyPolicy(): void {
        this.customPrivacyPolicyUploader.uploadAll();
        this.resetInput(this.privacyInput);
    }

    uploadCustomToS(): void {
        this.customToSUploader.uploadAll();
        this.resetInput(this.tosInput);
    }

    clearLogo(): void {
        this.tenantCustomizationService.clearLogo().subscribe(() => {
            this.appSessionService.tenant.logoFileType = null;
            this.appSessionService.tenant.logoId = null;
            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    clearFavicons(): void {
        this.tenantCustomizationService.clearFavicons().subscribe(() => {
            this.faviconsService.resetFavicons();
            this.appSession.tenant.tenantCustomizations.favicons = [];
            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    clearCustomCss(cssType: CustomCssType): void {
        this.tenantCustomizationService.clearCustomCss(cssType).subscribe(() => {
            this.setCustomCssTenantProperty(cssType, null);
            if (cssType == CustomCssType.Platform) {
                $(`#${cssType}CustomCss`).remove();
            }
            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    clearCustomPrivacyPolicy(): void {
        this.tenantCustomizationService.clearCustomPrivacyPolicyDocument().subscribe(() => {
            this.appSession.tenant.customPrivacyPolicyDocumentId = null;
            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    clearCustomToS(): void {
        this.tenantCustomizationService.clearCustomToSDocument().subscribe(() => {
            this.appSession.tenant.customToSDocumentId = null;
            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    saveAll(): void {
        let requests: Observable<any>[] = [
            this.tenantSettingsService.updateAllSettings(this.settings).pipe(tap(() => {
                this.appSessionService.checkSetDefaultCountry(this.settings.general.defaultCountryCode);
            })),
            this.tenantPaymentSettingsService.updateStripeSettings(this.stripePaymentSettings),
            this.tenantSettingsService.updateSendGridSettings(this.sendGridSettings),
            this.tenantSettingsService.updateYTelSettings(this.yTelSettings)
        ];
        if (this.isAdminCustomizations) {
            if (!this.memberPortalSettings.url)
                this.memberPortalSettings.url = undefined;
            requests.push(this.tenantSettingsService.updateMemberPortalSettings(this.memberPortalSettings));
        }
        if (this.isCreditReportFeatureEnabled)
            requests.push(this.tenantSettingsCreditReportService.updateIdcsSettings(this.idcsSettings));
        if (this.isPFMApplicationsFeatureEnabled)
            requests.push(this.tenantOfferProviderSettingsService.updateEPCVIPOfferProviderSettings(this.epcvipSettings));
        if (this.isPFMApplicationsFeatureEnabled)
            requests.push(this.tenantSettingsService.updateEPCVIPMailerSettings(this.epcvipEmailSettings));
        if (this.isPFMApplicationsFeatureEnabled)
            requests.push(this.tenantSettingsService.updateOngageSettings(this.ongageSettings));
        if (this.isPFMApplicationsFeatureEnabled)
            requests.push(this.tenantSettingsService.updateIAgeSettings(this.iageSettings));
        if (this.isRapidTenantLayout)
            requests.push(this.tenantSettingsService.updateRapidSettings(this.rapidSettings));

        this.startLoading();
        forkJoin(requests).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));
            if (this.initialDefaultCountry !== this.settings.general.defaultCountryCode) {
                this.message.info(this.l('DefaultCountrySettingChangedRefreshPageNotification')).done(() => {
                    window.location.reload();
                });
            }
            if (abp.clock.provider.supportsMultipleTimezone && this.usingDefaultTimeZone && this.initialTimeZone !== this.settings.general.timezone) {
                this.message.info(this.l('TimeZoneSettingChangedRefreshPageNotification')).done(() => {
                    window.location.reload();
                });
            }
        });
    }

    sendTestEmail(): void {
        this.startLoading();
        let input = this.emailSmtpSettingsService.getSendTestEmailInput(this.testEmailAddress, this.settings.email);
        this.emailSmtpSettingsService.sendTestEmail(input, this.finishLoading.bind(this));
    }

    getSendGridWebhookUrl(): string {
        let key = this.sendGridSettings.webhookKey || '{webhook_key}';
        return AppConsts.remoteServiceBaseUrl + `/api/SendGrid/ProcessWebHook?key=${key}`;
    }

    getYtelInboundSMSUrl(): string {
        let key = this.yTelSettings.inboundSmsKey || '{inbound_sms_key}';
        return AppConsts.remoteServiceBaseUrl + `/api/YTel/ProcessInboundSms?tenantId=${this.appSessionService.tenantId}&key=${key}`;
    }

    getStripeWebhookUrl(): string {
        return AppConsts.remoteServiceBaseUrl + `/api/stripe/processWebhook?tenantId=${this.appSessionService.tenantId}`;
    }

    copyToClipboard(event) {
        this.clipboardService.copyFromContent(event.target.parentNode.innerText.trim());
        this.notify.info(this.l('SavedToClipboard'));
    }

    getCustomPlatformStylePath() {
        let tenant = this.appSession.tenant,
            basePath = 'assets/common/styles/custom/';
        if (tenant && tenant.customLayoutType && tenant.customLayoutType != LayoutType.Default)
            return basePath + kebabCase(tenant.customLayoutType) + '/style.css'
        else
            return basePath + 'platform-custom-style.css';
    }

    onPhoneNumberChange(phone, elm) {
        this.settings.general.publicPhone = phone == elm.getCountryCode() ? undefined : phone;
    }
}
