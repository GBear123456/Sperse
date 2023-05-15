/** Core imports */
import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { forkJoin, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import kebabCase from 'lodash/kebabCase';

/** Application imports */
import {
    CustomCssType,
    LayoutType,
    TenantCustomizationServiceProxy,
    TenantLoginInfoDto
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { UploaderComponent } from '@shared/common/uploader/uploader.component';
import { AppConsts } from '@shared/AppConsts';
import { FaviconService } from '@shared/common/favicon-service/favicon.service';
import { SettingService } from 'abp-ng2-module';

@Component({
    selector: 'appearance-settings',
    templateUrl: './appearance-settings.component.html',
    styleUrls: ['./appearance-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantCustomizationServiceProxy]
})
export class AppearanceSettingsComponent extends SettingsComponentBase {
    @ViewChild('logoUploader') logoUploader: UploaderComponent;
    @ViewChild('cssUploader') cssUploader: UploaderComponent;
    @ViewChild('loginCssUploader') loginCssUploader: UploaderComponent;
    @ViewChild('portalCssUploader') portalCssUploader: UploaderComponent;
    @ViewChild('faviconsUploader') faviconsUploader: UploaderComponent;
    @ViewChild('signUpCssUploader') signUpCssUploader: UploaderComponent;

    tenant: TenantLoginInfoDto = this.appSession.tenant;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    maxCssFileSize = 1024 * 1024 /* 1MB */;
    maxLogoFileSize = 1024 * 30 /* 30KB */;
    CustomCssType = CustomCssType;

    signUpPagesEnabled: boolean = this.settingService.getBoolean('App.UserManagement.IsSignUpPageEnabled');

    constructor(
        _injector: Injector,
        private faviconsService: FaviconService,
        private tenantCustomizationService: TenantCustomizationServiceProxy,
        private settingService: SettingService
    ) {
        super(_injector);
    }

    ngOnInit() {
    }

    getSaveObs(): Observable<any> {
        return forkJoin(
            this.logoUploader.uploadFile().pipe(tap((res: any) => {
                if (res.result && res.result.id) {
                    this.tenant.logoId = res.result && res.result.id;
                    this.changeDetection.detectChanges();
                }
            })),
            this.cssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Platform, res))),
            this.loginCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Login, res))),
            this.portalCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Portal, res))),
            this.signUpPagesEnabled ?
                this.signUpCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.SignUp, res))) : of(false),
            this.faviconsUploader.uploadFile().pipe(tap((res) => {
                if (res && res.result && res.result.faviconBaseUrl && res.result.favicons && res.result.favicons.length) {
                    this.tenant.tenantCustomizations = <any>{ ...this.tenant.tenantCustomizations, ...res.result };
                    this.faviconsService.updateFavicons(this.tenant.tenantCustomizations.favicons, this.tenant.tenantCustomizations.faviconBaseUrl);
                    this.changeDetection.detectChanges();
                }
            }))
        );
    }

    handleCssUpload(cssType: CustomCssType, res: any) {
        if (res.result && res.result.id) {
            this.setCustomCssTenantProperty(cssType, res.result.id);
            this.changeDetection.detectChanges();
        }
    }

    clearLogo(): void {
        this.tenantCustomizationService.clearLogo().subscribe(() => {
            this.tenant.logoFileType = null;
            this.tenant.logoId = null;
            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    clearFavicons(): void {
        this.tenantCustomizationService.clearFavicons().subscribe(() => {
            this.faviconsService.resetFavicons();
            this.tenant.tenantCustomizations.favicons = [];
            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    clearCustomCss(cssType: CustomCssType): void {
        this.tenantCustomizationService.clearCustomCss(cssType).subscribe(() => {
            this.setCustomCssTenantProperty(cssType, null);
            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }

    setCustomCssTenantProperty(cssType: CustomCssType, value: string) {
        switch (cssType) {
            case CustomCssType.Platform:
                this.tenant.customCssId = value;
                break;
            case CustomCssType.Login:
                this.tenant.loginCustomCssId = value;
                break;
            case CustomCssType.Portal:
                this.tenant.portalCustomCssId = value;
                break;
            case CustomCssType.SignUp:
                this.tenant.signUpCustomCssId = value;
                break;
        }
    }

    getCustomPlatformStylePath() {
        let tenant = this.appSession.tenant,
            basePath = 'assets/common/styles/custom/';
        if (tenant && tenant.customLayoutType && tenant.customLayoutType != LayoutType.Default)
            return basePath + kebabCase(tenant.customLayoutType) + '/style.css'
        else
            return basePath + 'platform-custom-style.css';
    }
}