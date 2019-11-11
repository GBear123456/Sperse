import { Component, OnInit } from '@angular/core';
import { CanActivate } from '@angular/router';
import { LoginService } from './login.service';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { TenantModel } from 'shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './select-tenant.component.html',
    styleUrls: ['./select-tenant.component.less'],
    animations: [ accountModuleAnimation() ]
})
export class SelectTenantComponent implements CanActivate, OnInit {

    tenants?: TenantModel[] = [];
    saving = false;

    constructor(
        public loginService: LoginService,
        public ls: AppLocalizationService
    ) {}

    canActivate(): boolean {
        return true;
    }

    ngOnInit(): void {
        if (this.loginService.resetPasswordResult) {
            this.tenants = this.loginService.resetPasswordResult.detectedTenancies;
        } else {
            if (this.loginService.authenticateResult) {
                this.tenants = this.loginService.authenticateResult.detectedTenancies;
            }
        }
    }

    submit(tenantId?: number): void {
        this.saving = true;
        abp.multiTenancy.setTenantIdCookie(tenantId);
        if (this.loginService.resetPasswordResult) {
            this.loginService.sendPasswordResetCode(() => { this.saving = false; }, false);
        } else {
            if (this.loginService.authenticateResult) {
                this.loginService.authenticate(() => { this.saving = false; }, undefined, false);
            }
        }
    }
}
