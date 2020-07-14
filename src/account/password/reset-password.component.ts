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
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    AccountServiceProxy,
    PasswordComplexitySetting,
    ProfileServiceProxy,
    LayoutType
} from '@shared/service-proxies/service-proxies';
import { LoginService } from '../login/login.service';
import { ResetPasswordModel } from './reset-password.model';
import { LendSpaceResetPasswordComponent } from './layouts/lend-space/lend-space-reset-password.component';
import { AdvicePeriodResetPasswordComponent } from './layouts/advice-period/advice-period-reset-password.component';
import { BankCodeResetPasswordComponent } from './layouts/bank-code/bank-code-reset-password.component';
import { HostResetPasswordComponent } from './layouts/host/host-reset-password.component';
import { RapidResetPasswordComponent } from "@root/account/password/layouts/rapid/rapid-reset-password.component";

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
export class ResetPasswordComponent implements OnInit {
    @ViewChild(AdResetPasswordHostDirective, { static: true }) adResetPasswordHost: AdResetPasswordHostDirective;

    @HostBinding('class.lend-space') lendSpaceWrapper = this.appSessionService.tenant && this.appSessionService.tenant.customLayoutType === LayoutType.LendSpace;
    model: ResetPasswordModel = new ResetPasswordModel();
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    saving = false;

    constructor(
        private accountService: AccountServiceProxy,
        private loginService: LoginService,
        private appSessionService: AppSessionService,
        private profileService: ProfileServiceProxy,
        private componentFactoryResolver: ComponentFactoryResolver
    ) {}

    ngOnInit(): void {
        this.loadLayoutComponent(this.getLayoutComponent(this.appSessionService.tenant));
    }

    private getLayoutComponent(tenant) {
        switch (tenant && tenant.customLayoutType) {
            case LayoutType.LendSpace:
                return LendSpaceResetPasswordComponent;
            case LayoutType.AdvicePeriod:
                return AdvicePeriodResetPasswordComponent;
            case LayoutType.BankCode:
                return BankCodeResetPasswordComponent;
            case LayoutType.Rapid:
                return RapidResetPasswordComponent;
            default:
                return HostResetPasswordComponent;
        }
    }

    private loadLayoutComponent(component: Type<HostResetPasswordComponent>) {
        this.adResetPasswordHost.viewContainerRef.createComponent(
            this.componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}
