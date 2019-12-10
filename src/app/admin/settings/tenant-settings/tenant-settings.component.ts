/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { IAjaxResponse } from '@abp/abpHttpInterceptor';
import { FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import { Observable, forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { TokenService } from '@abp/auth/token.service';
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope } from '@shared/AppEnums';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    SettingScopes,
    SendTestEmailInput,
    TenantSettingsEditDto,
    TenantSettingsServiceProxy,
    TenantCustomizationServiceProxy,
    IdcsSettings,
    BaseCommercePaymentSettings,
    PayPalSettings,
    TenantSettingsCreditReportServiceProxy,
    TenantPaymentSettingsServiceProxy,
    ACHWorksSettings,
    RecurlyPaymentSettings,
    EPCVIPOfferProviderSettings,
    TenantOfferProviderSettingsServiceProxy,
    TenantCustomizationInfoDto,
    EPCVIPMailerSettingsEditDto,
    EPCVIPServer,
    OngageSettingsEditDto,
    IAgeSettingsEditDto,
    YTelSettingsEditDto
} from '@shared/service-proxies/service-proxies';
import { FaviconService } from '@shared/common/favicon-service/favicon.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';

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
    @ViewChild('privacyInput') privacyInput: ElementRef;
    @ViewChild('tosInput') tosInput: ElementRef;
    @ViewChild('logoInput') logoInput: ElementRef;
    @ViewChild('cssInput') cssInput: ElementRef;
    @ViewChild('faviconInput') faviconInput: ElementRef;
    usingDefaultTimeZone = false;
    initialTimeZone: string = null;
    testEmailAddress: string = undefined;
    isMultiTenancyEnabled: boolean = this.multiTenancy.isEnabled;
    showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    activeTabIndex: number = (abp.clock.provider.supportsMultipleTimezone) ? 0 : 1;
    loading = false;
    settings: TenantSettingsEditDto = undefined;
    idcsSettings: IdcsSettings = new IdcsSettings();
    baseCommercePaymentSettings: BaseCommercePaymentSettings = new BaseCommercePaymentSettings();
    payPalPaymentSettings: PayPalSettings = new PayPalSettings();
    achWorksSettings: ACHWorksSettings = new ACHWorksSettings();
    recurlySettings: RecurlyPaymentSettings = new RecurlyPaymentSettings();
    isTenantHosts: boolean = this.permission.isGranted(AppPermissions.AdministrationTenantHosts);
    isAdminCustomizations: boolean = abp.features.isEnabled(AppFeatures.AdminCustomizations);
    isCreditReportFeatureEnabled: boolean = abp.features.isEnabled(AppFeatures.PFMCreditReport);
    isPFMApplicationsFeatureEnabled: boolean = abp.features.isEnabled(AppFeatures.PFM) && abp.features.isEnabled(AppFeatures.PFMApplications);
    epcvipSettings: EPCVIPOfferProviderSettings = new EPCVIPOfferProviderSettings();
    epcvipEmailSettings: EPCVIPMailerSettingsEditDto = new EPCVIPMailerSettingsEditDto();
    epcvipEmailServers: string[] = [];
    ongageSettings: OngageSettingsEditDto = new OngageSettingsEditDto();
    iageSettings: IAgeSettingsEditDto = new IAgeSettingsEditDto();
    yTelSettings: YTelSettingsEditDto = new YTelSettingsEditDto();
    logoUploader: FileUploader;
    faviconsUploader: FileUploader;
    customCssUploader: FileUploader;
    customToSUploader: FileUploader;
    customPrivacyPolicyUploader: FileUploader;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    siteUrlRegexPattern = AppConsts.regexPatterns.siteUrl;
    defaultTimezoneScope: SettingScopes = AppTimezoneScope.Tenant;

    masks = AppConsts.masks;

    private rootComponent;
    headlineButtons: HeadlineButton[] = [
        {
            enabled: true, // this.isGranted(AppPermissions.AdministrationLanguagesCreate),
            action: this.saveAll.bind(this),
            icon: 'la la la-floppy-o',
            label: this.l('SaveAll')
        }
    ];

    constructor(
        injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private tenantCustomizationService: TenantCustomizationServiceProxy,
        private tenantSettingsCreditReportService: TenantSettingsCreditReportServiceProxy,
        private tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy,
        private appSessionService: AppSessionService,
        private tokenService: TokenService,
        private tenantOfferProviderSettingsService: TenantOfferProviderSettingsServiceProxy,
        private faviconsService: FaviconService,
        private changeDetection: ChangeDetectorRef
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnInit(): void {
        this.testEmailAddress = this.appSessionService.user.emailAddress;
        this.getSettings();
        this.initUploaders();
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden(false);
    }

    getSettings(): void {
        this.loading = true;

        let requests: Observable<any>[] = [
                this.tenantSettingsService.getAllSettings(),
                this.tenantPaymentSettingsService.getBaseCommercePaymentSettings(),
                this.tenantPaymentSettingsService.getPayPalSettings(),
                this.tenantPaymentSettingsService.getACHWorksSettings(),
                this.tenantPaymentSettingsService.getRecurlyPaymentSettings(),
                this.isCreditReportFeatureEnabled ? this.tenantSettingsCreditReportService.getIdcsSettings() : of<IdcsSettings>(<any>null),
                this.isPFMApplicationsFeatureEnabled ? this.tenantOfferProviderSettingsService.getEPCVIPOfferProviderSettings() : of<EPCVIPOfferProviderSettings>(<any>null),
                this.isPFMApplicationsFeatureEnabled ? this.tenantSettingsService.getEPCVIPMailerSettings() : of<EPCVIPMailerSettingsEditDto>(<any>null),
                this.isPFMApplicationsFeatureEnabled ? this.tenantSettingsService.getOngageSettings() : of<OngageSettingsEditDto>(<any>null),
                this.isPFMApplicationsFeatureEnabled ? this.tenantSettingsService.getIAgeSettings() : of<IAgeSettingsEditDto>(<any>null),
                this.tenantSettingsService.getYTelSettings()
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
                    this.baseCommercePaymentSettings,
                    this.payPalPaymentSettings,
                    this.achWorksSettings,
                    this.recurlySettings,
                    this.idcsSettings,
                    this.epcvipSettings,
                    this.epcvipEmailSettings,
                    this.ongageSettings,
                    this.iageSettings,
                    this.yTelSettings
                ] = results;

                if (this.settings.general) {
                    this.initialTimeZone = this.settings.general.timezone;
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

        this.customCssUploader = this.createUploader(
            '/api/TenantCustomization/UploadCustomCss',
            result => {
                this.appSession.tenant.customCssId = result.id;
                $('#TenantCustomCss').remove();
                $('head').append('<link id="TenantCustomCss" href="' + AppConsts.remoteServiceBaseUrl + '/api/TenantCustomization/GetCustomCss/' + this.appSession.tenant.customCssId + '/' + this.appSession.tenant.id + '" rel="stylesheet"/>');
            }
        );

        this.faviconsUploader = this.createUploader(
            '/api/TenantCustomization/UploadFavicons',
            (result: TenantCustomizationInfoDto) => {
                if (result && result.faviconBaseUrl && result.favicons && result.favicons.length) {
                    this.appSession.tenant.tenantCustomizations = <any>{ ...this.appSession.tenant.tenantCustomizations, result };
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

    uploadCustomCss(): void {
        this.customCssUploader.uploadAll();
        this.resetInput(this.cssInput);
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
            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    clearCustomCss(): void {
        this.tenantCustomizationService.clearCustomCss().subscribe(() => {
            this.appSession.tenant.customCssId = null;
            $('#TenantCustomCss').remove();
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
            this.tenantSettingsService.updateAllSettings(this.settings),
            this.tenantPaymentSettingsService.updateBaseCommercePaymentSettings(this.baseCommercePaymentSettings),
            this.tenantPaymentSettingsService.updatePayPalSettings(this.payPalPaymentSettings),
            this.tenantPaymentSettingsService.updateACHWorksSettings(this.achWorksSettings),
            this.tenantPaymentSettingsService.updateRecurlyPaymentSettings(this.recurlySettings),
            this.tenantSettingsService.updateYTelSettings(this.yTelSettings)
        ];
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

        forkJoin(requests).subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));

            if (abp.clock.provider.supportsMultipleTimezone && this.usingDefaultTimeZone && this.initialTimeZone !== this.settings.general.timezone) {
                this.message.info(this.l('TimeZoneSettingChangedRefreshPageNotification')).done(() => {
                    window.location.reload();
                });
            }
        });
    }

    sendTestEmail(): void {
        const input = new SendTestEmailInput();
        input.emailAddress = this.testEmailAddress;
        this.tenantSettingsService.sendTestEmail(input).subscribe(() => {
            this.notify.info(this.l('TestEmailSentSuccessfully'));
        });
    }
}
