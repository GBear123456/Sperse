/** Core imports */
import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';

/** Third party imports */
import { first } from 'rxjs/operators';

/** Application imports */
import { SendPasswordResetCodeInput } from '@shared/service-proxies/service-proxies';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { LoginService } from 'account/login/login.service';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './host-forgot-password.component.html',
    styleUrls: [
        './host-forgot-password.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class HostForgotPasswordComponent {
    @ViewChild('forgotPassForm', { static: false }) form;
    model: SendPasswordResetCodeInput = new SendPasswordResetCodeInput();
    saving = false;
    emailRegex = AppConsts.regexPatterns.email;
    isExtLogin: boolean = false;
    isEmailSent: boolean = false;

    constructor (
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private loginService: LoginService,
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

    autoLogin() {
        if (this.form.valid)
            this.router.navigate(['account/auto-login'], 
                {queryParams: {email: this.model.emailAddress, instant: true, extlogin: this.isExtLogin}}
            )
    }

    save(): void {
        if (this.form.valid) {
            this.saving = true;
            this.loginService.resetPasswordModel = this.model;
            this.loginService.sendPasswordResetCode(
                () => {
                    this.saving = false;
                }, true, !this.isExtLogin,
                () => {
                    if (this.isEmailSent = this.isExtLogin)
                        setTimeout(() => {
                            this.router.navigate(['account/login'], 
                                {queryParams: {extlogin: this.isExtLogin}});
                        }, 1000);
                }
            );
        }
    }
}
