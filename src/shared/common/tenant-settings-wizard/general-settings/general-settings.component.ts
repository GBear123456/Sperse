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
import { tap, filter, first, map } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { CountryService } from '@root/node_modules/ngx-international-phone-number/src/country.service';

/** Application imports */
import { PhoneNumberService } from '@shared/common/phone-numbers/phone-number.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    GeneralSettingsEditDto,
    SettingScopes,
    TenantLoginInfoDto,
    TenantSettingsServiceProxy,
    CountryDto,
    RenameTenantDto
} from '@shared/service-proxies/service-proxies';
import { AppTimezoneScope } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UploaderComponent } from '@shared/common/uploader/uploader.component';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { RootStore, CountriesStoreSelectors } from '@root/store';
import { TimeZoneComboComponent } from '@app/shared/common/timing/timezone-combo.component';
import { AppPermissions } from '@shared/AppPermissions';
import { PermissionCheckerService } from 'abp-ng2-module';

@Component({
    selector: 'general-settings',
    templateUrl: 'general-settings.component.html',
    styleUrls: ['../shared/styles/common.less', 'general-settings.component.less'],
    providers: [PhoneNumberService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralSettingsComponent implements ITenantSettingsStepComponent {
    @ViewChild(TimeZoneComboComponent, { static: false }) timezoneComponent: TimeZoneComboComponent;
    @ViewChild('privacyInput', { static: false }) privacyInput: ElementRef;
    @ViewChild('tosInput', { static: false }) tosInput: ElementRef;
    @ViewChild('privacyPolicyUploader', { static: false }) privacyPolicyUploader: UploaderComponent;
    @ViewChild('tosUploader', { static: false }) tosUploader: UploaderComponent;
    @ViewChild('publicSiteUrl', { static: false }) publicSiteUrl: AbstractControlDirective;
    @ViewChild('publicPhoneNumber', { static: false }) publicPhoneNumber;
    @ViewChild('tenantNameModel', { static: false }) tenantNameMadel: AbstractControlDirective;

    @Output() onOptionChanged: EventEmitter<string> = new EventEmitter<string>();
    @Input() set settings(value: GeneralSettingsEditDto) {
        if (value) {
            this._settings = value;
            this.initialTimezone = value.timezone;
            this.initialCountry = value.defaultCountryCode;
            this.initialCurrency = value.currency;
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
    isRenameTenantEnabled: boolean = this.permissionChecker.isGranted(
        AppPermissions.AdministrationTenantSettings
    );
    tenant: TenantLoginInfoDto = this.appSession.tenant;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;

    tenantName = this.tenant.name;

    supportedCountries: CountryDto[];
    initialTimezone: string;
    initialCountry: string;
    initialCurrency: string;

    constructor(
        private appSession: AppSessionService,
        private phoneNumberService: PhoneNumberService,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        private store$: Store<RootStore.State>,
        private countryPhoneService: CountryService,
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        private permissionChecker: PermissionCheckerService,
    ) {
        this.initCountries();
    }

    private initCountries() {
        this.store$.pipe(
            select(CountriesStoreSelectors.getCountries),
            filter(Boolean),
            first()
        ).subscribe((countries: CountryDto[]) => {
            this.supportedCountries = countries;
        });
    }

    onCountryChanged(event) {
        let country = this.supportedCountries.find(country => country.code == event.value);
        if (country) {
            this.timezoneComponent.setTimezoneByCountryCode(country.code);
            this.settings.currency = country.currencyId || abp.setting.get('App.TenantManagement.Currency');
            if (this.publicPhoneNumber && this.publicPhoneNumber.isEmpty()) {
                let countryCode = country.code.toLowerCase();
                if (!this.countryPhoneService.getPhoneCodeByCountryCode(countryCode))
                    countryCode = abp.setting.get('App.TenantManagement.DefaultCountryCode').toLowerCase();

                this.publicPhoneNumber.intPhoneNumber.phoneNumber = '';
                this.publicPhoneNumber.intPhoneNumber.updatePhoneInput(countryCode);
            }
        }
    }

    onPhoneNumberChange(phone, elm) {
        this.settings.publicPhone = phone == elm.getCountryCode() ? undefined : phone;
    }

    onUrlPaste(event) {
        setTimeout(() => {
            this.settings.publicSiteUrl = 
            event.target.value = event.target.value.trim();
            this.changeDetectorRef.detectChanges();
            event.target.blur();
        }, 100);
    }

    save(): Observable<any> {
        if ((!this.publicSiteUrl || this.publicSiteUrl.valid) && 
            (!this.publicPhoneNumber || this.publicPhoneNumber.isValid()) &&
            (!this.tenant || !this.isRenameTenantEnabled || this.tenantNameMadel.valid)
        ) {
            return forkJoin(
                this.tenantSettingsServiceProxy.updateGeneralSettings(this.settings).pipe(tap(() => {
                    if (this.initialTimezone != this.settings.timezone)
                        this.onOptionChanged.emit('timezone');
                    if (this.initialCountry != this.settings.defaultCountryCode)
                        this.onOptionChanged.emit('defaultCountry');
                    if (this.initialCurrency != this.settings.currency)
                        this.onOptionChanged.emit('currency');
                    this.phoneNumberService.checkSetDefaultPhoneCodeByCountryCode(this.settings.defaultCountryCode);
                })),
                this.privacyPolicyUploader ? this.privacyPolicyUploader.uploadFile() : of(null),
                this.tosUploader ? this.tosUploader.uploadFile() : of(null),
                this.isRenameTenantEnabled && this.tenantName != this.appSession.tenant.name ?
                    this.tenantSettingsServiceProxy.renameTenant(new RenameTenantDto({ name: this.tenantName }))
                        .pipe(tap(() => {
                            this.onOptionChanged.emit('tenantName');
                        }))
                    : of(null)
            );
        }
        return forkJoin(of(null));
    }
}