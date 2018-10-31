import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { CanActivate } from '@angular/router';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Subscription, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoginService } from './login.service';

@Component({
    templateUrl: './validate-two-factor-code.component.html',
    animations: [accountModuleAnimation()]
})
export class ValidateTwoFactorCodeComponent extends AppComponentBase implements CanActivate, OnInit, OnDestroy {

    code: string;
    remainingSeconds = 90;
    timerSubscription: Subscription;
    IsRememberBrowserEnabled: boolean;

    constructor(
        injector: Injector,
        public loginService: LoginService
    ) {
        super(injector);
        this.IsRememberBrowserEnabled = abp.setting.values['Abp.Zero.UserManagement.TwoFactorLogin.IsRememberBrowserEnabled'] === 'true';
    }

    canActivate(): boolean {
        if (this.loginService.authenticateModel &&
            this.loginService.authenticateResult
        ) {
            return true;
        }

        return false;
    }

    ngOnInit(): void {
        const timerSource = timer(1000, 1000);
        this.timerSubscription = timerSource.pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.remainingSeconds = this.remainingSeconds - 1;
            if (this.remainingSeconds <= 0) {
                this.timerSubscription.unsubscribe();
                this.message.warn(this.l('TimeoutPleaseTryAgain')).done(() => {
                    this.loginService.authenticateModel.twoFactorVerificationCode = null;
                    this._router.navigate(['account/login']);
                });
            }
        });
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
    }

    submit(): void {
        this.loginService.authenticateModel.twoFactorVerificationCode = this.code;
        this.loginService.authenticate(() => { }, undefined, false);
    }
}
