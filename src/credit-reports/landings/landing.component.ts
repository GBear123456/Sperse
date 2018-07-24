import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

declare const Typekit: any;

@Component({
    selector: 'app-root',
    templateUrl: 'landing.component.html',
    styleUrls: ['landing.component.less']
})

export class LandingComponent extends AppComponentBase implements OnInit {
    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
        this.getRootComponent().addScriptLink("https://use.typekit.net/ocj2gqu.js", 'text/javascript', () => {
            try { Typekit.load({ async: true }); } catch (e) { }
        });
    }
}
