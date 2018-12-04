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
import {LendSpaceForgotPasswordComponent} from '@root/account/password/layouts/lend-space/lend-space-forgot-password.component';
import {HostForgotPasswordComponent} from '@root/account/password/layouts/host/host-forgot-password.component';

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
        let tenant = this._appSession.tenant;
        this.loadLayoutComponent(tenant && (tenant.customLayoutType == TenantLoginInfoDtoCustomLayoutType.LendSpace)
            ? LendSpaceForgotPasswordComponent : HostForgotPasswordComponent);
    }

    private loadLayoutComponent(component: Type<HostForgotPasswordComponent>) {
        this.adForgotPasswordHost.viewContainerRef.createComponent(
            this._componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}
