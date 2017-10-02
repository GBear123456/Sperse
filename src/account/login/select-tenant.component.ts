import { Component, Injector, OnInit, OnDestroy } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { LoginService } from './login.service';
import { Observable } from 'rxjs/Rx';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { TenantModel } from "shared/service-proxies/service-proxies";

@Component({
    templateUrl: './select-tenant.component.html',
    styleUrls: ['./select-tenant.component.less'],
    animations: [accountModuleAnimation()]
})
export class SelectTenantComponent extends AppComponentBase implements CanActivate, OnInit, OnDestroy {

    tenants?: TenantModel[] = [];

    saving: boolean = false;

    constructor(
        injector: Injector,
        public loginService: LoginService,
        private _router: Router
    ) {
        super(injector);
    }

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

    ngOnDestroy(): void {

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