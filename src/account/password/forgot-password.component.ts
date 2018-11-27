import { Component, HostBinding, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { SendPasswordResetCodeInput, TenantLoginInfoDtoLayoutType } from '@shared/service-proxies/service-proxies';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { LoginService } from 'account/login/login.service';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: './forgot-password.component.html',
    styleUrls: [ './lend-space-password.less' ],
    animations: [accountModuleAnimation()]
})
export class ForgotPasswordComponent extends AppComponentBase {
    @HostBinding('class.lend-space') lendSpaceWrapper = this._appSession.tenant && this._appSession.tenant.layoutType === TenantLoginInfoDtoLayoutType.LendSpace;
    model: SendPasswordResetCodeInput = new SendPasswordResetCodeInput();

    saving = false;

    constructor (
        injector: Injector,
        private _loginService: LoginService,
        private _appSession: AppSessionService
    ) {
        super(injector);
    }

    save(): void {
        this.saving = true;

        this._loginService.resetPasswordModel = this.model;
        this._loginService.sendPasswordResetCode(() => { this.saving = false; }, true);
    }
}
