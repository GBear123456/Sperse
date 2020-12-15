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
import { forkJoin, Observable, throwError, of } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    GeneralSettingsEditDto,
    SettingScopes,
    TenantLoginInfoDto,
    TenantSettingsServiceProxy,
    TimingServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppTimezoneScope } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UploaderComponent } from '@shared/common/tenant-settings-wizard/general-settings/uploader/uploader.component';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

@Component({
    selector: 'general-settings',
    templateUrl: 'general-settings.component.html',
    styleUrls: [ '../shared/styles/common.less', 'general-settings.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralSettingsComponent implements ITenantSettingsStepComponent {
    @ViewChild('privacyInput', { static: false }) privacyInput: ElementRef;
    @ViewChild('tosInput', { static: false }) tosInput: ElementRef;
    @ViewChild('privacyPolicyUploader', { static: false }) privacyPolicyUploader: UploaderComponent;
    @ViewChild('tosUploader', { static: false }) tosUploader: UploaderComponent;
    @ViewChild('publicSiteUrl', { static: false }) publicSiteUrl: AbstractControlDirective;
    @Input() settings: GeneralSettingsEditDto;
    showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    defaultTimezoneScope: SettingScopes = AppTimezoneScope.Tenant;
    siteUrlRegexPattern = AppConsts.regexPatterns.url;
    isAdminCustomizations: boolean = abp.features.isEnabled(AppFeatures.AdminCustomizations);
    tenant: TenantLoginInfoDto = this.appSession.tenant;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;

    constructor(
        private timingService: TimingServiceProxy,
        private appSession: AppSessionService,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    save(): Observable<any> {
        if (!this.publicSiteUrl || this.publicSiteUrl.valid) {
            return forkJoin(
                this.tenantSettingsServiceProxy.updateGeneralSettings(this.settings),
                this.privacyPolicyUploader ? this.privacyPolicyUploader.uploadFile() : of(null),
                this.tosUploader ? this.tosUploader.uploadFile() : of(null)
            );
        } else {
            return throwError('Invalid data');
        }
    }
}