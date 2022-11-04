/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    ViewChild
} from '@angular/core';
import { AbstractControlDirective } from '@angular/forms';

/** Third party imports */
import { forkJoin, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Application imports */
import { PhoneNumberService } from '@shared/common/phone-numbers/phone-number.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    GeneralSettingsEditDto,
    SettingScopes,
    TenantLoginInfoDto,
    TenantSettingsServiceProxy,
    Currency
} from '@shared/service-proxies/service-proxies';
import { AppTimezoneScope, Country } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UploaderComponent } from '@shared/common/tenant-settings-wizard/general-settings/uploader/uploader.component';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

@Component({
    selector: 'general-settings',
    templateUrl: 'general-settings.component.html',
    styleUrls: [ '../shared/styles/common.less', 'general-settings.component.less' ],
    providers: [ PhoneNumberService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralSettingsComponent implements ITenantSettingsStepComponent {
    @ViewChild('privacyInput', { static: false }) privacyInput: ElementRef;
    @ViewChild('tosInput', { static: false }) tosInput: ElementRef;
    @ViewChild('privacyPolicyUploader', { static: false }) privacyPolicyUploader: UploaderComponent;
    @ViewChild('tosUploader', { static: false }) tosUploader: UploaderComponent;
    @ViewChild('publicSiteUrl', { static: false }) publicSiteUrl: AbstractControlDirective;
    @ViewChild('publicPhoneNumber', { static: false }) publicPhoneNumber;

    @Output() onOptionChanged: EventEmitter<string> = new EventEmitter<string>();
    @Input() set settings(value: GeneralSettingsEditDto) {
        if (value) {
            this._settings = value;
            this.initialTimezone = value.timezone;
            this.initialCountry = value.defaultCountryCode;
        }
        this.changeDetectorRef.detectChanges();
    };
    get settings(): GeneralSettingsEditDto {
        return this._settings;
    };
    private _settings: GeneralSettingsEditDto;
    showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    defaultTimezoneScope: SettingScopes = AppTimezoneScope.Tenant;
    siteUrlRegexPattern = AppConsts.regexPatterns.url;
    isAdminCustomizations: boolean = abp.features.isEnabled(AppFeatures.AdminCustomizations);
    tenant: TenantLoginInfoDto = this.appSession.tenant;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    supportedCountries = Object.keys(Country).map(item => {
        return {
            key: Country[item],
            text: this.ls.l(item)
        };
    });
    supportedCurrencies = Object.keys(Currency).map(item => {
        return {
            key: item,
            text: this.ls.l(item)
        };
    });
    initialTimezone: string;
    initialCountry: string;

    constructor(
        private appSession: AppSessionService,
        private phoneNumberService: PhoneNumberService,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
    }

    onCountryChanged(event) {
        if (event.value == Country.Canada)
            this.settings.currency = Currency.CAD;
        else if (event.value == Country.USA)
            this.settings.currency = Currency.USD;
    }

    onPhoneNumberChange(phone, elm) {
        this.settings.publicPhone = phone == elm.getCountryCode() ? undefined : phone;
    }

    save(): Observable<any> {
        if ((!this.publicSiteUrl || this.publicSiteUrl.valid) && 
            (!this.publicPhoneNumber || this.publicPhoneNumber.isValid())
        ) {
            return forkJoin(
                this.tenantSettingsServiceProxy.updateGeneralSettings(this.settings).pipe(tap(() => {
                    if (this.initialTimezone != this.settings.timezone)
                        this.onOptionChanged.emit('timezone');
                    if (this.initialCountry != this.settings.defaultCountryCode)
                        this.onOptionChanged.emit('defaultCountry');
                    this.phoneNumberService.checkSetDefaultPhoneCodeByCountryCode(this.settings.defaultCountryCode);
                })),
                this.privacyPolicyUploader ? this.privacyPolicyUploader.uploadFile() : of(null),
                this.tosUploader ? this.tosUploader.uploadFile() : of(null)
            );
        }
    }
}