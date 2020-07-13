/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import * as moment from 'moment';

@Component({
    templateUrl: './rapid-layout.component.html',
    styleUrls: ['./rapid-layout.component.less']
})
export class RapidLayoutComponent implements OnInit {
    currentYear: number = moment().year();
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
