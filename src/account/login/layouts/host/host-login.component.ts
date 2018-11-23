/** Core imports */
import { Component, Injector, OnInit } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { SessionServiceProxy, UpdateUserSignInTokenOutput } from '@shared/service-proxies/service-proxies';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { ExternalLoginProvider, LoginService } from '../../login.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
    templateUrl: './host-login.component.html',
    styleUrls: [
        './host-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class HostLoginComponent extends AppComponentBase implements OnInit {
    currentYear: number = moment().year();
    tenantName = AppConsts.defaultTenantName;
    conditions = ConditionsType;

    constructor(
        injector: Injector,
        public loginService: LoginService,
        private _sessionService: AbpSessionService,
        private _sessionAppService: SessionServiceProxy,
        private _appSession: AppSessionService,
        private dialog: MatDialog
    ) {
        super(injector);
    }

    get multiTenancySideIsTeanant(): boolean {
        return this._sessionService.tenantId > 0;
    }

    get isTenantSelfRegistrationAllowed(): boolean {
        return this.setting.getBoolean('App.TenantManagement.AllowSelfRegistration');
    }

    get isSelfRegistrationAllowed(): boolean {
        if (!this._sessionService.tenantId) {
            return false;
        }

        return this.setting.getBoolean('App.UserManagement.AllowSelfRegistration');
    }

    get isTenantRegistrationAllowed(): boolean {
        return this.setting.getBoolean('App.TenantManagement.AllowSelfRegistration');
    }

    ngOnInit(): void {
        let tenant = this._appSession.tenant;
        if (tenant)
            this.tenantName = tenant.name || tenant.tenancyName;
        if (this._sessionService.userId > 0 && UrlHelper.getReturnUrl() && UrlHelper.getSingleSignIn()) {
            this._sessionAppService.updateUserSignInToken()
                .subscribe((result: UpdateUserSignInTokenOutput) => {
                    const initialReturnUrl = UrlHelper.getReturnUrl();
                    const returnUrl = initialReturnUrl + (initialReturnUrl.indexOf('?') >= 0 ? '&' : '?') +
                        'accessToken=' + result.signInToken +
                        '&userId=' + result.encodedUserId +
                        '&tenantId=' + result.encodedTenantId;

                    location.href = returnUrl;
                });
        }
    }

    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: { type: type }});
    }

    login(): void {
        this.loginService.authenticate(() => {});
    }

    externalLogin(provider: ExternalLoginProvider) {
        this.loginService.externalAuthenticate(provider);
    }

    getLoginPlaceholder(): string {
        return abp.session.tenantId ? this.l('UserNameOrEmail') : this.l('EmailAddress');
    }
}