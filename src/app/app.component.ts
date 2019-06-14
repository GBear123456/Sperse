/** Core imports */
import { Component, Injector, OnInit, NgZone, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ChatSignalrService } from 'app/shared/layout/chat/chat-signalr.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PaymentWizardComponent } from './shared/common/payment-wizard/payment-wizard.component';
import { SignalRHelper } from 'shared/helpers/SignalRHelper';
import { AppService } from './app.service';
import { FiltersService } from '@shared/filters/filters.service';

@Component({
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less',
        '../../node_modules/ng2-image-viewer/imageviewer.scss',
        '../shared/metronic/m-toast.less'
    ],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

    installationMode = false;

    public constructor(
        private _ngZone: NgZone,
        private _router: Router,
        private _chatSignalrService: ChatSignalrService,
        public ls: AppLocalizationService,
        public appSession: AppSessionService,
        public appService: AppService,
        public filtersService: FiltersService,
        public dialog: MatDialog
    ) {
        if (!appService.isHostTenant) {
            let paymentDialogTimeout;
            appService.expiredModuleSubscribe((name) => {
                let moduleName = name.toLowerCase();
                if (moduleName != appService.getDefaultModule()) {
                    clearTimeout(paymentDialogTimeout);
                    if (!appService.subscriptionInGracePeriod(moduleName))
                        this._router.navigate(['app/admin/users']);
                    paymentDialogTimeout = setTimeout(() => {
                        if (!this.dialog.getDialogById('payment-wizard')) {
                            const sub = appService.getModuleSubscription(name);
                            this.dialog.open(PaymentWizardComponent, {
                                height: '800px',
                                width: '1200px',
                                id: 'payment-wizard',
                                panelClass: ['payment-wizard', 'setup'],
                                data: {
                                    module: sub.module,
                                    title: ls.l('ModuleExpired', appService.getSubscriptionName(name),
                                        sub && sub.endDate ? 'subscription' : 'trial')
                                }
                            }).afterClosed().subscribe(result => {});
                        }
                    }, 2000);
                }
            });
        }
    }

    ngOnInit(): void {
        this.appService.initModule();

        if (this.appSession.application) {
            SignalRHelper.initSignalR(() => { this._chatSignalrService.init(); });
        }

        this.installationMode = UrlHelper.isInstallUrl(location.href);
    }
}