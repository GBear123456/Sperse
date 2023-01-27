/** Core imports */
import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { forkJoin, Observable, of } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

/** Application imports */
import {
    GeneralSettingsEditDto,
    SettingScopes,
    TenantLoginInfoDto,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { AppTimezoneScope, Country } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AbstractControlDirective } from '@angular/forms';
import { AppFeatures } from '@shared/AppFeatures';
import { UploaderComponent } from '@shared/common/uploader/uploader.component';
import { PhoneNumberService } from '@shared/common/phone-numbers/phone-number.service';

@Component({
    selector: 'general-settings',
    templateUrl: './general-settings.component.html',
    styleUrls: ['./general-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [PhoneNumberService, TenantSettingsServiceProxy]
})
export class GeneralSettingsComponent extends SettingsComponentBase {
    @ViewChild('privacyPolicyUploader', { static: false }) privacyPolicyUploader: UploaderComponent;
    @ViewChild('tosUploader', { static: false }) tosUploader: UploaderComponent;
    @ViewChild('publicSiteUrl', { static: false }) publicSiteUrl: AbstractControlDirective;
    @ViewChild('publicPhoneNumber', { static: false }) publicPhoneNumber;

    generalSettings: GeneralSettingsEditDto;

    showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    defaultTimezoneScope: SettingScopes = AppTimezoneScope.Tenant;
    siteUrlRegexPattern = AppConsts.regexPatterns.url;
    tenant: TenantLoginInfoDto = this.appSession.tenant;

    isAdminCustomizations: boolean = abp.features.isEnabled(AppFeatures.AdminCustomizations);
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    supportedCountries = Object.keys(Country).map(item => {
        return {
            key: Country[item],
            text: this.l(item)
        };
    });

    initialTimezone: string;
    initialCountry: string;

    constructor(
        _injector: Injector,
        private phoneNumberService: PhoneNumberService,
        private tenantSettingsService: TenantSettingsServiceProxy,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.tenantSettingsService.getGeneralSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.generalSettings = res;
                this.initialTimezone = res.timezone;
                this.initialCountry = res.defaultCountryCode;
                this.changeDetection.detectChanges();
            });
    }

    onPhoneNumberChange(phone, elm) {
        this.generalSettings.publicPhone = phone == elm.getCountryCode() ? undefined : phone;
    }

    isValid(): boolean {
        if (!this.isHost) {
            return (!this.publicSiteUrl || this.publicSiteUrl.valid) &&
                (!this.publicPhoneNumber || this.publicPhoneNumber.isValid())
        }

        return super.isValid();
    }

    getSaveObs(): Observable<any> {
        return forkJoin(
            this.tenantSettingsService.updateGeneralSettings(this.generalSettings).pipe(tap(() => {
                this.phoneNumberService.checkSetDefaultPhoneCodeByCountryCode(this.generalSettings.defaultCountryCode);
                sessionStorage.removeItem('SupportedFrom' + this.appSession.userId);
            })),
            this.privacyPolicyUploader ? this.privacyPolicyUploader.uploadFile() : of(null),
            this.tosUploader ? this.tosUploader.uploadFile() : of(null)
        );
    }

    afterSave() {
        if (this.initialCountry !== this.generalSettings.defaultCountryCode) {
            this.message.info(this.l('DefaultSettingChangedRefreshPageNotification', this.l('Country'))).done(function () {
                window.location.reload();
            });
        }

        if (abp.clock.provider.supportsMultipleTimezone && this.initialTimezone !== this.generalSettings.timezone
        ) {
            this.message.info(this.l('TimeZoneSettingChangedRefreshPageNotification')).done(function () {
                window.location.reload();
            });
        }
    }
}