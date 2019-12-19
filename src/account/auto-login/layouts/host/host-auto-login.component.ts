/** Core imports */
import { Component, Injector, OnInit } from '@angular/core';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
    templateUrl: './host-auto-login.component.html',
    styleUrls: [
        './host-auto-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class HostAutoLoginComponent implements OnInit {
    conditions = ConditionsType;
    tenantName = this.appSession.tenant
        ? this.appSession.tenant.name
        : AppConsts.defaultTenantName;
    userEmail: string;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        private appSession: AppSessionService
    ) {

    }

    ngOnInit(): void {
    }

    login(): void {
    }

    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, { panelClass: ['slider', 'footer-slider'], data: { type: type }});
    }
}