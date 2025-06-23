/** Core imports */
import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

/** Third party imports */
import { finalize, first } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import {
    TenantModel,
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
    conditions = ConditionsType;
    detectedTenancies: TenantModel[] = [];
    tenantName = this.appSession.appearanceConfig.name || AppConsts.defaultTenantName;
    isLoggedIn: boolean = false;
    isExtLogin: boolean = false;
    isLinkSent: boolean = false;
    userEmail: string;


    constructor(
        public conditionsModalService: ConditionsModalService,
        public ls: AppLocalizationService,
        private activatedRoute: ActivatedRoute,
        private accountProxy: AccountServiceProxy,
        private appSession: AppSessionService
    ) {
        this.activatedRoute.queryParams.pipe(first())
            .subscribe((params: Params) => {
                this.isExtLogin = params.extlogin == 'true';
                this.isLoggedIn = !!this.appSession.user;
                this.userEmail = params.email;
                if (this.userEmail)
                    setTimeout(() => this.sendloginLink());
            });
    }

    getAppRoute() {
        let path = UrlHelper.getInitialUrlRelativePath();
        return !path || path.indexOf('auto-login') > 0 || path.indexOf('forgot-password') > 0 ? '' : path;
    }

    sendloginLink(tenantId?: number): void {
        if (!this.isLinkSent) {
            abp.ui.setBusy();
            if (this.appSession.tenantId)
                tenantId = this.appSession.tenantId;
            abp.multiTenancy.setTenantIdCookie(tenantId);
            this.accountProxy.sendAutoLoginLink(new SendAutoLoginLinkInput({
                emailAddress: this.userEmail,
                autoDetectTenancy: isNaN(tenantId),
                appRoute: this.getAppRoute(),
                features: [],
            })).pipe(
                finalize(() => abp.ui.clearBusy())
            ).subscribe(res => {
                if (res && res.detectedTenancies && res.detectedTenancies.length) {
                    this.detectedTenancies = res.detectedTenancies;
                    this.isLinkSent = res.detectedTenancies.length == 1;
                    if (res.detectedTenancies.length == 1) {
                        abp.multiTenancy.setTenantIdCookie(res.detectedTenancies[0].id);
                    }
                } else
                    this.isLinkSent = !isNaN(tenantId);
            });
        }
    }

    openConditionsDialog(type: ConditionsType) {
        this.conditionsModalService.openModal({
            panelClass: ['slider', 'footer-slider'],
            data: { type: type }
        });
    }
}