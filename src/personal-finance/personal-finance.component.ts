import { Component, ViewContainerRef, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

declare const Typekit: any;

@Component({
    templateUrl: './personal-finance.component.html',
    styleUrls: ['./personal-finance.component.less']
})
export class PersonalFinanceComponent extends AppComponentBase implements OnInit {

    hasPfmAppFeature = false;
    loggedUserId: number;

    private viewContainerRef: ViewContainerRef;
    public constructor(
        injector: Injector,
        viewContainerRef: ViewContainerRef
    ) {
        super(injector);
        this.viewContainerRef = viewContainerRef;
        // You need this small hack in order to catch application root view container ref (required by ng2 bootstrap modal)
        this.hasPfmAppFeature = this.feature.isEnabled('PFM.Applications');
        this.loggedUserId = this.appSession.userId;
    }

    ngOnInit(): void {
        this.getRootComponent().addScriptLink('https://use.typekit.net/ocj2gqu.js', 'text/javascript', () => {
            try { Typekit.load({ async: true }); } catch (e) { }
        });
    }
}
