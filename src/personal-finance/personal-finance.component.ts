import { Component, HostBinding, ViewContainerRef, OnInit, OnDestroy, Injector, Renderer2 } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ChatSignalrService } from 'app/shared/layout/chat/chat-signalr.service';
import { SignalRHelper } from 'shared/helpers/SignalRHelper';
import { Router, ActivationEnd } from '@angular/router';

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
        private _chatSignalrService: ChatSignalrService,
        viewContainerRef: ViewContainerRef,
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
            }
        });
    }
    //
    // isLastSnapshot(snapshot) {
    //     return snapshot['_routerState'].url.split('/').pop() == snapshot.routeConfig.path;
    // }

    ngOnInit(): void {
        this._render.addClass(document.body, 'pfm');
        this.getRootComponent().addScriptLink('https://use.typekit.net/ocj2gqu.js', 'text/javascript', () => {
            try { Typekit.load({ async: true }); } catch (e) { }
        });

        if (this.appSession.application) {
            SignalRHelper.initSignalR(() => { this._chatSignalrService.init(); });
        }
    }

    ngOnDestroy() {
        this._render.removeClass(document.body, 'pfm');
    }
}
