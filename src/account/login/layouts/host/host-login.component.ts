/** Core imports */
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

/** Third party imports */
import { first } from 'rxjs/operators';
import * as moment from 'moment';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AbpSessionService } from 'abp-ng2-module';
import { ConditionsType } from '@shared/AppEnums';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { SessionServiceProxy, UpdateUserSignInTokenOutput } from '@shared/service-proxies/service-proxies';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { ExternalLoginProvider, LoginService } from '../../login.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { environment } from '@root/environments/environment';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';

@Component({
    templateUrl: './host-login.component.html',
    styleUrls: ['./host-login.component.less'],
    animations: [accountModuleAnimation()]
})
export class HostLoginComponent implements OnInit {
    @ViewChild('loginForm') loginForm;
    currentYear: number = moment().year();
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    tenantName = AppConsts.defaultTenantName;
    conditions = ConditionsType;
    loginInProgress = false;
    showPassword = false;
    isLoggedIn: boolean = false;
    isExtLogin: boolean = false;
    showExternalLogin = false;
    get redirectToSignUp() { return false; }

    constructor(
        private sessionService: AbpSessionService,
        private sessionAppService: SessionServiceProxy,
        private activatedRoute: ActivatedRoute,
        public conditionsModalService: ConditionsModalService,
        public appSession: AppSessionService,
        public loginService: LoginService,
        public ls: AppLocalizationService
    ) {
        this.activatedRoute.queryParamMap.pipe(
            first()
        ).subscribe((paramsMap: ParamMap) => {
            if (this.isExtLogin = paramsMap.get('extlogin') == 'true') {
                if (this.isLoggedIn = !!this.appSession.user)
                    this.loginService.completeSourceEvent();
            }
            let email = paramsMap.get('email');
            if (email)
                this.loginService.authenticateModel.userNameOrEmailAddress = email;

            let exchangeCode = paramsMap.get('code');
            let state = paramsMap.get('state');
            let providerName = paramsMap.get('provider');

            if (!!exchangeCode && !!state)
                this.loginService.oAuth2Login(providerName, exchangeCode, state, this.isExtLogin, this.redirectToSignUp, (result) => {
                    this.isLoggedIn = result.accessToken && this.isExtLogin;
                });
            else if (providerName)
                this.loginService.clearOAuth2Params();
        });
    }

    ngOnInit(): void {
        let tenant = this.appSession.tenant;
        if (tenant)
            this.tenantName = tenant.name || tenant.tenancyName;
        this.showExternalLogin = tenant && (!environment.production || environment.releaseStage == 'staging');
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
        if (this.isExtLogin)
            window.open(this.conditionsModalService.getHtmlUrl(type), '_blank');
        else
            this.conditionsModalService.openModal({
                panelClass: ['slider', 'footer-slider'],
                data: { type: type }
            });
    }

    login(): void {
        if (this.loginForm.valid) {
            this.loginInProgress = true;
            this.loginService.authenticate(() => {
                this.loginInProgress = false;
            }, undefined, true, this.isExtLogin, (result) => {
                this.isLoggedIn = this.isExtLogin;
            });
        }
    }

    externalLogin(provider: ExternalLoginProvider) {
        this.loginService.externalAuthenticate(provider);
    }

    getLoginPlaceholder(): string {
        return abp.session.tenantId ? this.ls.l('UserNameOrEmail') : this.ls.l('EmailAddress');
    }

    showHidePassword(event?) {
        this.showPassword = !this.showPassword;
        if (event) {
            if (event.currentTarget.text)
                event.currentTarget.text = this.ls.l((this.showPassword ? 'Hide' : 'Show'));
            this.showPassword
                ? event.currentTarget.classList.add('visible')
                : event.currentTarget.classList.remove('visible');
        }
    }
}