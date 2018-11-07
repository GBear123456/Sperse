import { Component, ViewContainerRef, OnInit, AfterViewInit, Injector } from '@angular/core';
import { ChatSignalrService } from '@app/shared/layout/chat/chat-signalr.service';
import { SignalRHelper } from '@shared/helpers/SignalRHelper';
import { AppComponentBase } from '@shared/common/app-component-base';

declare const Typekit: any;

@Component({
    templateUrl: './personal-finance.component.html',
    styleUrls: ['./personal-finance.component.less']
})
export class PersonalFinanceComponent extends AppComponentBase implements OnInit, AfterViewInit {

    private viewContainerRef: ViewContainerRef;
    public constructor(
        injector: Injector,
        viewContainerRef: ViewContainerRef,
        private _chatSignalrService: ChatSignalrService) {
        super(injector);
        this.viewContainerRef = viewContainerRef;
        // You need this small hack in order to catch application root view container ref (required by ng2 bootstrap modal)
    }

    ngOnInit(): void {
        if (this.appSession.application) {
            SignalRHelper.initSignalR(() => { this._chatSignalrService.init(); });
        }

        this.getRootComponent().addScriptLink('https://use.typekit.net/ocj2gqu.js', 'text/javascript', () => {
            try { Typekit.load({ async: true }); } catch (e) { }
        });
    }

    ngAfterViewInit(): void {
        if (mApp.initialized) {
            return;
        }

        mApp.init();
        mLayout.init();
        mApp.initialized = true;
    }
}
