/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { CountryService } from '@root/node_modules/ngx-international-phone-number/src/country.service';
import { Store, select } from '@ngrx/store';
import * as _ from 'underscore';

/** Application imports */
import {
    ApplicationInfoDto,
    LayoutType,
    SessionServiceProxy,
    TenantLoginInfoDto,
    UserGroup,
    UserLoginInfoDto,
    TenantHostServiceProxy,
    CountryDto
} from '@shared/service-proxies/service-proxies';
import { Country } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { CountriesStoreActions, CountriesStoreSelectors, RootStore } from '@root/store';
import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';

@Injectable()
export class AppSessionService {
    private _user: UserLoginInfoDto;
    private _tenant: TenantLoginInfoDto;
    private _application: ApplicationInfoDto;
    private countries: any;

    constructor(
        private store$: Store<RootStore.State>,
        private countryPhoneService: CountryService,
        private sessionService: SessionServiceProxy,
        private featureService: FeatureCheckerService,
        private tenantHostProxy: TenantHostServiceProxy,
        private abpMultiTenancyService: AbpMultiTenancyService
    ) {
        this.loadCountries();
        abp.event.on('profilePictureChanged', (thumbnailId) => {
            this.user.profileThumbnailId = thumbnailId;
        });
    }

    get isLendspaceDemoUser() {  //!!VP should be added corresponding permissions for such case (temp solution)
        return this.user && this.user.userName == 'demo@lendspace.com';
    }

    get isPerformancePartnerTenant() {
        return this.tenantName == 'Performance Partners';
    }

    get application(): ApplicationInfoDto {
        return this._application;
    }

    get user(): UserLoginInfoDto {
        return this._user;
    }

    get userId(): number {
        return this.user ? this.user.id : null;
    }

    get tenant(): TenantLoginInfoDto {
        return this._tenant;
    }

    get tenantName(): string {
        return this._tenant ? this.tenant.name : '';
    }

    get tenancyName(): string {
        return this._tenant ? this.tenant.tenancyName : '';
    }

    get tenantId(): number {
        return this.tenant ? this.tenant.id : null;
    }

    get layoutType(): string {
        return this.tenant && this.tenant.customLayoutType ? this.tenant.customLayoutType : LayoutType.Default;
    }

    get userIsMember(): boolean {
        return !!(this.user && this.user.group === UserGroup.Member);
    }

    getShownLoginName(): string {
        const userName = this._user.userName;
        if (!this.abpMultiTenancyService.isEnabled) {
            return userName;
        }

        return (this._tenant ? this._tenant.tenancyName : '.') + '\\' + userName;
    }

    getShownLoginInfo(): { fullName, email, tenantName?} {
        let info: { fullName, email, tenantName? } = {
            fullName: this._user && (this._user.name + ' ' + this._user.surname),
            email: this._user && this._user.emailAddress
        };

        if (this.abpMultiTenancyService.isEnabled) {
            info.tenantName = this.tenant ? this._tenant.name : 'Host';
        }

        return info;
    }

    init(): Promise<boolean> {        
        return new Promise<boolean>((resolve, reject) => {
            let updateLoginInfo = (result) => {
                this._application = result.application;
                this._user = result.user;
                this._tenant = result.tenant;

                if (this.featureService.isEnabled(AppFeatures.AdminCustomizations))
                    this.tenantHostProxy.getMemberPortalUrl().subscribe(res => {
                        AppConsts.appMemberPortalUrl = res.url;
                    });

                resolve(true);
            };
            let generalInfo = window['generalInfo'];
            if (generalInfo && generalInfo.loginInfo)
                updateLoginInfo(generalInfo.loginInfo);
            else
                this.sessionService.getCurrentLoginInformations().subscribe(updateLoginInfo.bind(this), (err) => {
                    reject(err);
                });
        });
    }

    changeTenantIfNeeded(tenantId?: number, reload = true): boolean {
        if (this.isCurrentTenant(tenantId)) {
            return false;
        }

        abp.auth.clearToken();
        abp.multiTenancy.setTenantIdCookie(tenantId);
        reload && location.reload();
        return true;
    }

    checkSetDefaultCountry(countryCode?: string) {
        if (!countryCode)
            countryCode = this.getDefaultCountryCode();

        AppConsts.defaultCountryCode = countryCode;
        AppConsts.defaultCountryPhoneCode = this.countryPhoneService.getPhoneCodeByCountryCode(countryCode);
    }

    getDefaultCountryCode() {
        return abp.setting.get('App.TenantManagement.DefaultCountryCode') || Country.USA;
    }

    getCountryNameByCode(code: string) {
        let country = _.findWhere(this.countries, { code: code });
        return country && country.name;
    }

    private loadCountries(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe((countries: CountryDto[]) => {
            this.countries = countries;
            this.checkSetDefaultCountry();
        });
    }

    private isCurrentTenant(tenantId?: number) {
        if (!tenantId && this.tenant) {
            return false;
        } else if (tenantId && (!this.tenant || this.tenant.id !== tenantId)) {
            return false;
        }

        return true;
    }
}
