import { Component, HostBinding, ViewContainerRef, OnInit, OnDestroy, Injector, Renderer2 } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Router, ActivationEnd } from '@angular/router';
import { humanize } from 'underscore.string';
import { ZendeskService } from '@app/shared/common/zendesk/zendesk.service';

declare const Typekit: any;

@Component({
    templateUrl: './personal-finance.component.html',
    styleUrls: ['./personal-finance.component.less']
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
        private _zDesk: ZendeskService,
        private _render: Renderer2
    ) {
        super(injector);
        this.viewContainerRef = viewContainerRef;
        // You need this small hack in order to catch application root view container ref (required by ng2 bootstrap modal)
        this.hasPfmAppFeature = this.feature.isEnabled('PFM.Applications');
        this.loggedUserId = this.appSession.userId;
        this._router.events.subscribe(event => {
            if (event instanceof ActivationEnd && !event.snapshot.children.length) {
                this.wrapperEnabled = !event.snapshot.data.wrapperDisabled;
                this.hideFooter = event.snapshot.data.hideFooter;
                setTimeout(() => {
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

    ngOnInit(): void {
        this._render.addClass(document.body, 'pfm');
        if (!abp.session.userId)
            this._zDesk.showWidget({ position: { horizontal: 'left', vertical: 'bottom' } });

/*
        this.getRootComponent().addScriptLink('https://use.typekit.net/ocj2gqu.js', 'text/javascript', () => {
            try { Typekit.load({ async: true }); } catch (e) { }
        });
*/
    }

    ngOnDestroy() {
        this._render.removeClass(document.body, 'pfm');
        if (abp.session.userId)
            this._zDesk.hideWidget();
    }
}