<<<<<<< HEAD
/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
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
    UiCustomizationSettingsDto,
    CountryDto
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { CountriesStoreActions, CountriesStoreSelectors, RootStore } from '@root/store';
import { AbpMultiTenancyService } from 'abp-ng2-module';
import { FeatureCheckerService } from 'abp-ng2-module';

@Injectable()
export class AppSessionService {
    private _user: UserLoginInfoDto;
    private _tenant: TenantLoginInfoDto;
    private _application: ApplicationInfoDto;
    private _theme: UiCustomizationSettingsDto;
    private countries: any;

    constructor(
        private store$: Store<RootStore.State>,
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

    get isPublicPage(): boolean {
        return !location.pathname.startsWith('/app');
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
    get orgUnitId(): number {
        return this.tenant ? this.tenant.orgUnitId : null;
    }

    get layoutType(): string {
        return this.tenant && this.tenant.customLayoutType ? this.tenant.customLayoutType : LayoutType.Default;
    }

    get hideUserSourceFilters(): boolean {
        return this.layoutType == LayoutType.BankCode && this.user && 
            this.user.groups.every(group => group !== UserGroup.Employee && group !== UserGroup.Partner);
    }

    get theme(): UiCustomizationSettingsDto {
        return this._theme;
    }

    set theme(val: UiCustomizationSettingsDto) {
        this._theme = val;
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

    init(forced = false): Promise<boolean> {        
        return new Promise<boolean>((resolve, reject) => {
            let updateLoginInfo = (result) => {
                this._application = result.application;
                this._user = result.user;
                this._tenant = result.tenant;
                this._theme = result.theme;
                if (!this.isPublicPage && this.featureService.isEnabled(AppFeatures.AdminCustomizations))
                    this.tenantHostProxy.getMemberPortalUrl(undefined).subscribe(res => {
                        AppConsts.appMemberPortalUrl = res.url;
                    });

                resolve(true);
            };
            let generalInfo = window['generalInfo'];
            if (!forced && generalInfo && generalInfo.loginInfo)
                updateLoginInfo(generalInfo.loginInfo);
            else {
                this.sessionService.getCurrentLoginInformations().subscribe(updateLoginInfo.bind(this), (err) => {
                    reject(err);
                });
            }
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

    getCountryNameByCode(code: string) {
        let country = _.findWhere(this.countries, { code: code });
        return country && country.name;
    }

    private loadCountries(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe((countries: CountryDto[]) => {
            this.countries = countries;            
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
=======
/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
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
    UiCustomizationSettingsDto,
    CountryDto
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { CountriesStoreActions, CountriesStoreSelectors, RootStore } from '@root/store';
import { AbpMultiTenancyService } from 'abp-ng2-module';
import { FeatureCheckerService } from 'abp-ng2-module';

@Injectable()
export class AppSessionService {
    private _user: UserLoginInfoDto;
    private _tenant: TenantLoginInfoDto;
    private _application: ApplicationInfoDto;
    private _theme: UiCustomizationSettingsDto;
    private countries: any;

    constructor(
        private store$: Store<RootStore.State>,
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

    get isPublicPage(): boolean {
        return !location.pathname.startsWith('/app');
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
    get orgUnitId(): number {
        return this.tenant ? this.tenant.orgUnitId : null;
    }

    get layoutType(): string {
        return this.tenant && this.tenant.customLayoutType ? this.tenant.customLayoutType : LayoutType.Default;
    }

    get hideUserSourceFilters(): boolean {
        return this.layoutType == LayoutType.BankCode && this.user && 
            this.user.groups.every(group => group !== UserGroup.Employee && group !== UserGroup.Partner);
    }

    get theme(): UiCustomizationSettingsDto {
        return this._theme;
    }

    set theme(val: UiCustomizationSettingsDto) {
        this._theme = val;
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

    init(forced = false): Promise<boolean> {        
        return new Promise<boolean>((resolve, reject) => {
            let updateLoginInfo = (result) => {
                this._application = result.application;
                this._user = result.user;
                this._tenant = result.tenant;
                this._theme = result.theme;
                if (!this.isPublicPage && this.featureService.isEnabled(AppFeatures.AdminCustomizations))
                    this.tenantHostProxy.getMemberPortalUrl(undefined).subscribe(res => {
                        AppConsts.appMemberPortalUrl = res.url;
                    });

                resolve(true);
            };
            let generalInfo = window['generalInfo'];
            if (!forced && generalInfo && generalInfo.loginInfo)
                updateLoginInfo(generalInfo.loginInfo);
            else {
                this.sessionService.getCurrentLoginInformations().subscribe(updateLoginInfo.bind(this), (err) => {
                    reject(err);
                });
            }
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

    getCountryNameByCode(code: string) {
        let country = _.findWhere(this.countries, { code: code });
        return country && country.name;
    }

    private loadCountries(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe((countries: CountryDto[]) => {
            this.countries = countries;            
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
>>>>>>> f999b481882149d107812286d0979872df712626
}