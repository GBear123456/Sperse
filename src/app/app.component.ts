/** Core imports */
import { Component, OnInit, NgZone, ViewEncapsulation, HostBinding, HostListener } from '@angular/core';
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
import { FullScreenService } from '@shared/common/fullscreen/fullscreen.service';
import { CacheService } from '@node_modules/ng2-cache-service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';

@Component({
    templateUrl: './app.component.html',
    styleUrls: [
        '../shared/common/dx-data-grid/dx-data-grid.directive.less',
        '../../node_modules/ng2-image-viewer/imageviewer.scss',
        '../assets/common/styles/spinner.css',
        './shared/layout/layout.less',
        '../shared/common/styles/dx-customs.less',
        '../shared/common/styles/core.less',
        '../shared/metronic/m-content.less',
        '../shared/metronic/m-portlet.less',
        '../shared/metronic/m-subheader.less',
        './app.component.less'
    ],
    encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
    installationMode = false;
    @HostBinding('class.fullscreen') isFullscreenMode = false;
    @HostListener('document:webkitfullscreenchange', ['$event'])
    @HostListener('document:mozfullscreenchange', ['$event'])
    @HostListener('document:fullscreenchange', ['$event'])
    onWebkitFullscreenChange() {
        this.isFullscreenMode = document['fullScreen'] || document['mozFullScreen'] || document['webkitIsFullScreen'];
        this.fullScreenService.isFullScreenMode.next(this.isFullscreenMode);
    }

    isChatEnabled = this.appService.feature.isEnabled(AppFeatures.AppChatFeature);

    public constructor(
        private ngZone: NgZone,
        private router: Router,
        private chatSignalrService: ChatSignalrService,
        private fullScreenService: FullScreenService,
        private cacheService: CacheService,
        private cacheHelper: CacheHelper,
        private userManagementService: UserManagementService,
        private permissionCheckerService: PermissionCheckerService,
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
                    if (!appService.subscriptionInGracePeriod(moduleName)) {
                        this.dialog.closeAll();
                        this.router.navigate(['app/admin/users']);
                    }
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
                                    title: ls.ls(
                                        'Platform',
                                        'ModuleExpired',
                                        appService.getSubscriptionName(name),
                                        appService.getSubscriptionStatusBySubscription(sub)
                                    )
                                }
                            });
                        }
                    }, 2000);
                }
            });
        }
    }

    ngOnInit(): void {
        this.initModuleAttribute();
        this.appService.initModule();

        this.appService.subscribeModuleChange(this.initModuleAttribute.bind(this));
        if (this.appSession.application && this.isChatEnabled) {
            SignalRHelper.initSignalR(() => { this.chatSignalrService.init(); });
        }

        this.installationMode = UrlHelper.isInstallUrl(location.href);
    }

    initModuleAttribute() {
        document.body.setAttribute('module', this.appService.getModule());
    }

    onClientSearch(phrase: string) {
        this.appService.clientSearchPhrase.next(phrase);
    }
}