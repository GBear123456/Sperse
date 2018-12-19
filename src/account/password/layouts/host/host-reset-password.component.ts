import {Component, Injector, OnInit, ViewChild} from '@angular/core';
import {accountModuleAnimation} from '@shared/animations/routerTransition';
import {AppComponentBase} from '@shared/common/app-component-base';
import {AppSessionService} from '@shared/common/session/app-session.service';
import {
    AccountServiceProxy,
    PasswordComplexitySetting,
    ProfileServiceProxy,
    ResetPasswordOutput,
    ResolveTenantIdInput
} from '@shared/service-proxies/service-proxies';
import {LoginService} from 'account/login/login.service';
import {ResetPasswordModel} from '../../reset-password.model';
import {finalize} from 'rxjs/operators';
import {isEqual} from 'lodash';

@Component({
    templateUrl: './host-reset-password.component.html',
    animations: [accountModuleAnimation()]
})
export class HostResetPasswordComponent extends AppComponentBase implements OnInit {
    @ViewChild('resetPassForm') form;
    model: ResetPasswordModel = new ResetPasswordModel();
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    saving = false;

    constructor(
        injector: Injector,
        private _accountService: AccountServiceProxy,
        private _loginService: LoginService,
        private _appSessionService: AppSessionService,
        private _profileService: ProfileServiceProxy,
    ) {
        super(injector);
    }

    ngOnInit(): void {
        if (this._activatedRoute.snapshot.queryParams['c']) {
            this.model.c = this._activatedRoute.snapshot.queryParams['c'];

            this._accountService.resolveTenantId(new ResolveTenantIdInput({c: this.model.c})).subscribe((tenantId) => {
                if (isEqual(tenantId, {})) tenantId = null; // hack for host tenant

                this._appSessionService.changeTenantIfNeeded(
                    tenantId
                );

                this._profileService.getPasswordComplexitySetting().subscribe(result => {
                    this.passwordComplexitySetting = result.setting;
                });
            });
        } else {
            this.model.userId = this._activatedRoute.snapshot.queryParams['userId'];
            this.model.resetCode = this._activatedRoute.snapshot.queryParams['resetCode'];
            this._appSessionService.changeTenantIfNeeded(
                this.parseTenantId(
                    this._activatedRoute.snapshot.queryParams['tenantId']
                ), false
            );
        }
    }

    save(): void {
        if (this.form.valid) {
            this.saving = true;
            this._accountService.resetPassword(this.model)
                .subscribe((result: ResetPasswordOutput) => {
                    if (!result.canLogin) {
                        this._router.navigate(['account/login']);
                        return;
                    }

                    // Autheticate
                    this.saving = true;
                    this._loginService.authenticateModel.userNameOrEmailAddress = result.userName;
                    this._loginService.authenticateModel.password = this.model.password;
                    this._loginService.authenticate(() => {
                        this.saving = false;
                    }, undefined, !this.model.resetCode);
                }, () => { this.saving = false; });
        }
    }

    parseTenantId(tenantIdAsStr?: string): number {
        let tenantId = !tenantIdAsStr ? undefined : parseInt(tenantIdAsStr);
        if (tenantId === NaN) {
            tenantId = undefined;
        }

        return tenantId;
    }
}