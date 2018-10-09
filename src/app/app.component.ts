import { AfterViewInit, Component, Injector, OnInit, ViewContainerRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { ChatSignalrService } from 'app/shared/layout/chat/chat-signalr.service';
import { AppComponentBase } from 'shared/common/app-component-base';
import { PaymentWizardComponent } from './shared/common/payment-wizard/payment-wizard.component';
import { SignalRHelper } from 'shared/helpers/SignalRHelper';
import { AppService } from './app.service';
import { FiltersService } from '@shared/filters/filters.service';
import { MatDialog } from '@angular/material';
import { ModuleSubscriptionInfoDtoModule } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
})
export class AppComponent extends AppComponentBase implements OnInit, AfterViewInit {

    installationMode = false;

    public constructor(
        injector: Injector,
        private _ngZone: NgZone,
        private _router: Router,
        private viewContainerRef: ViewContainerRef, // You need this small hack in order to catch application root view container ref (required by ng2 bootstrap modal)
        private _chatSignalrService: ChatSignalrService,
        private _appSessionService: AppSessionService,
        public appService: AppService,
        public filtersService: FiltersService,
        public dialog: MatDialog
    ) {
        super(injector);

        if (appService.isNotHostTenant()) {
            let paymentDialogTimeout;
            appService.expiredModuleSubscribe((name) => {
                if (name != appService.getDefaultModule()) {
                    clearTimeout(paymentDialogTimeout);
                    paymentDialogTimeout = setTimeout(() => {
                        if(!appService.subscriptionInGracePeriod(name))
                            _router.navigate(['app/admin/users']);
                        if (!this.dialog.getDialogById('payment-wizard')) {
                            this.dialog.open(PaymentWizardComponent, {
                                height: '655px',
                                width: '980px',
                                id: 'payment-wizard',
                                panelClass: ['payment-wizard', 'setup'],
                                data: { module: name.toUpperCase() }
                            }).afterClosed().subscribe(result => {});
                        }
                    });
                }
            });
        }
    }

    ngOnInit(): void {
        this.appService.initModule();

        if (this.appSession.application && this.appSession.application.features['SignalR']) {
            SignalRHelper.initSignalR(() => { this._chatSignalrService.init(); });
        }

        this.installationMode = UrlHelper.isInstallUrl(location.href);
    }

    subscriptionStatusBarVisible(): boolean {
        return !this.appService.showContactInfoPanel &&
            (this.appService.subscriptionIsExpiringSoon() ||
            this.appService.subscriptionInGracePeriod());
    }

    subscriptionStatusBarIsHidden(): boolean {
        return this.appService.subscriptionStatusBarIsHidden();
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
