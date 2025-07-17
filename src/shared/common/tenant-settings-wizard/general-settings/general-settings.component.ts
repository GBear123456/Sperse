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
import { NotifyService } from 'abp-ng2-module';

/** Application imports */
import { PhoneNumberService } from '@shared/common/phone-numbers/phone-number.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    GeneralSettingsEditDto,
    SettingScopes,
    TenantLoginInfoDto,
    TenantSettingsServiceProxy,
    CountryDto,
    TenantCustomizationServiceProxy,
    RenameTenantDto
} from '@shared/service-proxies/service-proxies';
import { AppTimezoneScope, ConditionsType } from '@shared/AppEnums';
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
    isRenameTenantEnabled: boolean = !!this.appSession.tenant && !this.appSession.orgUnitId && this.permissionChecker.isGranted(
        AppPermissions.AdministrationTenantSettings
    );
    tenant: TenantLoginInfoDto = this.appSession.tenant;
    appearanceConfig: TenantLoginInfoDto = this.appSession.appearanceConfig;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    conditions = ConditionsType;

    tenantName = this.tenant?.name;

    supportedCountries: CountryDto[];
    initialTimezone: string;
    initialCountry: string;
    initialCurrency: string;

    constructor(
        private appSession: AppSessionService,
        private phoneNumberService: PhoneNumberService,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        private tenantCustomizationService: TenantCustomizationServiceProxy,
        private notify: NotifyService,
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
            (!this.publicPhoneNumber || this.publicPhoneNumber.isValid())
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
                this.privacyPolicyUploader ? this.privacyPolicyUploader.uploadFile().pipe(tap((res: any) => this.handleConditionsUpload(ConditionsType.Policies, res))) : of(null),
                this.tosUploader ? this.tosUploader.uploadFile().pipe(tap((res: any) => this.handleConditionsUpload(ConditionsType.Terms, res))) : of(null),
                this.isRenameTenantEnabled && this.tenantName != this.appSession.tenant.name ?
                    this.tenantSettingsServiceProxy.renameTenant(new RenameTenantDto({ name: this.tenantName }))
                        .pipe(tap(() => {
                            this.onOptionChanged.emit('tenantName');
                            this.appSession.tenant.name = this.tenantName;
                        }))
                    : of(null)
            );
        }
        return forkJoin(of(null));
    }

    isValid(): boolean {
        return (!this.publicSiteUrl || this.publicSiteUrl.valid) &&
            (!this.publicPhoneNumber || this.publicPhoneNumber.isValid());
    }

    handleConditionsUpload(type: ConditionsType, res) {
        if (res.result && res.result.id) {
            if (type == ConditionsType.Policies)
                this.appearanceConfig.customPrivacyPolicyDocumentId = res.result.id;
            else
                this.appearanceConfig.customToSDocumentId = res.result.id;
            this.changeDetectorRef.detectChanges();
        }
    }

    clearConditions(type: ConditionsType) {
        let method$ = type == ConditionsType.Policies ?
            this.tenantCustomizationService.clearCustomPrivacyPolicyDocument() :
            this.tenantCustomizationService.clearCustomToSDocument();

        method$.subscribe(() => {
            if (type == ConditionsType.Policies)
                this.appearanceConfig.customPrivacyPolicyDocumentId = null;
            else
                this.appearanceConfig.customToSDocumentId = null;

            this.notify.info(this.ls.l('ClearedSuccessfully'));
            this.changeDetectorRef.detectChanges();
        });
    }
}