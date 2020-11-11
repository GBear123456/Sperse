/** Core imports */
import { Component, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { SessionServiceProxy, UpdateUserSignInTokenOutput } from '@shared/service-proxies/service-proxies';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { ExternalLoginProvider, LoginService } from '../../login.service';
import { SettingService } from '@abp/settings/setting.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './host-login.component.html',
    styleUrls: ['./host-login.component.less'],
    animations: [accountModuleAnimation()]
})
export class HostLoginComponent implements OnInit {
    @ViewChild('loginForm', { static: false }) loginForm;
    currentYear: number = moment().year();
    tenantName = AppConsts.defaultTenantName;
    conditions = ConditionsType;
    loginInProgress = false;
    showPassword = false;

    constructor(
        private sessionService: AbpSessionService,
        private sessionAppService: SessionServiceProxy,
        private setting: SettingService,
        private appSession: AppSessionService,
        public dialog: MatDialog,
        public loginService: LoginService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit(): void {
        let tenant = this.appSession.tenant;
        if (tenant)
            this.tenantName = tenant.name || tenant.tenancyName;
        if (this.sessionService.userId > 0 && UrlHelper.getReturnUrl() && UrlHelper.getSingleSignIn()) {
            this.sessionAppService.updateUserSignInToken()
                .subscribe((result: UpdateUserSignInTokenOutput) => {
                    const initialReturnUrl = UrlHelper.getReturnUrl();
                    location.href = initialReturnUrl + (initialReturnUrl.indexOf('?') >= 0 ? '&' : '?') +
                        'accessToken=' + result.signInToken +
                        '&userId=' + result.encodedUserId +
                        '&tenantId=' + result.encodedTenantId;
                });
        }
    }

    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, { panelClass: ['slider', 'footer-slider'], data: { type: type }});
    }

    login(): void {
        if (this.loginForm.valid) {
            this.loginInProgress = true;
            this.loginService.authenticate(() => { this.loginInProgress = false; });
        }
    }

    externalLogin(provider: ExternalLoginProvider) {
        this.loginService.externalAuthenticate(provider);
    }

    getLoginPlaceholder(): string {
        return abp.session.tenantId ? this.ls.l('UserNameOrEmail') : this.ls.l('EmailAddress');
    }

    showHidePassword(event) {
        this.showPassword = !this.showPassword;
        if (event.currentTarget.text) event.currentTarget.text = this.ls.l((this.showPassword ? 'Hide' : 'Show'));
        this.showPassword
            ? event.currentTarget.classList.add('visible')
            : event.currentTarget.classList.remove('visible');
    }
}
