import { IAjaxResponse } from '@abp/abpHttpInterceptor';
import { TokenService } from '@abp/auth/token.service';
import { AfterViewChecked, Component, Injector, OnInit, OnDestroy } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope } from '@shared/AppEnums';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    DefaultTimezoneScope, SendTestEmailInput, TenantSettingsEditDto, TenantSettingsServiceProxy,
    IdcsSettings, BaseCommercePaymentSettings, TenantSettingsCreditReportServiceProxy, TenantPaymentSettingsServiceProxy, ACHWorksSettings
} from '@shared/service-proxies/service-proxies';
import { FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import { Observable, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
    templateUrl: './tenant-settings.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./tenant-settings.component.less'],
    providers: [TenantSettingsCreditReportServiceProxy, TenantPaymentSettingsServiceProxy]
})
export class TenantSettingsComponent extends AppComponentBase implements OnInit, OnDestroy, AfterViewChecked {

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
    achWorksSettings: ACHWorksSettings = new ACHWorksSettings();
    isCreditReportFeatureEnabled: boolean = abp.features.isEnabled('CreditReportFeature');

    logoUploader: FileUploader;
    customCssUploader: FileUploader;

    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;

    defaultTimezoneScope: DefaultTimezoneScope = AppTimezoneScope.Tenant;

    private rootComponent;

    constructor(
        injector: Injector,
        private _tenantSettingsService: TenantSettingsServiceProxy,
        private _tenantSettingsCreditReportService: TenantSettingsCreditReportServiceProxy,
        private _tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy,
        private _appSessionService: AppSessionService,
        private _tokenService: TokenService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.pageHeaderFixed();
    }

    ngOnInit(): void {
        this.testEmailAddress = this._appSessionService.user.emailAddress;
        this.getSettings();
        this.initUploaders();
    }

    ngAfterViewChecked(): void {
        //Temporary fix for: https://github.com/valor-software/ngx-bootstrap/issues/1508
        $('tabset ul.nav').addClass('m-tabs-line');
        $('tabset ul.nav li a.nav-link').addClass('m-tabs__link');
    }

    ngOnDestroy() {
        this.rootComponent.pageHeaderFixed(true);
    }

    getSettings(): void {
        this.loading = true;

        let requests: Observable<any>[] = [
            this._tenantSettingsService.getAllSettings(),
            this._tenantPaymentSettingsService.getBaseCommercePaymentSettings(),
            this._tenantPaymentSettingsService.getACHWorksSettings()
        ];

        if (this.isCreditReportFeatureEnabled)
            requests.push(this._tenantSettingsCreditReportService.getIdcsSettings());

        forkJoin(requests)
            .pipe(finalize(() => { this.loading = false; }))
            .subscribe((result) => {
                this.settings = result[0];
                if (this.settings.general) {
                    this.initialTimeZone = this.settings.general.timezone;
                    this.usingDefaultTimeZone = this.settings.general.timezoneForComparison === abp.setting.values['Abp.Timing.TimeZone'];
                }

                this.baseCommercePaymentSettings = result[1];
                this.achWorksSettings = result[2];

                if (this.isCreditReportFeatureEnabled)
                    this.idcsSettings = result[2];
            });
    }

    initUploaders(): void {
        this.logoUploader = this.createUploader(
            '/TenantCustomization/UploadLogo',
            result => {
                this._appSessionService.tenant.logoFileType = result.fileType;
                this._appSessionService.tenant.logoId = result.id;
            }
        );

        this.customCssUploader = this.createUploader(
            '/TenantCustomization/UploadCustomCss',
            result => {
                this.appSession.tenant.customCssId = result.id;
                $('#TenantCustomCss').remove();
                $('head').append('<link id="TenantCustomCss" href="' + AppConsts.remoteServiceBaseUrl + '/TenantCustomization/GetCustomCss?id=' + this.appSession.tenant.customCssId + '" rel="stylesheet"/>');
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

    uploadCustomCss(): void {
        this.customCssUploader.uploadAll();
    }

    clearLogo(): void {
        this._tenantSettingsService.clearLogo().subscribe(() => {
            this._appSessionService.tenant.logoFileType = null;
            this._appSessionService.tenant.logoId = null;
            this.notify.info(this.l('ClearedSuccessfully'));
        });
    }

    clearCustomCss(): void {
        this._tenantSettingsService.clearCustomCss().subscribe(() => {
            this.appSession.tenant.customCssId = null;
            $('#TenantCustomCss').remove();
            this.notify.info(this.l('ClearedSuccessfully'));
        });
    }

    saveAll(): void {
        let requests: Observable<any>[] = [
            this._tenantSettingsService.updateAllSettings(this.settings),
            this._tenantPaymentSettingsService.updateBaseCommercePaymentSettings(this.baseCommercePaymentSettings),
            this._tenantPaymentSettingsService.updateACHWorksSettings(this.achWorksSettings)
        ];
        if (this.isCreditReportFeatureEnabled)
            requests.push(this._tenantSettingsCreditReportService.updateIdcsSettings(this.idcsSettings));

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
