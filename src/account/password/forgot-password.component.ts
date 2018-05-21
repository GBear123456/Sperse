import { Component, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { SendPasswordResetCodeInput } from '@shared/service-proxies/service-proxies';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { LoginService } from 'account/login/login.service';

@Component({
    templateUrl: './forgot-password.component.html',
    animations: [accountModuleAnimation()]
})
export class ForgotPasswordComponent extends AppComponentBase {

    model: SendPasswordResetCodeInput = new SendPasswordResetCodeInput();

    saving = false;

    constructor (
        injector: Injector,
        private _loginService: LoginService
    ) {
        super(injector);
    }

    save(): void {
        this.saving = true;

        this._loginService.resetPasswordModel = this.model;
        this._loginService.sendPasswordResetCode(() => { this.saving = false; }, true);
    }
}
