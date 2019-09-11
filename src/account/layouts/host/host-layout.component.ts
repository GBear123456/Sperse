/** Core imports */
import { Component, Injector, OnInit } from '@angular/core';

/** Third party imports */
import * as moment from 'moment';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { environment } from '@root/environments/environment';

@Component({
    templateUrl: './host-layout.component.html',
    styleUrls: [
        './host-layout.component.less'
    ]
})
export class HostLayoutComponent extends AppComponentBase implements OnInit {
    currentYear: number = moment().year();
    tenantName = AppConsts.defaultTenantName;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    originUrl = location.origin;

    constructor(
        injector: Injector,
        private _appSession: AppSessionService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        let tenant = this._appSession.tenant;
        if (tenant)
            this.tenantName = tenant.name || tenant.tenancyName;

        if (abp.session.multiTenancySide == abp.multiTenancy.sides.HOST)
            this.originUrl = environment.publicUrl;
    }
}