/** Core imports */
import {
    Component,
    ComponentFactoryResolver, Directive,
    Injector,
    Inject,
    OnInit,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Application imports */
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LendSpaceHomeComponent } from '@root/personal-finance/pages/home/layouts/lend-space/lend-space-home.component';
import { HostHomeComponent } from '@root/personal-finance/pages/home/layouts/host/host-home.component';

@Directive({
    selector: '[home-host]'
})
export class HomeHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) {}
}

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {
    @ViewChild(HomeHostDirective) adHomeHost: HomeHostDirective;
    constructor(
        injector: Injector,
        private featureService: FeatureCheckerService,
        private componentFactoryResolver: ComponentFactoryResolver,
        public appSession: AppSessionService,
        private viewContainerRef: ViewContainerRef,
        @Inject(DOCUMENT) private document: any
    ) {}

    ngOnInit() {
        this.loadLayoutComponent(
            this.getLayoutComponent(this.appSession.tenant)
        );
        this.document.body.scrollTo(0, 0);
    }

    private getLayoutComponent(tenant) {
        switch (tenant && tenant.customLayoutType) {
            case LayoutType.LendSpace:
                return LendSpaceHomeComponent;
            default:
                return HostHomeComponent;
        }
    }

    private loadLayoutComponent(component: any) {
        this.adHomeHost.viewContainerRef.createComponent(
            this.componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}
