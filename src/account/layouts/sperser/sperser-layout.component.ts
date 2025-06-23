/** Core imports */
import { Component, ViewEncapsulation, OnInit } from '@angular/core';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';

@Component({
    templateUrl: './sperser-layout.component.html',
    styleUrls: ['./sperser-layout.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class SperserLayoutComponent implements OnInit {
    tenantName = AppConsts.defaultTenantName;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    originUrl = location.origin;
    conditions = ConditionsType;

    constructor(
        public appSession: AppSessionService,
        public conditionsModalService: ConditionsModalService
    ) { }

    ngOnInit(): void {
        let tenant = this.appSession.tenant;
        if (tenant)
            this.tenantName = tenant.name || tenant.tenancyName;
    }

    openConditionsDialog(type: ConditionsType) {
        this.conditionsModalService.openModal({
            panelClass: ['slider', 'footer-slider'],
            data: { type: type }
        });
    }
}
