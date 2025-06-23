/** Core imports */
import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { select, Store } from '@ngrx/store';
import { forkJoin, Observable, of } from 'rxjs';
import { finalize, tap, first, filter, map } from 'rxjs/operators';
import { CountryService } from '@root/node_modules/ngx-international-phone-number/src/country.service';

/** Application imports */
import {
    GeneralSettingsEditDto,
    SettingScopes,
    TenantLoginInfoDto,
    TenantSettingsServiceProxy,
    CountryDto,
    TenantCustomizationServiceProxy,
    RenameTenantDto
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { AppTimezoneScope, ConditionsType } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AbstractControlDirective } from '@angular/forms';
import { AppFeatures } from '@shared/AppFeatures';
import { UploaderComponent } from '@shared/common/uploader/uploader.component';
import { PhoneNumberService } from '@shared/common/phone-numbers/phone-number.service';
import { RootStore, CountriesStoreSelectors } from '@root/store';
import { TimeZoneComboComponent } from '@app/shared/common/timing/timezone-combo.component';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    selector: 'general-settings',
    templateUrl: './general-settings.component.html',
    styleUrls: ['./general-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [PhoneNumberService, TenantSettingsServiceProxy]
})
export class GeneralSettingsComponent extends SettingsComponentBase {
    @ViewChild(TimeZoneComboComponent, { static: false }) timezoneComponent: TimeZoneComboComponent;
    @ViewChild('privacyPolicyUploader', { static: false }) privacyPolicyUploader: UploaderComponent;
    @ViewChild('tosUploader', { static: false }) tosUploader: UploaderComponent;
    @ViewChild('publicSiteUrl', { static: false }) publicSiteUrl: AbstractControlDirective;
    @ViewChild('publicPhoneNumber', { static: false }) publicPhoneNumber;

    generalSettings: GeneralSettingsEditDto;

    showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    defaultTimezoneScope: SettingScopes = AppTimezoneScope.Tenant;
    siteUrlRegexPattern = AppConsts.regexPatterns.url;
    appearanceConfig: TenantLoginInfoDto = this.appSession.appearanceConfig;
    conditions = ConditionsType;

    isAdminCustomizations: boolean = abp.features.isEnabled(AppFeatures.AdminCustomizations);
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    supportedCountries: CountryDto[];

    initialTimezone: string;
    initialCountry: string;

    isRenameTenantEnabled: boolean = !!this.appSession.tenant && !this.appSession.orgUnitId && this.isGranted(
        AppPermissions.AdministrationTenantSettings
    );
    tenantName = this.appSession.tenant?.name;

    constructor(
        _injector: Injector,
        private store$: Store<RootStore.State>,
        private phoneNumberService: PhoneNumberService,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private tenantCustomizationService: TenantCustomizationServiceProxy,
        private countryPhoneService: CountryService
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.initCountries();
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
            this.generalSettings.currency = country.currencyId || abp.setting.get('App.TenantManagement.Currency');
            this.timezoneComponent.setTimezoneByCountryCode(country.code);
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
        this.generalSettings.publicPhone = phone == elm.getCountryCode() ? undefined : phone;
    }

    isValid(): boolean {
        if (!this.isHost) {
            return (!this.publicSiteUrl || this.publicSiteUrl.valid) &&
                (!this.publicPhoneNumber || this.publicPhoneNumber.isValid());
        }

        return super.isValid();
    }

    onUrlPaste(event) {
        setTimeout(() => {
            this.generalSettings.publicSiteUrl = 
            event.target.value = event.target.value.trim();
            this.changeDetection.detectChanges();
            event.target.blur();
        }, 100);
    }

    getSaveObs(): Observable<any> {
        return forkJoin(
            this.tenantSettingsService.updateGeneralSettings(this.generalSettings).pipe(tap(() => {
                this.phoneNumberService.checkSetDefaultPhoneCodeByCountryCode(this.generalSettings.defaultCountryCode);
                sessionStorage.removeItem('SupportedFrom' + this.appSession.userId);
            })),
            this.privacyPolicyUploader ? this.privacyPolicyUploader.uploadFile().pipe(tap((res: any) => this.handleConditionsUpload(ConditionsType.Policies, res))) : of(null),
            this.tosUploader ? this.tosUploader.uploadFile().pipe(tap((res: any) => this.handleConditionsUpload(ConditionsType.Terms, res))) : of(null),
            this.isRenameTenantEnabled && this.tenantName != this.appSession.tenant.name ? this.tenantSettingsService.renameTenant(new RenameTenantDto({ name: this.tenantName })) : of(null)
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

        if (this.tenantName != this.appSession.tenant.name) {
            this.message.info(this.l('SettingsChangedRefreshPageNotification', this.l('Tenant name'))).done(function () {
                window.location.reload();
            });
        }
    }

    handleConditionsUpload(type: ConditionsType, res) {
        if (res.result && res.result.id) {
            if (type == ConditionsType.Policies)
                this.appearanceConfig.customPrivacyPolicyDocumentId = res.result.id;
            else
                this.appearanceConfig.customToSDocumentId = res.result.id;
            this.changeDetection.detectChanges();
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

            this.notify.info(this.l('ClearedSuccessfully'));
            this.changeDetection.detectChanges();
        });
    }
}