/** Core imports */
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { first } from 'rxjs/operators';
import { Observable } from 'rxjs';
import * as moment from 'moment';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AbpSessionService } from 'abp-ng2-module';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { SessionServiceProxy, UpdateUserSignInTokenOutput } from '@shared/service-proxies/service-proxies';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { ExternalLoginProvider, LoginService } from '../../login.service';
import { SettingService } from 'abp-ng2-module';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './host-login.component.html',
    styleUrls: ['./host-login.component.less'],
    animations: [accountModuleAnimation()]
})
export class HostLoginComponent implements OnInit {
    @ViewChild('loginForm') loginForm;
    currentYear: number = moment().year();
    tenantName = AppConsts.defaultTenantName;
    conditions = ConditionsType;
    loginInProgress = false;
    showPassword = false;
    isLoggedIn: boolean = false;
    isExtLogin: boolean = false; 

    linkedIdLoginProvider: ExternalLoginProvider;

    constructor(
        private sessionService: AbpSessionService,
        private sessionAppService: SessionServiceProxy,
        private setting: SettingService,
        private activatedRoute: ActivatedRoute,
        public appSession: AppSessionService,
        public dialog: MatDialog,
        public loginService: LoginService,
        public ls: AppLocalizationService,
        private changeDetectorRef: ChangeDetectorRef
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

            this.loginService.linkedIdLoginProvider$.subscribe((provider: ExternalLoginProvider) => {
                this.linkedIdLoginProvider = provider;

                let exchangeCode = paramsMap.get('code');
                let state = paramsMap.get('state');
                if (!!exchangeCode && !!state) {
                    this.loginService.linkedInLogin(this.linkedIdLoginProvider, exchangeCode, state);
                }

                this.changeDetectorRef.detectChanges();
            });
            
        });
    }

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
        if (this.isExtLogin)
            window.open(this.getApiLink(type), '_blank');
        else
            this.dialog.open(ConditionsModalComponent, 
                { panelClass: ['slider', 'footer-slider'], data: { type: type }}
            );
    }

    getApiLink(type: ConditionsType) {
        return AppConsts.remoteServiceBaseUrl + '/api/TenantCustomization/Get' + 
            (type == ConditionsType.Policies ? 'PrivacyPolicy' : 'TermsOfService') + 
            'Document?tenantId=' + this.appSession.tenant.id;
    }

    login(): void {
        if (this.loginForm.valid) {
            this.loginInProgress = true;
            this.loginService.authenticate(() => { 
                this.loginInProgress = false;
            }, undefined, true, this.isExtLogin, (result) => {
                if (this.isLoggedIn = this.isExtLogin) {
                    if (!result.shouldResetPassword)
                        this.loginService.completeSourceEvent();                
                }
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