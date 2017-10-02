import { Component, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AccountServiceProxy, SendPasswordResetCodeInput, SendPasswordResetCodeOutput } from '@shared/service-proxies/service-proxies';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { LoginService } from "account/login/login.service";

@Component({
    templateUrl: './forgot-password.component.html',
    animations: [accountModuleAnimation()]
})
export class ForgotPasswordComponent extends AppComponentBase {

    model: SendPasswordResetCodeInput = new SendPasswordResetCodeInput();

    saving: boolean = false;

    constructor (
        injector: Injector, 
        private _loginService: LoginService,
        private _appUrlService: AppUrlService,
        private _router: Router
        ) {
        super(injector);
    }

    save(): void {
        this.saving = true;

        this._loginService.resetPasswordModel = this.model;
        this._loginService.sendPasswordResetCode(() => { this.saving = false; }, true);
    }
}