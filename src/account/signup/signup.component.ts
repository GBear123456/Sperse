/** Core imports */
import { ViewChild, Type, Component, Directive, ViewEncapsulation, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';

/** Application imports */
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { HostSignupFormComponent } from './layouts/host/host-signup-form.component';
import { BankCodeSignupFormComponent } from './layouts/bank-code/bank-code-signup-form.component';
import { MemberSignupFormComponent } from './layouts/member/member-signup-form.component';
import { TitleService } from '@shared/common/title/title.service';

type SignupFormComponent = HostSignupFormComponent | BankCodeSignupFormComponent | MemberSignupFormComponent;

@Directive({
    selector: '[ad-signup-host]'
})
export class AdSignupHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    selector: 'signup',
    templateUrl: './signup.component.html',
    styleUrls: [
        '../../../node_modules/devextreme/dist/css/dx.common.css',
        '../../../node_modules/devextreme/dist/css/dx.light.css'
    ],
    encapsulation: ViewEncapsulation.None
})
export class SignupComponent { 
    @ViewChild(AdSignupHostDirective, { static: true }) adSignupHost: AdSignupHostDirective;

    constructor(
        private appSession: AppSessionService,
        private componentFactoryResolver: ComponentFactoryResolver,
        private titleService: TitleService
    ) {}

    ngOnInit(): void {
        this.titleService.setTitle('SignUp');
        this.loadLayoutComponent(
            this.getLayoutComponent(this.appSession.tenant)
        );
    }

    private getLayoutComponent(tenant): Type<SignupFormComponent> {
        if (abp.session.tenantId)
            switch (tenant && tenant.customLayoutType) {
                case LayoutType.BankCode:
                    return BankCodeSignupFormComponent;
                default:
                    return MemberSignupFormComponent;
            }
        else 
            return HostSignupFormComponent;
    }

    private loadLayoutComponent(component: Type<SignupFormComponent>) {
        this.adSignupHost.viewContainerRef.createComponent(
            this.componentFactoryResolver.resolveComponentFactory(component)
        );
    }
}