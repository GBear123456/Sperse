/** Core imports */
import {
    Component,
    Directive,
    OnInit,
    ViewContainerRef,
    ComponentFactoryResolver,
    ViewChild,
    Type
} from '@angular/core';

/** Application imports */
import { AppSessionService } from '@shared/common/session/app-session.service';
import { HostAutoLoginComponent } from './layouts/host/host-auto-login.component';
import { LendSpaceAutoLoginComponent } from './layouts/lend-space/lend-space-auto-login.component';
import { AdvicePeriodAutoLoginComponent } from './layouts/advice-period/advice-period-auto-login.component';
import { BankCodeAutoLoginComponent } from './layouts/bank-code/bank-code-auto-login.component';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { RapidAutoLoginComponent } from './layouts/rapid/rapid-auto-login.component';
import { HoaAutoLoginComponent } from "@root/account/auto-login/layouts/hoa/hoa-auto-login.component";
import { SperserAutoLoginComponent } from '@root/account/auto-login/layouts/sperser/sperser-auto-login.component';

@Directive({
    selector: '[ad-login-host]'
})
export class AdAutoLoginHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    templateUrl: './auto-login.component.html',
    styleUrls: [
        './auto-login.component.less'
    ]
})
export class AutoLoginComponent implements OnInit {
    @ViewChild(AdAutoLoginHostDirective, { static: true }) adLoginHost: AdAutoLoginHostDirective;

    constructor(
        private appSession: AppSessionService,
        private componentFactoryResolver: ComponentFactoryResolver
    ) { }

    ngOnInit(): void {
        this.loadLayoutComponent(this.getLayoutComponent(this.appSession.tenant));
    }

    private getLayoutComponent(tenant) {
        switch (tenant && tenant.customLayoutType) {
            case LayoutType.LendSpace:
                return LendSpaceAutoLoginComponent;
            case LayoutType.AdvicePeriod:
                return AdvicePeriodAutoLoginComponent;
            case LayoutType.BankCode:
                return BankCodeAutoLoginComponent;
            case LayoutType.Rapid:
                return RapidAutoLoginComponent;
            case LayoutType.HOA:
                return HoaAutoLoginComponent;
            case LayoutType.Sperser:
                return SperserAutoLoginComponent;
            default:
                return HostAutoLoginComponent;
        }
    }

    private loadLayoutComponent(component: Type<HostAutoLoginComponent>) {
        this.adLoginHost.viewContainerRef.createComponent(
            this.componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}