import { Component, Injector, OnInit } from '@angular/core';
import {
    TenantSubscriptionServiceProxy, CompleteTenantRegistrationInput, CompleteTenantRegistrationOutput, TenantHostType
} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { LoginService } from './../login/login.service';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { finalize } from 'rxjs/operators';

@Component({
    templateUrl: './complete-tenant-registration.component.html',
    styleUrls: ['./complete-tenant-registration.component.less',],
    animations: [accountModuleAnimation()],
    providers: [TenantSubscriptionServiceProxy]
})
export class CompleteTenantRegistrationComponent extends AppComponentBase implements OnInit {
    model: CompleteTenantRegistrationInput = new CompleteTenantRegistrationInput();

    constructor(
        injector: Injector,
        private _appUrlService: AppUrlService,
        public loginService: LoginService,
        private _tenantSubscriptionService: TenantSubscriptionServiceProxy,
        private _authService: AppAuthService
    ) {
        super(injector);
    }

    ngOnInit() {
        this._authService.logout(false);
        abp.multiTenancy.setTenantIdCookie(null);
        this.model.requestXref = this._activatedRoute.snapshot.queryParams['leadRequestXref'];
        this.registerTenant();
    }

    save(): void {
        this.registerTenant();
    }

    registerTenant(): void {
        this.model.adminPassword = this.generatePassword();
        this.model.tenantHostType = <any>TenantHostType.PlatformApp;
        this.startLoading(true);
        this._tenantSubscriptionService.completeTenantRegistration(this.model)
            .pipe(finalize(() => { this.finishLoading(true); }))
            .subscribe((result: CompleteTenantRegistrationOutput) => {
                this.notify.success(this.l('SuccessfullyRegistered'));
                this.login(result);
            });
    }

    login(registrationResult: CompleteTenantRegistrationOutput): void {

        this.loginService.authenticateModel.userNameOrEmailAddress = registrationResult.emailAddress;
        this.loginService.authenticateModel.password = this.model.adminPassword;

        abp.multiTenancy.setTenantIdCookie(registrationResult.tenantId);
        this.loginService.authenticate(() => { }, undefined, false);
    }

    generatePassword(): string {
        let number = Math.random();
        let result = number.toString(36).substring(6);
        return result;
    }
}
