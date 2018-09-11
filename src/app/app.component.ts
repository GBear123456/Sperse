import { AfterViewInit, Component, Injector, OnInit, ViewContainerRef, NgZone } from '@angular/core';

import * as moment from 'moment';

import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { ChatSignalrService } from 'app/shared/layout/chat/chat-signalr.service';
import { AppComponentBase } from 'shared/common/app-component-base';
import { SignalRHelper } from 'shared/helpers/SignalRHelper';
import { AppService } from './app.service';
import { FiltersService } from '@shared/filters/filters.service';

@Component({
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
})
export class AppComponent extends AppComponentBase implements OnInit, AfterViewInit {

    installationMode = false;

    public constructor(
        injector: Injector,
        private _ngZone: NgZone,
        private viewContainerRef: ViewContainerRef, // You need this small hack in order to catch application root view container ref (required by ng2 bootstrap modal)
        private _chatSignalrService: ChatSignalrService,
        private _appSessionService: AppSessionService,
        public appService: AppService,
        public filtersService: FiltersService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.appService.initModule();

        if (this.appSession.application && this.appSession.application.features['SignalR']) {
            SignalRHelper.initSignalR(() => { this._chatSignalrService.init(); });
        }

        this.installationMode = UrlHelper.isInstallUrl(location.href);
    }

    subscriptionStatusBarVisible(): boolean {
        return this._appSessionService.tenantId > 0 &&
            (this._appSessionService.tenant.isInTrialPeriod ||
                this.subscriptionIsExpiringSoon());
    }

    subscriptionIsExpiringSoon(): boolean {
        if (this._appSessionService.tenant && this._appSessionService.tenant.subscriptionEndDateUtc) {
            return moment().utc().add(AppConsts.subscriptionExpireNootifyDayCount, 'days')
                >= moment(this._appSessionService.tenant.subscriptionEndDateUtc);
        }
        return false;
    }

    ngAfterViewInit(): void {
        if (mApp.initialized) {
            return;
        }

        this._ngZone.runOutsideAngular(() => {
            mApp.init();
            mLayout.init();
            mApp.initialized = true;
        });
    }
}
