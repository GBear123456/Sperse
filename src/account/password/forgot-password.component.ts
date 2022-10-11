/**  Core imports */
import {
    Component,
    Directive,
    Type,
    OnInit,
    ViewChild,
    ViewContainerRef,
    ComponentFactoryResolver
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Application imports */
import { SendPasswordResetCodeInput, LayoutType } from '@shared/service-proxies/service-proxies';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { LoginService } from 'account/login/login.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LendSpaceForgotPasswordComponent } from './layouts/lend-space/lend-space-forgot-password.component';
import { AdvicePeriodForgotPasswordComponent } from './layouts/advice-period/advice-period-forgot-password.component';
import { BankCodeForgotPasswordComponent } from './layouts/bank-code/bank-code-forgot-password.component';
import { HostForgotPasswordComponent } from '@root/account/password/layouts/host/host-forgot-password.component';
import { RapidForgotPasswordComponent } from "@root/account/password/layouts/rapid/rapid-forgot-password.component";
import { HoaForgotPasswordComponent } from "@root/account/password/layouts/hoa/hoa-forgot-password.component";
import { SperserForgotPasswordComponent } from '@root/account/password/layouts/sperser/sperser-forgot-password.component';
import { HostCombinedForgotPasswordComponent } from './layouts/host/host-combined-forgot-password.component';

@Directive({
    selector: '[ad-forgot-password-host]'
})
export class AdForgotPasswordHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

type ForgotPasswordLayoutBase = Type<HostForgotPasswordComponent | HostCombinedForgotPasswordComponent>

@Component({
    templateUrl: './forgot-password.component.html',
    animations: [accountModuleAnimation()]
})
export class ForgotPasswordComponent implements OnInit {
    @ViewChild(AdForgotPasswordHostDirective, { static: true }) adForgotPasswordHost: AdForgotPasswordHostDirective;
    model: SendPasswordResetCodeInput = new SendPasswordResetCodeInput();
    saving = false;

    layoutComponent: ForgotPasswordLayoutBase;

    constructor (
        private loginService: LoginService,
        private appSession: AppSessionService,
        private activatedRoute: ActivatedRoute,
        private componentFactoryResolver: ComponentFactoryResolver
    ) {
        let activeRouteChild = this.activatedRoute.snapshot;
        if (activeRouteChild) {
            let data = activeRouteChild.routeConfig.data;
            this.layoutComponent = data && data.layoutComponent;
        }
    }

    ngOnInit() {
        if (!this.layoutComponent)
            this.layoutComponent = this.getLayoutComponent(this.appSession.tenant);
        this.loadLayoutComponent(this.layoutComponent);
    }

    private getLayoutComponent(tenant): ForgotPasswordLayoutBase {
        switch (tenant && tenant.customLayoutType) {
            case LayoutType.LendSpace:
                return LendSpaceForgotPasswordComponent;
            case LayoutType.AdvicePeriod:
                return AdvicePeriodForgotPasswordComponent;
            case LayoutType.BankCode:
                return BankCodeForgotPasswordComponent;
            case LayoutType.Rapid:
                return RapidForgotPasswordComponent;
            case LayoutType.HOA:
                return HoaForgotPasswordComponent;
            case LayoutType.Sperser:
                return SperserForgotPasswordComponent;
            default:
                return HostCombinedForgotPasswordComponent;
        }
    }

    private loadLayoutComponent(component: ForgotPasswordLayoutBase) {
        this.adForgotPasswordHost.viewContainerRef.createComponent(
            this.componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}