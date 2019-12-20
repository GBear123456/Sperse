/** Core imports */
import { Component, Injector } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MatDialog } from '@angular/material/dialog';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import {
    SendAutoLoginLinkInput,
    AccountServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './host-auto-login.component.html',
    styleUrls: [
        './host-auto-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class HostAutoLoginComponent {
    isLinkSent = false;
    conditions = ConditionsType;
    tenantName = this.appSession.tenant
        ? this.appSession.tenant.name
        : AppConsts.defaultTenantName;
    userEmail: string;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        private accountProxy: AccountServiceProxy,
        private appSession: AppSessionService
    ) {

    }

    sendloginLink(): void {
        abp.ui.setBusy();
        this.accountProxy.sendAutoLoginLink(new SendAutoLoginLinkInput({
            emailAddress: this.userEmail,
            autoDetectTenancy: true,
            appRoute: UrlHelper.getInitialUrlRelativePath(),
            features: [],
        })).pipe(
            finalize(() => abp.ui.clearBusy())
        ).subscribe(() => this.isLinkSent = true);
    }

    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, { panelClass: ['slider', 'footer-slider'], data: { type: type }});
    }
}