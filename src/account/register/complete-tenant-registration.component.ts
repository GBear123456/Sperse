import { Component, Injector, OnInit, } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TenantRegistrationServiceProxy, CompleteTenantRegistrationInput, CompleteTenantRegistrationOutput, TenantHostType } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { LoginService } from './../login/login.service';
import { AppAuthService } from '@shared/common/auth/app-auth.service';

@Component({
    templateUrl: './complete-tenant-registration.component.html',
    animations: [accountModuleAnimation()]
})
export class CompleteTenantRegistrationComponent extends AppComponentBase implements OnInit {

    model: CompleteTenantRegistrationInput = new CompleteTenantRegistrationInput();

    saving = false;

    constructor(
        injector: Injector,
        private _router: Router,
        private _appUrlService: AppUrlService,
        private _activatedRoute: ActivatedRoute,
        public loginService: LoginService,
        private _tenantRegistrationService: TenantRegistrationServiceProxy,
        private _authService: AppAuthService
    ) {
        super(injector);
    }

    ngOnInit() {
        this._authService.logout(false);
        this.model.leadRequestXref = this._activatedRoute.snapshot.queryParams['leadRequestXref'];
        this.registerTenant();
    }

    save(): void {
        this.registerTenant();
    }

    registerTenant(): void {
        this.model.adminPassword = this.generatePassword();
        this.model.tenantHostType = <any>TenantHostType.PlatformUi;
        this.saving = true;
        this.startLoading(true);
        this._tenantRegistrationService.completeTenantRegistration(this.model)
            .finally(() => { this.saving = false; this.finishLoading(true); })
            .subscribe((result: CompleteTenantRegistrationOutput) => {
                this.notify.success(this.l('SuccessfullyRegistered'));
                this.login(result);
            });
    }

    login(registrationResult: CompleteTenantRegistrationOutput): void {

        this.loginService.authenticateModel.userNameOrEmailAddress = registrationResult.emailAddress;
        this.loginService.authenticateModel.password = this.model.adminPassword;

        abp.multiTenancy.setTenantIdCookie(registrationResult.tenantId);
        this.loginService.authenticate(() => { this.saving = false; });
    }

    generatePassword(): string {
        let number = Math.random();
        let result = number.toString(36).substring(6);
        return result;
    }
}
