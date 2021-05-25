/** Core imports */
import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

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
        private activatedRoute: ActivatedRoute,
        private loginService: LoginService,
        public ls: AppLocalizationService
    ) {
        this.activatedRoute.queryParamMap.pipe(
            first()
        ).subscribe((paramsMap: ParamMap) => {
            this.isExtLogin = paramsMap.get('extlogin') == 'true';
        });
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
                    this.isEmailSent = true;
                }
            );
        }
    }
}
