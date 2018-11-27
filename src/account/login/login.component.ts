/** Core imports */
import { Directive, Component, Injector, ViewContainerRef,
    ComponentFactoryResolver, ViewChild, Type, OnInit } from '@angular/core';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { HostLoginComponent } from './layouts/host/host-login.component';
import { LendSpaceLoginComponent } from './layouts/lend-space/lend-space-login.component';
import { TenantLoginInfoDtoCustomLayoutType } from '@shared/service-proxies/service-proxies';

@Directive({
    selector: '[ad-login-host]'
})
export class AdLoginHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    templateUrl: './login.component.html',
    styleUrls: [
        './login.component.less'
    ]
})
export class LoginComponent extends AppComponentBase implements OnInit {
    @ViewChild(AdLoginHostDirective) adLoginHost: AdLoginHostDirective;

    constructor(
        injector: Injector,
        private _appSession: AppSessionService,
        private _componentFactoryResolver: ComponentFactoryResolver
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.setTitle('Login');

        let tenant = this._appSession.tenant;
        this.loadLayoutComponent(tenant && (tenant.customLayoutType == TenantLoginInfoDtoCustomLayoutType.LendSpace)
            ? LendSpaceLoginComponent : HostLoginComponent);
    }

    private loadLayoutComponent(component: Type<HostLoginComponent>) {
        this.adLoginHost.viewContainerRef.createComponent(
            this._componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}
