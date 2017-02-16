import { Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TenantRegistrationServiceProxy, RegisterTenantInput, RegisterTenantOutput, PasswordComplexitySetting, ProfileServiceProxy } from '@shared/service-proxies/service-proxies'
import { AppComponentBase } from '@shared/common/app-component-base';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { TenantRegistrationHelperService } from './tenant-registration-helper.service';

@Component({
    templateUrl: './register-tenant.component.html',
    animations: [accountModuleAnimation()]
})
export class RegisterTenantComponent extends AppComponentBase implements OnInit {

    model: RegisterTenantInput = new RegisterTenantInput();
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();

    saving: boolean = false;

    constructor(
        injector: Injector,
        private _tenantRegistrationService: TenantRegistrationServiceProxy,
        private _router: Router,
        private _profileService: ProfileServiceProxy,
        private _tenantRegistrationHelper: TenantRegistrationHelperService
    ) {
        super(injector);
    }

    ngOnInit() {
        //Prevent to create tenant in a tenant context
        if (this.appSession.tenant != null) {
            this._router.navigate(['account/login']);
            return;
        }

        this._profileService.getPasswordComplexitySetting().subscribe(result => {
            this.passwordComplexitySetting = result.setting;
        });
    }

    get useCaptcha(): boolean {
        return this.setting.getBoolean('App.UserManagement.UseCaptchaOnRegistration');
    }

    save(): void {
        if (this.useCaptcha && !this.model.captchaResponse) {
            this.message.warn(this.l('CaptchaCanNotBeEmpty'));
            return;
        }

        this.saving = true;
        this._tenantRegistrationService.registerTenant(this.model)
            .finally(() => { this.saving = false; })
            .subscribe((result: RegisterTenantOutput) => {
                this.notify.success(this.l('SuccessfullyRegistered'));

                this._tenantRegistrationHelper.registrationResult = result;
                this._router.navigate(['account/register-tenant-result']);
            });
    }

    captchaResolved(captchaResponse: string): void {
        this.model.captchaResponse = captchaResponse;
    }
}