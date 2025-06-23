<<<<<<< HEAD
/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: './hoa-layout.component.html',
    styleUrls: ['./hoa-layout.component.less']
})
export class HoaLayoutComponent implements OnInit {
    tenantName = AppConsts.defaultTenantName;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    originUrl = location.origin;

    constructor(
        public appSession: AppSessionService
    ) {}

    ngOnInit(): void {
        let tenant = this.appSession.tenant;
        if (tenant)
            this.tenantName = tenant.name || tenant.tenancyName;
    }
}
=======
/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: './hoa-layout.component.html',
    styleUrls: ['./hoa-layout.component.less']
})
export class HoaLayoutComponent implements OnInit {
    tenantName = AppConsts.defaultTenantName;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    originUrl = location.origin;

    constructor(
        public appSession: AppSessionService
    ) {}

    ngOnInit(): void {
        let tenant = this.appSession.tenant;
        if (tenant)
            this.tenantName = tenant.name || tenant.tenancyName;
    }
}
>>>>>>> f999b481882149d107812286d0979872df712626
