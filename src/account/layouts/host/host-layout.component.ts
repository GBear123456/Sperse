/** Core imports */
import { Component, Injector, OnInit } from '@angular/core';

/** Third party imports */
import * as moment from 'moment';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { environment } from '@root/environments/environment';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './host-layout.component.html',
    styleUrls: [
        './host-layout.component.less'
    ]
})
export class HostLayoutComponent implements OnInit {
    currentYear: number = moment().year();
    tenantName = AppConsts.defaultTenantName;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    originUrl = location.origin;

    constructor(
        private appSession: AppSessionService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit(): void {
        let tenant = this.appSession.tenant;
        if (tenant)
            this.tenantName = tenant.name || tenant.tenancyName;

        if (abp.session.multiTenancySide == abp.multiTenancy.sides.HOST)
            this.originUrl = environment.publicUrl;
    }
}
