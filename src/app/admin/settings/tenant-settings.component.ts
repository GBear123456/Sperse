/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { IAjaxResponse } from '@abp/abpHttpInterceptor';
import { FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import { Observable, forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { TokenService } from '@abp/auth/token.service';
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope, ModuleType } from '@shared/AppEnums';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    DefaultTimezoneScope,
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
    EPCVIPMailerSettingsEditDtoServer,

    OngageSettingsEditDto,
    IAgeSettingsEditDto,
    
} from '@shared/service-proxies/service-proxies';
import { FaviconService } from '@shared/common/favicon-service/favicon.service';

@Component({
    templateUrl: './tenant-settings.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['../../shared/_checkbox-radio.less', './tenant-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        TenantSettingsCreditReportServiceProxy,
        TenantPaymentSettingsServiceProxy,
        TenantOfferProviderSettingsServiceProxy
    ]
})
export class TenantSettingsComponent extends AppComponentBase implements OnInit, OnDestroy {

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
    isCreditReportFeatureEnabled: boolean = abp.features.isEnabled('PFM.CreditReport');
    isPFMApplicationsFeatureEnabled: boolean = abp.features.isEnabled('PFM') && abp.features.isEnabled('PFM.Applications');
    epcvipSettings: EPCVIPOfferProviderSettings = new EPCVIPOfferProviderSettings();
    moduleTypes: string[] = [];

    epcvipEmailSettings: EPCVIPMailerSettingsEditDto = new EPCVIPMailerSettingsEditDto();
    epcvipEmailServers: string[] = [];

    ongageSettings: OngageSettingsEditDto = new OngageSettingsEditDto();
    iageSettings: IAgeSettingsEditDto = new IAgeSettingsEditDto();

    logoUploader: FileUploader;
    faviconsUploader: FileUploader;
    customCssUploader: FileUploader;
    customToSUploader: FileUploader;
    customPrivacyPolicyUploader: FileUploader;

    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    siteUrlRegexPattern = AppConsts.regexPatterns.siteUrl;

    defaultTimezoneScope: DefaultTimezoneScope = AppTimezoneScope.Tenant;

    private rootComponent;
    public headlineConfig = {
        names: [this.l('Settings')],
        icon: '',
        buttons: [
            {
                enabled: true,//this.isGranted('Pages.Administration.Languages.Create'),
                action: this.saveAll.bind(this),
                icon: 'la la la-floppy-o',
                lable: this.l('SaveAll')
            }
        ]
    };

    constructor(
        injector: Injector,
        private _tenantSettingsService: TenantSettingsServiceProxy,
        private _tenantCustomizationService: TenantCustomizationServiceProxy,
        private _tenantSettingsCreditReportService: TenantSettingsCreditReportServiceProxy,
        private _tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy,
        private _appSessionService: AppSessionService,
        private _tokenService: TokenService,
        private _tenantOfferProviderSettingsService: TenantOfferProviderSettingsServiceProxy,
        private _faviconsService: FaviconService,
        private _changeDetection: ChangeDetectorRef
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnInit(): void {
        this.testEmailAddress = this._appSessionService.user.emailAddress;
        this.getSettings();
        this.initUploaders();
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden(false);
    }

    getSettings(): void {
        this.loading = true;

        let requests: Observable<any>[] = [
                this._tenantSettingsService.getAllSettings(),
                this._tenantPaymentSettingsService.getBaseCommercePaymentSettings(),
                this._tenantPaymentSettingsService.getPayPalSettings(),
                this._tenantPaymentSettingsService.getACHWorksSettings(),
                this._tenantPaymentSettingsService.getRecurlyPaymentSettings(),
                this.isCreditReportFeatureEnabled ? this._tenantSettingsCreditReportService.getIdcsSettings() : of<IdcsSettings>(<any>null),
                this.isPFMApplicationsFeatureEnabled ? this._tenantOfferProviderSettingsService.getEPCVIPOfferProviderSettings() : of<EPCVIPOfferProviderSettings>(<any>null),
                this.isPFMApplicationsFeatureEnabled ? this._tenantSettingsService.getEPCVIPMailerSettings() : of<EPCVIPMailerSettingsEditDto>(<any>null),
                this.isPFMApplicationsFeatureEnabled ? this._tenantSettingsService.getOngageSettings() : of<OngageSettingsEditDto>(<any>null),
                this.isPFMApplicationsFeatureEnabled ? this._tenantSettingsService.getIAgeSettings() : of<IAgeSettingsEditDto>(<any>null)
            ];
        if (this.isPFMApplicationsFeatureEnabled) {
            this.epcvipEmailServers = Object.keys(EPCVIPMailerSettingsEditDtoServer);
        }

        this.moduleTypes = Object.keys(ModuleType).filter(v => !isNaN(Number(ModuleType[v])) && (ModuleType[v] & ModuleType[v] - 1) == 0);

        forkJoin(requests)
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this._changeDetection.detectChanges();
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
                    this.iageSettings
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
                this._appSessionService.tenant.logoFileType = result.fileType;
                this._appSessionService.tenant.logoId = result.id;
            }
        );

