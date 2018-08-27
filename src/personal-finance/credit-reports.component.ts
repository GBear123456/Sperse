import { Component, ViewContainerRef, OnInit, AfterViewInit, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { ChatSignalrService } from '@app/shared/layout/chat/chat-signalr.service';
import { SignalRHelper } from '@shared/helpers/SignalRHelper';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppConsts } from '@shared/AppConsts';
import * as moment from 'moment';

declare const Typekit: any;

@Component({
    templateUrl: './credit-reports.component.html',
    styleUrls: ['./credit-reports.component.less']
})
export class CreditReportsComponent extends AppComponentBase implements OnInit, AfterViewInit {

    private viewContainerRef: ViewContainerRef;
    private router: Router;

    installationMode = false;

    public constructor(
        injector: Injector,
        viewContainerRef: ViewContainerRef,
        private _chatSignalrService: ChatSignalrService,
        private _appSessionService: AppSessionService) {
        super(injector);
        this.viewContainerRef = viewContainerRef;
        // You need this small hack in order to catch application root view container ref (required by ng2 bootstrap modal)
    }

    ngOnInit(): void {
        if (this.appSession.application && this.appSession.application.features['SignalR']) {
            SignalRHelper.initSignalR(() => { this._chatSignalrService.init(); });
        }

        this.getRootComponent().addScriptLink("https://use.typekit.net/ocj2gqu.js", 'text/javascript', () => {
            try { Typekit.load({ async: true }); } catch (e) { }
        });
    }

    subscriptionStatusBarVisible(): boolean {
        return this._appSessionService.tenantId > 0 &&
            (this._appSessionService.tenant.isInTrialPeriod ||
                this.subscriptionIsExpiringSoon());
    }

    subscriptionIsExpiringSoon(): boolean {
        if (this._appSessionService.tenant.subscriptionEndDateUtc) {
            return moment().utc().add(AppConsts.subscriptionExpireNootifyDayCount, 'days') >= moment(this._appSessionService.tenant.subscriptionEndDateUtc);
        }

        return false;
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
