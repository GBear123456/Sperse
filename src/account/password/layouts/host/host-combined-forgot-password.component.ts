/** Core imports */
import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

/** Third party imports */
import { first, finalize } from 'rxjs/operators';

/** Application imports */
import { AccountServiceProxy, SendAutoLoginLinkInput, TenantModel } from '@shared/service-proxies/service-proxies';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: './host-combined-forgot-password.component.html',
    styleUrls: ['./host-combined-forgot-password.component.less'],
    animations: [accountModuleAnimation()]
})
export class HostCombinedForgotPasswordComponent {
    @ViewChild('forgotPassForm', { static: false }) form;
    model: SendAutoLoginLinkInput = new SendAutoLoginLinkInput();
    emailRegex = AppConsts.regexPatterns.email;
    detectedTenancies: TenantModel[];
    isRequestSent: boolean = false;
    isExtLogin: boolean = false;
 
    constructor (
        private activatedRoute: ActivatedRoute,
        public accountProxy: AccountServiceProxy,
        private appSession: AppSessionService,
        public ls: AppLocalizationService
    ) {
        this.activatedRoute.queryParamMap.pipe(
            first()
        ).subscribe((paramsMap: ParamMap) => {
            this.isExtLogin = paramsMap.get('extlogin') == 'true';
            let email = paramsMap.get('email');
            if (email)
                this.model.emailAddress = email;
        });
    }

    sendRequest(forced?: boolean, tenantId?: number): void {
        if (forced || this.form.valid) {
            abp.ui.setBusy();
            this.model.autoDetectTenancy = isNaN(tenantId);
            if (this.appSession.tenantId)
                tenantId = this.appSession.tenantId;
            abp.multiTenancy.setTenantIdCookie(tenantId);
            this.accountProxy.sendAutoLoginWithReset(this.model).pipe(
                finalize(() => abp.ui.clearBusy())
            ).subscribe(res => {
                if (res && res.detectedTenancies && res.detectedTenancies.length) {
                    this.detectedTenancies = res.detectedTenancies;
                    this.isRequestSent = res.detectedTenancies.length == 1;
                    if (res.detectedTenancies.length == 1) {
                        abp.multiTenancy.setTenantIdCookie(res.detectedTenancies[0].id);
                    }
                }
            });
        }
    }
}
