import { Component, OnInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { TenantSettingsServiceProxy, HostSettingsServiceProxy, DefaultTimezoneScope, TenantSettingsEditDto, SendTestEmailInput, TenantSettingsCreditReportServiceProxy, IdcsSettings, TenantPaymentSettingsServiceProxy, BaseCommercePaymentSettings, TenantCustomizationServiceProxy, TenantCustomizationDto } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppTimezoneScope } from '@shared/AppEnums';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { FileUploader, FileUploaderOptions, Headers } from '@node_modules/ng2-file-upload';
import { TokenService } from '@abp/auth/token.service';
import { IAjaxResponse } from '@abp/abpHttp';

import * as moment from "moment";

@Component({
    templateUrl: "./tenant-settings.component.html",
    animations: [appModuleAnimation()]
})
export class TenantSettingsComponent extends AppComponentBase implements OnInit {

    usingDefaultTimeZone: boolean = false;
    initialTimeZone: string = null;
    testEmailAddress: string = undefined;

    isMultiTenancyEnabled: boolean = this.multiTenancy.isEnabled;
    showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    activeTabIndex: number = (abp.clock.provider.supportsMultipleTimezone) ? 0 : 1;
    loading: boolean = false;
    settings: TenantSettingsEditDto = undefined;
    idcsSettings: IdcsSettings = new IdcsSettings();
    baseCommercePaymentSettings: BaseCommercePaymentSettings = new BaseCommercePaymentSettings();
    siteTitle: TenantCustomizationDto = new TenantCustomizationDto();

    isCreditReportFeatureEnabled: boolean = abp.features.isEnabled('CreditReportFeature');

    logoUploader: FileUploader;
    customCssUploader: FileUploader;
    faviconUploader: FileUploader;

    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;

    defaultTimezoneScope: DefaultTimezoneScope = AppTimezoneScope.Tenant;

    constructor(
        injector: Injector,
        private _tenantSettingsService: TenantSettingsServiceProxy,
        private _tenantSettingsCreditReportService: TenantSettingsCreditReportServiceProxy,
        private _tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy,
        private _appSessionService: AppSessionService,
        private _tokenService: TokenService,
        private _tenantCustomizationService: TenantCustomizationServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.testEmailAddress = this._appSessionService.user.emailAddress;
        this.getSettings();
        this.initUploaders();
    }

    getSettings(): void {
        this.loading = true;
        this._tenantSettingsService.getAllSettings()
            .finally(() => {
                this._tenantCustomizationService.getTenantCustomization(AppConsts.tenantCustomizations.uiCustomizationsGroupName, AppConsts.tenantCustomizations.UiCustomizationsSiteTitleName)
                    .finally(() => {
                        this._tenantPaymentSettingsService.getBaseCommercePaymentSettings()
                            .finally(() => {
                                if (this.isCreditReportFeatureEnabled) {
                                    this._tenantSettingsCreditReportService.getIdcsSettings()
                                        .finally(() => this.loading = false)
                                        .subscribe((result: IdcsSettings) => {
                                            this.idcsSettings = result;
                                        });
                                }
                                else {
                                    this.loading = false;
                                }
                            })
                            .subscribe((result: BaseCommercePaymentSettings) => {
                                this.baseCommercePaymentSettings = result;
                            });
                    })
                    .subscribe((result: TenantCustomizationDto) => {
                        if (typeof (result.value) !== 'undefined') {
                            this.siteTitle = result;
                        }
                        else {
                            this.siteTitle.customizationGroupName = AppConsts.tenantCustomizations.uiCustomizationsGroupName;
                            this.siteTitle.customizationName = AppConsts.tenantCustomizations.UiCustomizationsSiteTitleName;
                        }
                    })
            })
            .subscribe((result: TenantSettingsEditDto) => {
                this.settings = result;
                if (this.settings.general) {
                    this.initialTimeZone = this.settings.general.timezone;
                    this.usingDefaultTimeZone = this.settings.general.timezoneForComparison === abp.setting.values["Abp.Timing.TimeZone"];
                }
            });
    }

    initUploaders(): void {
        this.logoUploader = this.createUploader(
            "/TenantCustomization/UploadLogo",
            result => {
                this._appSessionService.tenant.logoFileType = result.fileType;
                this._appSessionService.tenant.logoId = result.id;
            }
        );

        this.customCssUploader = this.createUploader(
            "/TenantCustomization/UploadCustomCss",
            result => {
                this.appSession.tenant.customCssId = result.id;
                $('#TenantCustomCss').remove();
                $('head').append('<link id="TenantCustomCss" href="' + AppConsts.remoteServiceBaseUrl + '/TenantCustomization/GetCustomCss?id=' + this.appSession.tenant.customCssId + '" rel="stylesheet"/>');
            }
        );

        this.faviconUploader = this.createUploader(
            "/TenantCustomization/UploadFavicons",
            result => {
            }
        );
    }

    createUploader(url: string, success?: (result: any) => void): FileUploader {
        const uploader = new FileUploader({ url: AppConsts.remoteServiceBaseUrl + url });

        uploader.onAfterAddingFile = (file) => {
            file.withCredentials = false;
        };

        uploader.onSuccessItem = (item, response, status) => {
            let ajaxResponse = <IAjaxResponse>JSON.parse(response);
            if (ajaxResponse.success) {
                this.notify.info(this.l('SavedSuccessfully'));
                success && success(ajaxResponse.result);
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

    uploadFavicon(): void {
        this.faviconUploader.uploadAll();
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

    clearFavicon(): void {
        this._tenantSettingsService.clearFavicons().subscribe(() => {
            this._appSessionService.tenant.tenantCustomizations.favicons = [];
            this.notify.info(this.l('ClearedSuccessfully'));
        });
    }

    saveAll(): void {
        this._tenantSettingsService.updateAllSettings(this.settings).subscribe(() => {
            this._tenantPaymentSettingsService.updateBaseCommercePaymentSettings(this.baseCommercePaymentSettings).subscribe(() => {
                if (typeof (this.siteTitle.value) !== 'undefined') {
                    this._tenantCustomizationService.addTenantCustomization(this.siteTitle).subscribe(() => {
                        this.saveAnother();
                    });
                }
                else {
                    this.saveAnother();
                }
            });
        });
    };

    sendTestEmail(): void {
        let input = new SendTestEmailInput();
        input.emailAddress = this.testEmailAddress;
        this._tenantSettingsService.sendTestEmail(input).subscribe(result => {
            this.notify.info(this.l("TestEmailSentSuccessfully"));
        });
    };

    saveAnother(): void {
        if (this.isCreditReportFeatureEnabled) {
            this._tenantSettingsCreditReportService.updateIdcsSettings(this.idcsSettings).subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
            });
        }
        else this.notify.info(this.l('SavedSuccessfully'));

        if (abp.clock.provider.supportsMultipleTimezone && this.usingDefaultTimeZone && this.initialTimeZone !== this.settings.general.timezone) {
            this.message.info(this.l('TimeZoneSettingChangedRefreshPageNotification')).done(() => {
                window.location.reload();
            });
        }
    };
}