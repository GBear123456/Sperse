/** Core imports */
import { Component, Injector } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

/** Third party imports */
import { finalize, first } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { LoginService } from '../../../login/login.service';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MatDialog } from '@angular/material/dialog';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import {
    TenantModel,
    SendAutoLoginLinkInput,
    AccountServiceProxy,
    TokenAuthServiceProxy,
    AuthenticateByCodeModel,
    AuthenticateResultModel
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
    detectedTenancies: TenantModel[] = [];
    tenantName = this.appSession.tenant
        ? this.appSession.tenant.name
        : AppConsts.defaultTenantName;
    accessCodeMaxTriesCount = 3;
    accessCodeIsValid: boolean;
    accessCode: string;
    userEmail: string;
    applyButton = [{
        name: 'apply',
        location: 'after',
        options: {
            icon: 'check',
            onClick: () => {
                if (this.accessCodeIsValid)
                    this.authenticateByCode();
                else
                    this.checkAccessCodeMaxTries();
            }
        }
    }];

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        private activatedRoute: ActivatedRoute,
        private accountProxy: AccountServiceProxy,
        private appSession: AppSessionService,
        private authProxy: TokenAuthServiceProxy,
        private loginService: LoginService
    ) {
        this.activatedRoute.queryParams.pipe(first())
            .subscribe((params: Params) => this.userEmail = params.email);
    }

    checkAccessCodeMaxTries(showInvalidMessage = true) {
        this.accessCodeMaxTriesCount--;
        if (this.accessCodeMaxTriesCount > 0) {
            if (showInvalidMessage)
                abp.message.warn(this.ls.l('AutoLoginCodeIsIncorrect'));
        } else
            abp.message.warn(this.ls.l('AutoLoginMaxTriesMessage'));
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
                } else
                    this.isLinkSent = !isNaN(tenantId);
            });
        }
    }

    getAppRoute() {
        let path = UrlHelper.getInitialUrlRelativePath();
        return !path || path.indexOf('auto-login') > 0 ? '' : path;
    }

    authenticateByCode() {
        abp.ui.setBusy();
        this.authProxy.authenticateByCode(new AuthenticateByCodeModel({
            emailAddress: this.userEmail,
            code: this.accessCode
        })).pipe(
            finalize(() => abp.ui.clearBusy())
        ).subscribe((res: AuthenticateResultModel) => {
            this.loginService.processAuthenticateResult(res, AppConsts.appBaseUrl);
        }, () => {
            this.checkAccessCodeMaxTries(false);
        });
    }

    onAutoLoginCodeChanged(event) {
        this.accessCodeIsValid = event.component.option('isValid');
        this.accessCode = event.component.option('value');
        if (event.event.keyCode === 13/*Enter*/) {
            if (this.accessCodeIsValid)
                this.authenticateByCode();
            else
                this.checkAccessCodeMaxTries();
        }
    }

    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, { panelClass: ['slider', 'footer-slider'], data: { type: type }});
    }
}