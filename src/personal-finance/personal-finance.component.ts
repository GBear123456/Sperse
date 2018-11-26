import { Component, HostBinding, ViewContainerRef, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Router, ActivationEnd } from '@angular/router';

declare const Typekit: any;

@Component({
    templateUrl: './personal-finance.component.html',
    styleUrls: ['./personal-finance.component.less']
})
export class PersonalFinanceComponent extends AppComponentBase implements OnInit {
    @HostBinding('class.pfm-app') hasPfmAppFeature = false;

    wrapperEnabled = false;
    hideFooter = false;
    loggedUserId: number;

    private viewContainerRef: ViewContainerRef;
    public constructor(
        injector: Injector,
        viewContainerRef: ViewContainerRef,
        private router: Router
    ) {
        super(injector);
        this.viewContainerRef = viewContainerRef;
        // You need this small hack in order to catch application root view container ref (required by ng2 bootstrap modal)
        this.hasPfmAppFeature = this.feature.isEnabled('PFM.Applications');
        this.loggedUserId = this.appSession.userId;
        router.events.subscribe(event => {
            if (event instanceof ActivationEnd && !event.snapshot.children.length) {
                this.wrapperEnabled = !event.snapshot.data.wrapperDisabled;
                this.hideFooter = event.snapshot.data.hideFooter;
            }
        });
    }
    //
    // isLastSnapshot(snapshot) {
    //     return snapshot['_routerState'].url.split('/').pop() == snapshot.routeConfig.path;
    // }

    ngOnInit(): void {
        this.getRootComponent().addScriptLink('https://use.typekit.net/ocj2gqu.js', 'text/javascript', () => {
            try { Typekit.load({ async: true }); } catch (e) { }
        });
    }
}
