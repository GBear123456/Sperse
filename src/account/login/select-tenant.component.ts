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
    tenants?: TenantModel[];

    constructor(
        injector: Injector,
        public loginService: LoginService,
        private _router: Router
    ) {
        super(injector);
    }

    canActivate(): boolean {
        if (this.loginService.authenticateModel
            && this.loginService.authenticateModel.autoDetectTenancy
            && this.loginService.authenticateResult
            && this.loginService.authenticateResult.detectedTenancies.length > 1
        ) {
            return true;
        }

        return false;
    }

    ngOnInit(): void {
        if (this.loginService.authenticateResult){
            this.tenants = this.loginService.authenticateResult.detectedTenancies;
        }
    }

    ngOnDestroy(): void {

    }

    submit(tenantId?: number): void {
        abp.multiTenancy.setTenantIdCookie(tenantId);

        this.loginService.authenticate(() => { }, undefined, false);
    }
}