        this.customCssUploader = this.createUploader(
            '/api/TenantCustomization/UploadCustomCss',
            result => {
                this.appSession.tenant.customCssId = result.id;
                $('#TenantCustomCss').remove();
                $('head').append('<link id="TenantCustomCss" href="' + AppConsts.remoteServiceBaseUrl + '/api/TenantCustomization/GetCustomCss?id=' + this.appSession.tenant.customCssId + '" rel="stylesheet"/>');
            }
        );

        this.faviconsUploader = this.createUploader(
            '/api/TenantCustomization/UploadFavicons',
            (result: TenantCustomizationInfoDto) => {
                if (result && result.faviconBaseUrl && result.favicons && result.favicons.length) {
                    this.appSession.tenant.tenantCustomizations = <any>{ ...this.appSession.tenant.tenantCustomizations, result };
                    this._faviconsService.updateFavicons(this.appSession.tenant.tenantCustomizations.favicons, this.appSession.tenant.tenantCustomizations.faviconBaseUrl);
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
            this._changeDetection.detectChanges();
        };

        const uploaderOptions: FileUploaderOptions = {};
        uploaderOptions.authToken = 'Bearer ' + this._tokenService.getToken();
        uploaderOptions.removeAfterUpload = true;
        uploader.setOptions(uploaderOptions);
        return uploader;
    }

    uploadLogo(): void {
        this.logoUploader.uploadAll();
    }

    uploadFavicons(): void {
        this.faviconsUploader.uploadAll();
    }

    uploadCustomCss(): void {
        this.customCssUploader.uploadAll();
    }

    uploadCustomPrivacyPolicy(): void {
        this.customPrivacyPolicyUploader.uploadAll();
    }

    uploadCustomToS(): void {
        this.customToSUploader.uploadAll();
    }

    clearLogo(): void {
        this._tenantCustomizationService.clearLogo().subscribe(() => {
            this._appSessionService.tenant.logoFileType = null;
            this._appSessionService.tenant.logoId = null;
            this.notify.info(this.l('ClearedSuccessfully'));
            this._changeDetection.detectChanges();
        });
    }

    clearFavicons(): void {
        this._tenantCustomizationService.clearFavicons().subscribe(() => {
            this._faviconsService.resetFavicons();
            this.notify.info(this.l('ClearedSuccessfully'));
            this._changeDetection.detectChanges();
        });
    }

    clearCustomCss(): void {
        this._tenantCustomizationService.clearCustomCss().subscribe(() => {
            this.appSession.tenant.customCssId = null;
            $('#TenantCustomCss').remove();
            this.notify.info(this.l('ClearedSuccessfully'));
            this._changeDetection.detectChanges();
        });
    }

    clearCustomPrivacyPolicy(): void {
        this._tenantCustomizationService.clearCustomPrivacyPolicyDocument().subscribe(() => {
            this.appSession.tenant.customPrivacyPolicyDocumentId = null;
            this.notify.info(this.l('ClearedSuccessfully'));
            this._changeDetection.detectChanges();
        });
    }

    clearCustomToS(): void {
        this._tenantCustomizationService.clearCustomToSDocument().subscribe(() => {
            this.appSession.tenant.customToSDocumentId = null;
            this.notify.info(this.l('ClearedSuccessfully'));
            this._changeDetection.detectChanges();
        });
    }

    saveAll(): void {
        let requests: Observable<any>[] = [
            this._tenantSettingsService.updateAllSettings(this.settings),
            this._tenantPaymentSettingsService.updateBaseCommercePaymentSettings(this.baseCommercePaymentSettings),
            this._tenantPaymentSettingsService.updatePayPalSettings(this.payPalPaymentSettings),
            this._tenantPaymentSettingsService.updateACHWorksSettings(this.achWorksSettings),
            this._tenantPaymentSettingsService.updateRecurlyPaymentSettings(this.recurlySettings)
        ];
        if (this.isCreditReportFeatureEnabled)
            requests.push(this._tenantSettingsCreditReportService.updateIdcsSettings(this.idcsSettings));
        if (this.isPFMApplicationsFeatureEnabled)
            requests.push(this._tenantOfferProviderSettingsService.updateEPCVIPOfferProviderSettings(this.epcvipSettings));
        if (this.isPFMApplicationsFeatureEnabled)
            requests.push(this._tenantSettingsService.updateEPCVIPMailerSettings(this.epcvipEmailSettings));
        if (this.isPFMApplicationsFeatureEnabled)
            requests.push(this._tenantSettingsService.updateOngageSettings(this.ongageSettings));
        if (this.isPFMApplicationsFeatureEnabled)
            requests.push(this._tenantSettingsService.updateIAgeSettings(this.iageSettings));

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
        this._tenantSettingsService.sendTestEmail(input).subscribe(() => {
            this.notify.info(this.l('TestEmailSentSuccessfully'));
        });
    }
}
