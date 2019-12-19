/** Core imports */
import { Component, Directive, Injector, OnInit, ViewContainerRef,
    ComponentFactoryResolver, ViewChild, Type  } from '@angular/core';

/** Application imports */
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { HostAutoLoginComponent } from './layouts/host/host-auto-login.component';
import { LendSpaceAutoLoginComponent } from './layouts/lend-space/lend-space-auto-login.component';
import { AdvicePeriodAutoLoginComponent } from './layouts/advice-period/advice-period-auto-login.component';
import { BankCodeAutoLoginComponent } from './layouts/bank-code/bank-code-auto-login.component';
import { LayoutType } from '@shared/service-proxies/service-proxies';

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
    @ViewChild(AdAutoLoginHostDirective) adLoginHost: AdAutoLoginHostDirective;

    constructor(
        injector: Injector,
        private _appSession: AppSessionService,
        private _componentFactoryResolver: ComponentFactoryResolver
    ) { }

    ngOnInit(): void {
        this.loadLayoutComponent(this.getLayoutComponent(this._appSession.tenant));
    }

    private getLayoutComponent(tenant) {
        switch (tenant && tenant.customLayoutType) {
            case LayoutType.LendSpace:
                return LendSpaceAutoLoginComponent;
            case LayoutType.AdvicePeriod:
                return AdvicePeriodAutoLoginComponent;
            case LayoutType.BankCode:
                return BankCodeAutoLoginComponent;
            default:
                return HostAutoLoginComponent;
        }
    }

    private loadLayoutComponent(component: Type<HostAutoLoginComponent>) {
        this.adLoginHost.viewContainerRef.createComponent(
            this._componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}