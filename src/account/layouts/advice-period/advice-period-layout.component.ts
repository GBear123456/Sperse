/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import * as moment from 'moment';

@Component({
    templateUrl: './advice-period-layout.component.html',
    styleUrls: [
        './advice-period-layout.component.less'
    ]
})
export class AdvicePeriodLayoutComponent implements OnInit {
    currentYear: number = moment().year();
    tenantName = this.appSession.tenantName || AppConsts.defaultTenantName;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    originUrl = location.origin;

    constructor(
        public appSession: AppSessionService
    ) {}

    ngOnInit(): void {
    }
}
