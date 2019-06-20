import {
    Component,
    Directive,
    Injector,
    Type,
    OnInit,
    ViewChild,
    ViewContainerRef,
    ComponentFactoryResolver
} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { SendPasswordResetCodeInput, TenantLoginInfoDtoCustomLayoutType } from '@shared/service-proxies/service-proxies';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { LoginService } from 'account/login/login.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LendSpaceForgotPasswordComponent } from './layouts/lend-space/lend-space-forgot-password.component';
import { AdvicePeriodForgotPasswordComponent } from './layouts/advice-period/advice-period-forgot-password.component';
import { HostForgotPasswordComponent } from '@root/account/password/layouts/host/host-forgot-password.component';

@Directive({
    selector: '[ad-forgot-password-host]'
})
export class AdForgotPasswordHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    templateUrl: './forgot-password.component.html',
    animations: [accountModuleAnimation()]
})
export class ForgotPasswordComponent extends AppComponentBase implements OnInit {
    @ViewChild(AdForgotPasswordHostDirective) adForgotPasswordHost: AdForgotPasswordHostDirective;
    model: SendPasswordResetCodeInput = new SendPasswordResetCodeInput();

    saving = false;

    constructor (
        injector: Injector,
        private _loginService: LoginService,
        private _appSession: AppSessionService,
        private _componentFactoryResolver: ComponentFactoryResolver
    ) {
        super(injector);
    }


    ngOnInit() {
        this.loadLayoutComponent(this.getLayoutComponent(this._appSession.tenant));
    }

    private getLayoutComponent(tenant) {
        switch (tenant && tenant.customLayoutType) {
            case TenantLoginInfoDtoCustomLayoutType.LendSpace:
                return LendSpaceForgotPasswordComponent;
            case TenantLoginInfoDtoCustomLayoutType.AdvicePeriod:
                return AdvicePeriodForgotPasswordComponent;
            default:
                return HostForgotPasswordComponent;
        }
    }

    private loadLayoutComponent(component: Type<HostForgotPasswordComponent>) {
        this.adForgotPasswordHost.viewContainerRef.createComponent(
            this._componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}
