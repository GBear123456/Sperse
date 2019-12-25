import {
    Component, HostBinding, ViewContainerRef,
    OnInit, OnDestroy, Injector, Renderer2, Inject
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivationEnd } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import humanize from 'underscore.string/humanize';
import { AppFeatures } from '@shared/AppFeatures';
import { LayoutType } from '@root/shared/service-proxies/service-proxies';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';

declare const Typekit: any;

@Component({
    templateUrl: './personal-finance.component.html',
    styleUrls: [
        './shared/common/styles/apply-button.less',
        './personal-finance.component.less'
    ],
    providers: [ OffersService ]
})
export class PersonalFinanceComponent extends AppComponentBase implements OnInit, OnDestroy {
    @HostBinding('class.pfm-app') hasPfmAppFeature = false;

    wrapperEnabled = false;
    hideFooter = false;
    loggedUserId: number;

    private viewContainerRef: ViewContainerRef;
    public constructor(
        injector: Injector,
        viewContainerRef: ViewContainerRef,
        private render: Renderer2,
        @Inject(DOCUMENT) public document: any
    ) {
        super(injector);
        this.viewContainerRef = viewContainerRef; // You need this small hack in order to catch application root view container ref (required by ng2 bootstrap modal)

        this.hasPfmAppFeature = this.feature.isEnabled(AppFeatures.PFMApplications) && this.appSession.tenant.customLayoutType == LayoutType.LendSpace;
        this.loggedUserId = this.appSession.userId;
        this._router.events.subscribe(event => {
            if (event instanceof ActivationEnd && !event.snapshot.children.length) {
                this.wrapperEnabled = !event.snapshot.data.wrapperDisabled;
                this.hideFooter = event.snapshot.data.hideFooter;
                setTimeout(() => {
                    window.scroll(0, 0);
                    let url = event.snapshot.url[0];
                    this.setTitle(humanize(url && url.path || event.snapshot['_routerState']
                        .url.split('?').shift().split('/').pop()).replace(/\w\S*/g,
                            (txt) => {
                                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                            }
                        ));
                });
            }
        });
    }

    get widthWithoutScrollbar() {
        return this.document.body.clientWidth + 'px';
    }

    ngOnInit(): void {
        this.render.addClass(document.body, 'pfm');
        /*
                this.getRootComponent().addScriptLink('https://use.typekit.net/ocj2gqu.js', 'text/javascript', () => {
                    try { Typekit.load({ async: true }); } catch (e) { }
                });
        */
    }

    ngOnDestroy() {
        this.render.removeClass(document.body, 'pfm');
    }
}
