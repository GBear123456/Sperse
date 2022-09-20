/** Core imports */
import {
    Component,
    ComponentFactoryResolver,
    Directive,
    OnInit,
    Type,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Application imports */
import { AppSessionService } from '@shared/common/session/app-session.service';
import { HostLoginComponent } from './layouts/host/host-login.component';
import { LendSpaceLoginComponent } from './layouts/lend-space/lend-space-login.component';
import { AdvicePeriodLoginComponent } from './layouts/advice-period/advice-period-login.component';
import { BankCodeLoginComponent } from './layouts/bank-code/bank-code-login.component';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { TitleService } from '@shared/common/title/title.service';
import { RapidLoginComponent } from '@root/account/login/layouts/rapid/rapid-login.component';
import { HoaLoginComponent } from '@root/account/login/layouts/hoa/hoa-login.component';
import { SperserLoginComponent } from "@root/account/login/layouts/sperser/sperser-login.component";
import { GHostLoginComponent } from '@root/account/login/layouts/ghost/ghost-login.component';

@Directive({
    selector: '[ad-login-host]'
})
export class AdLoginHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    templateUrl: './login.component.html',
    styleUrls: [ './login.component.less' ],
})
export class LoginComponent implements OnInit {
    @ViewChild(AdLoginHostDirective, { static: true }) adLoginHost: AdLoginHostDirective;

    layoutComponent: Type<HostLoginComponent>;

    constructor(
        private appSession: AppSessionService,
        private componentFactoryResolver: ComponentFactoryResolver,
        private activatedRoute: ActivatedRoute,
        private titleService: TitleService
    ) {
        let activeRouteChild = this.activatedRoute.snapshot;
        if (activeRouteChild) {
            let data = activeRouteChild.routeConfig.data;
            this.layoutComponent = data && data.layoutComponent;
        }
    }

    ngOnInit(): void {
        this.titleService.setTitle('Login');
        if (!this.layoutComponent)
            this.layoutComponent = this.getLayoutComponent(this.appSession.tenant);
        this.loadLayoutComponent(this.layoutComponent);
    }

    private getLayoutComponent(tenant): Type<HostLoginComponent> {
        switch (tenant && tenant.customLayoutType) {
            case LayoutType.LendSpace:
                return LendSpaceLoginComponent;
            case LayoutType.AdvicePeriod:
                return AdvicePeriodLoginComponent;
            case LayoutType.BankCode:
                return BankCodeLoginComponent;
            case LayoutType.Rapid:
                return RapidLoginComponent;
            case LayoutType.HOA:
                return HoaLoginComponent;
            case LayoutType.Sperser:
                return SperserLoginComponent;
            case LayoutType.GhostDrive:
                return GHostLoginComponent;
            default:
                return HostLoginComponent;
        }
    }

    private loadLayoutComponent(component: Type<HostLoginComponent>) {
        this.adLoginHost.viewContainerRef.createComponent(
            this.componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}
