import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { SendTwoFactorAuthCodeModel, TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { LoginService } from './login.service';
import { finalize } from 'rxjs/operators';
import { Subscription, timer } from 'rxjs';

@Component({
    templateUrl: './send-two-factor-code.component.html',
    animations: [accountModuleAnimation()]
})
export class SendTwoFactorCodeComponent extends AppComponentBase implements CanActivate, OnInit, OnDestroy {

    selectedTwoFactorProvider: string;
    submitting = false;
    remainingSeconds = 90;
    timerSubscription: Subscription;

    constructor(
        injector: Injector,
        public loginService: LoginService,
        private _tokenAuthService: TokenAuthServiceProxy,
        private _router: Router
    ) {
        super(injector);
    }

    canActivate(): boolean {
        if (this.loginService.authenticateModel &&
            this.loginService.authenticateResult &&
            this.loginService.authenticateResult.twoFactorAuthProviders &&
            this.loginService.authenticateResult.twoFactorAuthProviders.length
            ) {
            return true;
        }

        return false;
    }

    ngOnInit(): void {
        this.selectedTwoFactorProvider = this.loginService.authenticateResult.twoFactorAuthProviders[0];

        const timerSource = timer(1000, 1000);
        this.timerSubscription = timerSource.subscribe(() => {
            this.remainingSeconds = this.remainingSeconds - 1;
            if (this.remainingSeconds <= 0) {
                this.message.warn(this.l('TimeoutPleaseTryAgain')).done(() => {
                    this.loginService.authenticateModel.twoFactorVerificationCode = null;
                    this._router.navigate(['account/login']);
                });
            }
        });
    }

    submit(): void {
        const model = new SendTwoFactorAuthCodeModel();
        model.userId = this.loginService.authenticateResult.userId;
        model.provider = this.selectedTwoFactorProvider;

        this.submitting = true;
        this._tokenAuthService
            .sendTwoFactorAuthCode(model)
            .pipe(finalize(() => this.submitting = false))
            .subscribe(() => {
                this._router.navigate(['account/verify-code']);
            });
    }

    ngOnDestroy(): void {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
            this.timerSubscription = null;
        }
    }
}
