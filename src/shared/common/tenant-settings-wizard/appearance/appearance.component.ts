/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    EventEmitter,
    Component,    
    Output,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { forkJoin, Observable, of } from 'rxjs';
import kebabCase from 'lodash/kebabCase';
import { tap } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    TenantLoginInfoDto,
    TenantCustomizationServiceProxy,
    CustomCssType,
    LayoutType,
    NavPosition,
    TenantSettingsServiceProxy,
    AppearanceSettingsEditDto,
    AppearanceSettingsDto
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UploaderComponent } from '@shared/common/uploader/uploader.component';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { FaviconService } from '@shared/common/favicon-service/favicon.service';
import { NotifyService } from 'abp-ng2-module';
import { SettingService } from 'abp-ng2-module';

@Component({
    selector: 'appearance',
    templateUrl: 'appearance.component.html',
    styleUrls: [
        '../shared/styles/common.less',
        'appearance.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppearanceComponent implements ITenantSettingsStepComponent {
    @ViewChild('logoUploader') logoUploader: UploaderComponent;
    @ViewChild('cssUploader') cssUploader: UploaderComponent;
    @ViewChild('loginCssUploader') loginCssUploader: UploaderComponent;
    @ViewChild('faviconsUploader') faviconsUploader: UploaderComponent;
    @ViewChild('signUpCssUploader') signUpCssUploader: UploaderComponent;

    @Output() onOptionChanged: EventEmitter<string> = new EventEmitter<string>();

    tenant: TenantLoginInfoDto = this.appSession.tenant;
    orgUnitId = this.appSession.orgUnitId;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    maxCssFileSize = 1024 * 1024 /* 1MB */;
    maxLogoFileSize = 1024 * 30 /* 30KB */;
    CustomCssType = CustomCssType;

    signUpPagesEnabled: boolean = this.settingService.getBoolean('App.UserManagement.IsSignUpPageEnabled');
    welcomePageOptions = [{name: 'Default', uri: 'welcome'}, {name: 'Modern', uri: 'start'}];
    welcomePageUri: string = this.settingService.get('App.Appearance.WelcomePageAppearance') 
        || AppConsts.defaultWelcomePageUri;

    navPosition = this.getNavPosition();
    navPositionOptions = Object.keys(NavPosition).map(item => {
        return {
            id: NavPosition[item],
            text: this.ls.l('NavPosition_' + item)
        };
    });

    constructor(
        private notify: NotifyService,
        private appSession: AppSessionService,
        private faviconsService: FaviconService,
        private tenantCustomizationService: TenantCustomizationServiceProxy,
        private settingService: SettingService,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    save(): Observable<any> {
        let saveObs = [
            this.logoUploader.uploadFile().pipe(tap((res: any) => {
                if (res.result && res.result.id) {
                    this.tenant.logoId = res.result && res.result.id;
                    this.changeDetectorRef.detectChanges();
                }
            })),
            this.cssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Platform, res))),
            this.loginCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Login, res))),
            this.signUpPagesEnabled ?
                this.signUpCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.SignUp, res))) : of(false),
            this.faviconsUploader.uploadFile().pipe(tap((res) => {
                if (res && res.result && res.result.faviconBaseUrl && res.result.favicons && res.result.favicons.length) {
                    this.tenant.tenantCustomizations = <any>{ ...this.tenant.tenantCustomizations, ...res.result };
                    this.faviconsService.updateFavicons(this.tenant.tenantCustomizations.favicons, this.tenant.tenantCustomizations.faviconBaseUrl);
                    this.changeDetectorRef.detectChanges();
                }
            }))
        ];

        let isNavPosChanged = this.getNavPosition() != this.navPosition,
            isWelcomePageChanged = this.welcomePageUri != this.settingService.get('App.Appearance.WelcomePageAppearance');            
        if (isNavPosChanged || isWelcomePageChanged) {
            saveObs.push(
                this.tenantSettingsServiceProxy.updateAppearanceSettings(
                    new AppearanceSettingsEditDto({
                        organizationUnitId: this.orgUnitId,
                        filesSettings: null,
                        appearanceSettings:
                            new AppearanceSettingsDto({
                                navPosition: this.navPosition,
                                navBackground: this.settingService.get('App.Appearance.NavBackground'),
                                navTextColor: this.settingService.get('App.Appearance.NavTextColor'),
                                buttonColor: this.settingService.get('App.Appearance.ButtonColor'),
                                buttonTextColor: this.settingService.get('App.Appearance.ButtonTextColor'),
                                buttonHighlightedColor: this.settingService.get('App.Appearance.ButtonHighlightedColor'),
                                fontName: this.settingService.get('App.Appearance.FontName'),
                                borderRadius: this.settingService.get('App.Appearance.BorderRadius'),
                                welcomePageAppearance: this.welcomePageUri == AppConsts.defaultWelcomePageUri ? null : this.welcomePageUri,
                                tabularFont: this.settingService.get('App.Appearance.TabularFont'),
                                leftsideMenuColor: this.settingService.get('App.Appearance.LeftsideMenuColor'),
                                portalSettings: null
                            })
                    })
                ).pipe(tap(() => {
                    this.onOptionChanged.emit(isWelcomePageChanged ? 'appearance' : 'navPosition');
                }))
            );
        }

        return forkJoin(saveObs);
    }

    handleCssUpload(cssType: CustomCssType, res: any) {
        if (res.result && res.result.id) {
            this.onOptionChanged.emit('appearance');
            this.setCustomCssTenantProperty(cssType, res.result.id);
            this.changeDetectorRef.detectChanges();
        }
    }

    clearLogo(): void {
        this.tenantCustomizationService.clearLogo(null, false).subscribe(() => {
            this.tenant.logoFileType = null;
            this.tenant.logoId = null;
            this.notify.info(this.ls.l('ClearedSuccessfully'));
            this.changeDetectorRef.detectChanges();
        });
    }

    clearFavicons(): void {
        this.tenantCustomizationService.clearFavicons(false, this.orgUnitId).subscribe(() => {
            this.faviconsService.resetFavicons();
            this.tenant.tenantCustomizations.favicons = [];
            this.notify.info(this.ls.l('ClearedSuccessfully'));
            this.changeDetectorRef.detectChanges();
        });
    }

    clearCustomCss(cssType: CustomCssType): void {
        this.tenantCustomizationService.clearCustomCss(null, cssType).subscribe(() => {
            this.setCustomCssTenantProperty(cssType, null);
            this.notify.info(this.ls.l('ClearedSuccessfully'));
            this.changeDetectorRef.detectChanges();
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

    getNavPosition(): NavPosition {
        return NavPosition[this.settingService.get('App.Appearance.NavPosition')];
    }
}