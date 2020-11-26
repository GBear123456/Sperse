/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    ViewChild
} from '@angular/core';
import { AbstractControlDirective } from '@angular/forms';

/** Third party imports */
import { forkJoin, Observable, throwError } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    GeneralSettingsEditDto,
    SettingScopes,
    TenantLoginInfoDto,
    TimingServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppTimezoneScope } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UploaderComponent } from '@shared/common/tenant-settings-wizard/general-settings/uploader/uploader.component';

@Component({
    selector: 'general-settings',
    templateUrl: 'general-settings.component.html',
    styleUrls: [ 'general-settings.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralSettingsComponent  {
    @ViewChild('privacyInput', { static: false }) privacyInput: ElementRef;
    @ViewChild('tosInput', { static: false }) tosInput: ElementRef;
    @ViewChild('privacyPolicyUploader', { static: false }) privacyPolicyUploader: UploaderComponent;
    @ViewChild('tosUploader', { static: false }) tosUploader: UploaderComponent;
    @ViewChild('publicSiteUrl', { static: false }) publicSiteUrl: AbstractControlDirective;
    @Input() generalSettings: GeneralSettingsEditDto;
    showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    defaultTimezoneScope: SettingScopes = AppTimezoneScope.Tenant;
    siteUrlRegexPattern = AppConsts.regexPatterns.siteUrl;
    isAdminCustomizations: boolean = abp.features.isEnabled(AppFeatures.AdminCustomizations);
    tenant: TenantLoginInfoDto = this.appSession.tenant;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;

    constructor(
        private timingService: TimingServiceProxy,
        private appSession: AppSessionService,
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    save(): Observable<any> {
        const generalSettings: any = {
            general: {
                timezone: this.generalSettings.timezone,
                zendeskAccountUrl: this.generalSettings.zendeskAccountUrl,
                publicSiteUrl: this.generalSettings.publicSiteUrl
            }
        };
        if (this.publicSiteUrl.valid) {
            return forkJoin(
                //this.settingsService.updateAllSettings(generalSettings),
                this.privacyPolicyUploader.uploadFile(),
                this.tosUploader.uploadFile()
            );
        } else {
            return throwError('Invalid data');
        }
    }
}