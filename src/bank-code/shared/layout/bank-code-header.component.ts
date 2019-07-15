/** Core imports */
import { Component, Injector, HostBinding, ViewChild, ViewContainerRef,
    Type, Directive, ComponentFactoryResolver } from '@angular/core';

/** Application imports */
import { AppConsts } from 'shared/AppConsts';
import { AppComponentBase } from 'shared/common/app-component-base';
import { BankCodeLayoutService } from './bank-code-layout.service';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { environment } from 'environments/environment';

@Directive({
    selector: '[ad-header-host]'
})
export class AdHeaderHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    templateUrl: 'bank-code-header.component.html',
    styleUrls: ['bank-code-header.component.less'],
    selector: 'bank-code-header'
})
export class BankCodeHeaderComponent extends AppComponentBase {
    @ViewChild(AdHeaderHostDirective) adHeaderHost: AdHeaderHostDirective;

    loggedUserId = abp.session.userId;
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;

    currentDate = new Date();

    constructor(
        injector: Injector,
        private _LayoutService: BankCodeLayoutService,
        private _abpSessionService: AbpSessionService,
        public sessionService: AppSessionService
    ) {
        super(injector);
        _LayoutService.headerContentSubscribe((component) => {
            setTimeout(() => {
                this.adHeaderHost.viewContainerRef.clear();
                this.adHeaderHost.viewContainerRef.createComponent(component);
            });
        });
    }

    isMemberArea() {
        return Boolean(this.loggedUserId);
    }

    logoClick(event) {
        this._router.navigate(['/code-breaker']);
    }
}