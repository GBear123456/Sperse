import { Component, Injector, OnInit, ViewContainerRef, NgZone, ViewEncapsulation } from '@angular/core';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { ChatSignalrService } from 'app/shared/layout/chat/chat-signalr.service';
import { AppComponentBase } from 'shared/common/app-component-base';
import { PaymentWizardComponent } from './shared/common/payment-wizard/payment-wizard.component';
import { SignalRHelper } from 'shared/helpers/SignalRHelper';
import { AppService } from './app.service';
import { FiltersService } from '@shared/filters/filters.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less',
        '../../node_modules/ng2-image-viewer/imageviewer.scss'
    ],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent extends AppComponentBase implements OnInit {

    installationMode = false;

    public constructor(
        injector: Injector,
        private _ngZone: NgZone,
        private viewContainerRef: ViewContainerRef, // You need this small hack in order to catch application root view container ref (required by ng2 bootstrap modal)
        private _chatSignalrService: ChatSignalrService,
        public appService: AppService,
        public filtersService: FiltersService,
        public dialog: MatDialog
    ) {
        super(injector);

        if (appService.isNotHostTenant()) {
            let paymentDialogTimeout;
            appService.expiredModuleSubscribe((name) => {
                let moduleName = name.toLowerCase();
                if (moduleName != appService.getDefaultModule()) {
                    clearTimeout(paymentDialogTimeout);
                    if (!appService.subscriptionInGracePeriod(moduleName))
                        this._router.navigate(['app/admin/users']);
                    paymentDialogTimeout = setTimeout(() => {
                        if (!this.dialog.getDialogById('payment-wizard')) {
                            const upperModuleName = name.toUpperCase();
                            const module = appService.getModuleSubscription(name);
                            this.dialog.open(PaymentWizardComponent, {
                                height: '655px',
                                width: '980px',
                                id: 'payment-wizard',
                                panelClass: ['payment-wizard', 'setup'],
                                data: {
                                    module: upperModuleName,
                                    title: this.l('ModuleExpired', upperModuleName, module && module.endDate ? 'subscription' : 'trial')
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
