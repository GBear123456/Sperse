import { Directive, Component, ViewContainerRef, ViewEncapsulation,
    ComponentFactoryResolver, ViewChild, Type, OnInit } from '@angular/core';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { HostLayoutComponent } from './layouts/host/host-layout.component';
import { LendSpaceLayoutComponent } from './layouts/lend-space/lend-space-layout.component';
import { AdvicePeriodLayoutComponent } from './layouts/advice-period/advice-period-layout.component';
import { BankCodeLayoutComponent } from './layouts/bank-code/bank-code-layout.component';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { RapidLayoutComponent } from "@root/account/layouts/rapid/rapid-layout.component";
import { HoaLayoutComponent } from "@root/account/layouts/hoa/hoa-layout.component";
import { SperserLayoutComponent } from "@root/account/layouts/sperser/sperser-layout.component";
import { GHostLayoutComponent } from "@root/account/layouts/ghost/ghost-layout.component";

@Directive({
    selector: '[ad-account-host]'
})
export class AdLayoutHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    templateUrl: './account.component.html',
    styleUrls: [
        '../shared/common/styles/core.less',
        './account.component.less'
    ],
    encapsulation: ViewEncapsulation.None
})
export class AccountComponent implements OnInit {
    @ViewChild(AdLayoutHostDirective, { static: true }) adLayoutHost: AdLayoutHostDirective;

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
                return LendSpaceLayoutComponent;
            case LayoutType.AdvicePeriod:
                return AdvicePeriodLayoutComponent;
            case LayoutType.BankCode:
                return BankCodeLayoutComponent;
            case LayoutType.Rapid:
                return RapidLayoutComponent;
            case LayoutType.HOA:
                return HoaLayoutComponent;
            case LayoutType.Sperser:
                return SperserLayoutComponent;
            case LayoutType.GhostDrive:
                return GHostLayoutComponent;
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