import { Directive, Component, Injector, ViewContainerRef, ViewEncapsulation,
    ComponentFactoryResolver, ViewChild, Type, OnInit } from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { HostLayoutComponent } from './layouts/host/host-layout.component';
import { LendSpaceLayoutComponent } from './layouts/lend-space/lend-space-layout.component';
import { AdvicePeriodLayoutComponent } from './layouts/advice-period/advice-period-layout.component';
import { TenantLoginInfoDtoCustomLayoutType } from '@shared/service-proxies/service-proxies';

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
export class AccountComponent extends AppComponentBase implements OnInit {
    @ViewChild(AdLayoutHostDirective) adLayoutHost: AdLayoutHostDirective;
    private viewContainerRef: ViewContainerRef;

    constructor(
        injector: Injector,
        private _appSession: AppSessionService,
        private _componentFactoryResolver: ComponentFactoryResolver,
        viewContainerRef: ViewContainerRef
    ) {
        super(injector);

        // We need this small hack in order to catch application root view container ref for modals
        this.viewContainerRef = viewContainerRef;
    }

    ngOnInit(): void {
        this.loadLayoutComponent(this.getLayoutComponent(this._appSession.tenant));
    }

    private getLayoutComponent(tenant) {
        switch (tenant && tenant.customLayoutType) {
            case TenantLoginInfoDtoCustomLayoutType.LendSpace: 
                return LendSpaceLayoutComponent;
            case TenantLoginInfoDtoCustomLayoutType.AdvicePeriod: 
                return AdvicePeriodLayoutComponent;
            default: 
                return HostLayoutComponent;
        }
    }

    private loadLayoutComponent(component: Type<AppComponentBase>) {
        this.adLayoutHost.viewContainerRef.createComponent(
            this._componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}
