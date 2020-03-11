import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import { Injectable } from '@angular/core';
import {
    ApplicationInfoDto,
    LayoutType,
    SessionServiceProxy,
    TenantLoginInfoDto,
    UserLoginInfoDto
} from '@shared/service-proxies/service-proxies';

@Injectable()
export class AppSessionService {
    private user: UserLoginInfoDto;
    private tenant: TenantLoginInfoDto;
    private application: ApplicationInfoDto;

    constructor(
        private _sessionService: SessionServiceProxy,
        private _abpMultiTenancyService: AbpMultiTenancyService
    ) {
        abp.event.on('profilePictureChanged', (thumbnailId) => {
            this.user.profileThumbnailId = thumbnailId;
        });
    }

    get isLendspaceDemoUser() {  //!!VP should be added corresponding permissions for such case (temp solution)
        return this.user && this.user.userName == 'demo@lendspace.com';
    }

    get userId(): number {
        return this.user ? this.user.id : null;
    }

    get tenantName(): string {
        return this.tenant ? this.tenant.name : '';
    }

    get tenancyName(): string {
        return this.tenant ? this.tenant.tenancyName : '';
    }

    get tenantId(): number {
        return this.tenant ? this.tenant.id : null;
    }

    get layoutType(): string {
        return this.tenant && this.tenant.customLayoutType ? this.tenant.customLayoutType : LayoutType.Default;
    }

    getShownLoginName(): string {
        const userName = this.user.userName;
        if (!this._abpMultiTenancyService.isEnabled) {
            return userName;
        }

        return (this.tenant ? this.tenant.tenancyName : '.') + '\\' + userName;
    }

    getShownLoginInfo(): { fullName, email, tenantName?} {
        let info: { fullName, email, tenantName? } = {
            fullName: this.user && (this.user.name + ' ' + this.user.surname),
            email: this.user && this.user.emailAddress
        };

        if (this._abpMultiTenancyService.isEnabled) {
            info.tenantName = this.tenant ? this.tenant.name : 'Host';
        }

        return info;
    }

    init(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let updateLoginInfo = (result) => {
                this.application = result.application;
                this.user = result.user;
                this.tenant = result.tenant;
                resolve(true);
            };

            let generalInfo = window['generalInfo'];
            if (generalInfo && generalInfo.loginInfo)
                updateLoginInfo(generalInfo.loginInfo);
            else
                this._sessionService.getCurrentLoginInformations().subscribe(updateLoginInfo.bind(this), (err) => {
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

    private isCurrentTenant(tenantId?: number) {
        if (!tenantId && this.tenant) {
            return false;
        } else if (tenantId && (!this.tenant || this.tenant.id !== tenantId)) {
            return false;
        }

        return true;
    }
}
