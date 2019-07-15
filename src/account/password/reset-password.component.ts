import {
    Component,
    ComponentFactoryResolver,
    Directive,
    HostBinding,
    Injector,
    OnInit,
    Type,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    AccountServiceProxy,
    PasswordComplexitySetting,
    ProfileServiceProxy,
    TenantLoginInfoDtoCustomLayoutType
} from '@shared/service-proxies/service-proxies';
import { LoginService } from '../login/login.service';
import { ResetPasswordModel } from './reset-password.model';
import { LendSpaceResetPasswordComponent } from './layouts/lend-space/lend-space-reset-password.component';
import { AdvicePeriodResetPasswordComponent } from './layouts/advice-period/advice-period-reset-password.component';
import { BankCodeResetPasswordComponent } from './layouts/bank-code/bank-code-reset-password.component';
import { HostResetPasswordComponent } from './layouts/host/host-reset-password.component';

@Directive({
    selector: '[ad-reset-password-host]'
})
export class AdResetPasswordHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    templateUrl: './reset-password.component.html',
    animations: [accountModuleAnimation()],
    styleUrls: [
        './reset-password.component.less'
    ],
})
export class ResetPasswordComponent extends AppComponentBase implements OnInit {
    @ViewChild(AdResetPasswordHostDirective) adResetPasswordHost: AdResetPasswordHostDirective;

    @HostBinding('class.lend-space') lendSpaceWrapper = this._appSessionService.tenant && this._appSessionService.tenant.customLayoutType === TenantLoginInfoDtoCustomLayoutType.LendSpace;
    model: ResetPasswordModel = new ResetPasswordModel();
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    saving = false;

    constructor(
        injector: Injector,
        private _accountService: AccountServiceProxy,
        private _loginService: LoginService,
        private _appSessionService: AppSessionService,
        private _profileService: ProfileServiceProxy,
        private _componentFactoryResolver: ComponentFactoryResolver
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.loadLayoutComponent(this.getLayoutComponent(this._appSessionService.tenant));
    }

    private getLayoutComponent(tenant) {
        switch (tenant && tenant.customLayoutType) {
            case TenantLoginInfoDtoCustomLayoutType.LendSpace:
                return LendSpaceResetPasswordComponent;
            case TenantLoginInfoDtoCustomLayoutType.AdvicePeriod:
                return AdvicePeriodResetPasswordComponent;
            case TenantLoginInfoDtoCustomLayoutType.BankCode:
                return BankCodeResetPasswordComponent;
            default:
                return HostResetPasswordComponent;
        }
    }

    private loadLayoutComponent(component: Type<HostResetPasswordComponent>) {
        this.adResetPasswordHost.viewContainerRef.createComponent(
            this._componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}
