/** Core imports */
import { Component, OnInit, HostBinding } from '@angular/core';
import { ActivatedRoute, ParamMap, CanActivate, Router } from '@angular/router';

/** Third party imports */
import { first } from 'rxjs/operators';

/** Application imports */
import { LoginService } from './login.service';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { ExternalAuthenticateResultModel, TenantModel } from 'shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AccountComponent } from '../account.component';

@Component({
    templateUrl: './select-tenant.component.html',
    styleUrls: ['./select-tenant.component.less'],
    animations: [ accountModuleAnimation() ]
})
export class SelectTenantComponent implements CanActivate, OnInit {
    @HostBinding('class.unwrapped') isUnWrapped: boolean = false;
    isExtLogin: boolean = false;
    tenants?: TenantModel[] = [];
    saving = false;

    constructor(
        private router: Router,
        private accountComponent: AccountComponent,
        private activatedRoute: ActivatedRoute,
        public loginService: LoginService,
        public ls: AppLocalizationService
    ) {
        this.activatedRoute.queryParamMap.pipe(
            first()
        ).subscribe((paramsMap: ParamMap) => {
            this.isExtLogin = paramsMap.get('extlogin') == 'true';
            this.isUnWrapped = !this.accountComponent.isWrapped;
        });
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

    submit(tenantId?: number): void {
        this.saving = true;
        abp.multiTenancy.setTenantIdCookie(tenantId);
        if (this.loginService.resetPasswordResult) {
            this.loginService.sendPasswordResetCode(() => { this.saving = false; }, false);
        } else {
            if (this.loginService.authenticateResult) {
                let externalAuthResult = this.loginService.authenticateResult as ExternalAuthenticateResultModel;
                if (!!externalAuthResult.providerAccessCode) {
                    this.loginService.externalAuthenticateByResult(externalAuthResult, () => { this.saving = false; }, this.isExtLogin,
                        (result) => {
                            if (this.isExtLogin)
                                location.pathname = '/account/signin';
                        });
                }
                else {
                    this.loginService.authenticate(() => { this.saving = false; }, undefined, false, this.isExtLogin,
                        (result) => {
                            if (this.isExtLogin)
                                location.pathname = '/account/signin';
                        });
                }
            }
        }
    }
}