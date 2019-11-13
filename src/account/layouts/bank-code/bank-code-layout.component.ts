/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import * as moment from 'moment';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: './bank-code-layout.component.html',
    styleUrls: [
        './bank-code-dialog.component.less',
        './bank-code-layout.component.less',
        '../../../shared/aviano-sans-font.less'
    ]
})
export class BankCodeLayoutComponent implements OnInit {
    currentYear: number = moment().year();
    tenantName = AppConsts.defaultTenantName;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    originUrl = location.origin;

    constructor(
        private appSession: AppSessionService
    ) {}

    ngOnInit(): void {
        let tenant = this.appSession.tenant;
        if (tenant)
            this.tenantName = tenant.name || tenant.tenancyName;
    }
}
