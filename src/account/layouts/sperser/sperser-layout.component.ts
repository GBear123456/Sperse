/** Core imports */
import { Component, ViewEncapsulation, OnInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';

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
        public dialog: MatDialog
    ) {}

    ngOnInit(): void {
        let tenant = this.appSession.tenant;
        if (tenant)
            this.tenantName = tenant.name || tenant.tenancyName;
    }

    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(
            ConditionsModalComponent,
            {
                panelClass: ['slider', 'footer-slider'],
                data: { type: type }
            }
        );
    }
}
