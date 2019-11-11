/** Core imports */
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import isEqual from 'lodash/isEqual';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    AccountServiceProxy,
    PasswordComplexitySetting,
    ProfileServiceProxy,
    ResetPasswordOutput,
    ResolveTenantIdInput
} from '@shared/service-proxies/service-proxies';
import { LoginService } from 'account/login/login.service';
import { ResetPasswordModel } from '../../reset-password.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './host-reset-password.component.html',
    animations: [ accountModuleAnimation() ]
})
export class HostResetPasswordComponent implements OnInit {
    @ViewChild('resetPassForm') form;
    model: ResetPasswordModel = new ResetPasswordModel();
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    saving = false;

    constructor(
        private accountService: AccountServiceProxy,
        private loginService: LoginService,
        private appSessionService: AppSessionService,
        private profileService: ProfileServiceProxy,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        public ls: AppLocalizationService
    ) {}

    ngOnInit(): void {
        if (this.activatedRoute.snapshot.queryParams['c']) {
            this.model.c = this.activatedRoute.snapshot.queryParams['c'];

            this.accountService.resolveTenantId(new ResolveTenantIdInput({c: this.model.c})).subscribe((tenantId: number) => {
                if (isEqual(tenantId, {})) tenantId = null; // hack for host tenant

                this.appSessionService.changeTenantIfNeeded(
                    tenantId, false
                );

                this.profileService.getPasswordComplexitySetting().subscribe(result => {
                    this.passwordComplexitySetting = result.setting;
                });
            });
        } else {
            this.model.userId = this.activatedRoute.snapshot.queryParams['userId'];
            this.model.resetCode = this.activatedRoute.snapshot.queryParams['resetCode'];
            let tenantId = this.activatedRoute.snapshot.queryParams['tenantId'];
            tenantId && this.appSessionService.changeTenantIfNeeded(
                this.parseTenantId(tenantId), false
            );
        }
    }

    save(): void {
        if (this.form.valid) {
            this.saving = true;
            this.accountService.resetPassword(this.model)
                .subscribe(
                    (result: ResetPasswordOutput) => {
                        if (!result.canLogin) {
                            this.router.navigate(['account/login']);
                            return;
                        }

                        // Autheticate
                        this.saving = true;
                        this.loginService.authenticateModel.userNameOrEmailAddress = result.userName;
                        this.loginService.authenticateModel.password = this.model.password;
                        this.loginService.authenticate(() => {
                            this.saving = false;
                        }, undefined, !this.model.resetCode);
                    },
                    () => { this.saving = false; }
                );
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
