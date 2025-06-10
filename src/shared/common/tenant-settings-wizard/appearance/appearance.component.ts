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
import { switchMap, tap } from 'rxjs/operators';

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
    AppearanceSettingsDto,
    AppearanceFilesSettings
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

    tenantId = this.appSession.tenantId;
    appearanceSetting = this.appSession.appearanceConfig;
    orgUnitId = this.appSession.orgUnitId || undefined;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    maxCssFileSize = 1024 * 1024 /* 1MB */;
    maxLogoFileSize = 1024 * 30 /* 30KB */;
    CustomCssType = CustomCssType;

    signUpPagesEnabled: boolean = this.settingService.getBoolean('App.UserManagement.IsSignUpPageEnabled');
    welcomePageOptions = [{ name: 'Default', uri: 'welcome' }, { name: 'Modern', uri: 'start' }];
    welcomePageUriSetValue = this.settingService.get('App.Appearance.WelcomePageAppearance');
    welcomePageUri: string = this.settingService.get('App.Appearance.WelcomePageAppearance') 
        || AppConsts.defaultWelcomePageUri;

    navPosition = this.getNavPosition();
    navPositionOptions = Object.keys(NavPosition).map(item => {
        return {
            id: NavPosition[item],
            text: this.ls.l('NavPosition_' + item)
        };
    });

    appearance: AppearanceSettingsDto = new AppearanceSettingsDto();
    filesSettings: AppearanceFilesSettings = new AppearanceFilesSettings();

    constructor(
        private notify: NotifyService,
        private appSession: AppSessionService,
        private faviconsService: FaviconService,
        private tenantCustomizationService: TenantCustomizationServiceProxy,
        private settingService: SettingService,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.tenantSettingsServiceProxy.getAppearanceSettings(this.orgUnitId)
            .subscribe(
                (res: AppearanceSettingsEditDto) => {
                    this.appearance = res.appearanceSettings;
                    this.filesSettings = res.filesSettings || new AppearanceFilesSettings();

                    this.welcomePageUri = this.appearance.welcomePageAppearance || this.welcomePageUri;
                    this.navPosition = this.appearance.navPosition;

                    this.changeDetectorRef.detectChanges();
                }
            );
    }

    save(): Observable<any> {
        let saveObs = [
            this.logoUploader.uploadFile().pipe(tap((res: any) => {
                if (res.result && res.result.id) {
                    this.filesSettings.lightLogoId = res.result && res.result.id;
                    this.changeDetectorRef.detectChanges();
                }
            })),
            this.cssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Platform, res))),
            this.loginCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.Login, res))),
            this.signUpPagesEnabled ?
                this.signUpCssUploader.uploadFile().pipe(tap((res: any) => this.handleCssUpload(CustomCssType.SignUp, res))) : of(false),
            this.faviconsUploader.uploadFile().pipe(tap((res) => {
                if (res && res.result && res.result.faviconBaseUrl && res.result.favicons && res.result.favicons.length) {
                    this.appearanceSetting.tenantCustomizations = <any>{ ...this.appearanceSetting.tenantCustomizations, ...res.result };
                    this.faviconsService.updateFavicons(this.appearanceSetting.tenantCustomizations.favicons, this.appearanceSetting.tenantCustomizations.faviconBaseUrl);
                    this.changeDetectorRef.detectChanges();
                }
            }))
        ];
        let welcomePageForStore = this.welcomePageUri == AppConsts.defaultWelcomePageUri || this.welcomePageUri == this.welcomePageUriSetValue ? null : this.welcomePageUri;
        let isNavPosChanged = this.appearance.navPosition != this.navPosition,
            isWelcomePageChanged = welcomePageForStore != this.appearance.welcomePageAppearance;            
        if (isNavPosChanged || isWelcomePageChanged) {
            this.appearance.welcomePageAppearance = welcomePageForStore;
            this.appearance.navPosition = this.navPosition;
            saveObs.unshift(
                this.tenantSettingsServiceProxy.updateAppearanceSettings(
                    new AppearanceSettingsEditDto({
                        organizationUnitId: this.orgUnitId,
                        filesSettings: null,
                        appearanceSettings: this.appearance
                    })
                ).pipe(tap(() => {
                    this.onOptionChanged.emit(isWelcomePageChanged ? 'appearance' : 'navPosition');
                }))
            );
        }

        const first$ = saveObs[0];
        const remaining$ = forkJoin(saveObs.slice(1));
        return first$.pipe(
            switchMap(() => remaining$)
        );
    }


    isValid(): boolean {
        return true;
    }

    handleCssUpload(cssType: CustomCssType, res: any) {
        if (res.result && res.result.id) {
            this.onOptionChanged.emit('appearance');
            this.setCustomCssTenantProperty(cssType, res.result.id);
            this.changeDetectorRef.detectChanges();
        }
    }

    clearLogo(): void {
        this.tenantCustomizationService.clearLogo(this.orgUnitId, false).subscribe(() => {
            this.filesSettings.lightLogoFileType = null;
            this.filesSettings.lightLogoId = null;
            this.notify.info(this.ls.l('ClearedSuccessfully'));
            this.changeDetectorRef.detectChanges();
        });
    }

    clearFavicons(): void {
        this.tenantCustomizationService.clearFavicons(false, this.orgUnitId).subscribe(() => {
            this.faviconsService.resetFavicons();
            this.appearanceSetting.tenantCustomizations.favicons = [];
            this.notify.info(this.ls.l('ClearedSuccessfully'));
            this.changeDetectorRef.detectChanges();
        });
    }

    clearCustomCss(cssType: CustomCssType): void {
        this.tenantCustomizationService.clearCustomCss(this.orgUnitId, cssType).subscribe(() => {
            this.setCustomCssTenantProperty(cssType, null);
            this.notify.info(this.ls.l('ClearedSuccessfully'));
            this.changeDetectorRef.detectChanges();
        });
    }

    setCustomCssTenantProperty(cssType: CustomCssType, value: string) {
        switch (cssType) {
            case CustomCssType.Platform:
                this.filesSettings.customCssId = value;
                break;
            case CustomCssType.Login:
                this.filesSettings.loginCustomCssId = value;
                break;
            case CustomCssType.SignUp:
                this.filesSettings.signUpCustomCssId = value;
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