import {Component, Injector, ViewChild} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { SendPasswordResetCodeInput } from '@shared/service-proxies/service-proxies';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { LoginService } from 'account/login/login.service';
import { AppConsts } from '@shared/AppConsts';
import { AdAutoLoginHostDirective } from '../../../auto-login/auto-login.component';

@Component({
    templateUrl: './host-forgot-password.component.html',
    animations: [accountModuleAnimation()]
})
export class HostForgotPasswordComponent extends AppComponentBase {
    @ViewChild('forgotPassForm', { static: true }) form;
    model: SendPasswordResetCodeInput = new SendPasswordResetCodeInput();
    saving = false;
    emailRegex = AppConsts.regexPatterns.email;
    constructor (
        injector: Injector,
        private _loginService: LoginService
    ) {
        super(injector);
    }

    save(): void {
        if (this.form.valid) {
            this.saving = true;
            this._loginService.resetPasswordModel = this.model;
            this._loginService.sendPasswordResetCode(() => { this.saving = false; }, true);
        }
    }
}
