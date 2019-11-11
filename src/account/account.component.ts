import { Directive, Component, ViewContainerRef, ViewEncapsulation,
    ComponentFactoryResolver, ViewChild, Type, OnInit } from '@angular/core';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { HostLayoutComponent } from './layouts/host/host-layout.component';
import { LendSpaceLayoutComponent } from './layouts/lend-space/lend-space-layout.component';
import { AdvicePeriodLayoutComponent } from './layouts/advice-period/advice-period-layout.component';
import { BankCodeLayoutComponent } from './layouts/bank-code/bank-code-layout.component';
import { LayoutType } from '@shared/service-proxies/service-proxies';

@Directive({
    selector: '[ad-account-host]'
})
export class AdLayoutHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    templateUrl: './account.component.html',
    styleUrls: [
        '../app/shared/core.less',
        './account.component.less'
    ],
    encapsulation: ViewEncapsulation.None
})
export class AccountComponent implements OnInit {
    @ViewChild(AdLayoutHostDirective) adLayoutHost: AdLayoutHostDirective;
    private viewContainerRef: ViewContainerRef;

    constructor(
        private appSession: AppSessionService,
        private componentFactoryResolver: ComponentFactoryResolver,
        viewContainerRef: ViewContainerRef
    ) {
        // We need this small hack in order to catch application root view container ref for modals
        this.viewContainerRef = viewContainerRef;
    }

    ngOnInit(): void {
        this.loadLayoutComponent(this.getLayoutComponent(this.appSession.tenant));
    }

    private getLayoutComponent(tenant) {
        switch (tenant && tenant.customLayoutType) {
            case LayoutType.LendSpace:
                return LendSpaceLayoutComponent;
            case LayoutType.AdvicePeriod:
                return AdvicePeriodLayoutComponent;
            case LayoutType.BankCode:
                return BankCodeLayoutComponent;
            default:
                return HostLayoutComponent;
        }
    }

    private loadLayoutComponent(component: Type<any>) {
        this.adLayoutHost.viewContainerRef.createComponent(
            this.componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}
