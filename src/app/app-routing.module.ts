/** Core imports */
import { Injectable, NgModule } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    NavigationEnd, Resolve,
    RouteConfigLoadEnd,
    RouteConfigLoadStart,
    Router,
    RouterModule
} from '@angular/router';

/** Third party imports */
import { of } from '@node_modules/rxjs';
import { CacheService } from 'ng2-cache-service';
import { CacheStoragesEnum } from 'ng2-cache-service/dist/src/enums/cache-storages.enum';

/** Application imports */
import { AppComponent } from './app.component';
import { NotificationsComponent } from './shared/layout/notifications/notifications.component';
import { AccessDeniedComponent } from '@app/main/access-denied/access-denied.component';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Injectable()
export class ModulePathResolverService implements Resolve<any> {
    constructor(
        private cacheService: CacheService,
        private sessionService: AppSessionService
    ) {}

    resolve(route: ActivatedRouteSnapshot) {
        if (this.sessionService.userId !== null) {
            this.cacheService.useStorage(CacheStoragesEnum.LOCAL_STORAGE).set('lastVisitedModule_' + this.sessionService.userId, route.url[0].path);
        }
        return of('');
    }
}

@Injectable()
export class CfoActivateService implements CanActivate {
    constructor(
        private router: Router,
        private permissionChecker: PermissionCheckerService,
        private featureService: FeatureCheckerService
    ) {}

    canActivate() {
        if (this.permissionChecker.isGranted('Pages.CFO.MainInstanceAccess') || this.featureService.isEnabled('CFO.Partner')) {
            this.router.navigate([this.permissionChecker.isGranted('Pages.CFO.MainInstanceAccess') ? '/app/cfo/main' : '/app/cfo/user' ]);
        }
        return false;
    }
}

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: AppComponent,
                children: [
                    {
                        path: '',
                        children: [
                            { path: 'notifications', component: NotificationsComponent },
                            { path: 'access-denied', component: AccessDeniedComponent }
                        ],
                        data: { permission: 'Pages.Detect.Route' }
                    },
                    {
                        path: 'admin',
                        loadChildren: 'app/admin/admin.module#AdminModule', //Lazy load admin module
                        data: { preload: false }
                    },
                    {
                        path: 'api',
                        loadChildren: 'app/api/api.module#ApiModule', //Lazy load main module
                        data: { preload: false }
                    },
                    {
                        path: 'crm',
                        loadChildren: 'app/crm/crm.module#CrmModule', //Lazy load admin module
                        resolve: { crm: ModulePathResolverService },
                        data: { preload: false }
                    },
                    {
                        path: 'cfo',
                        canActivate: [ CfoActivateService ]
                    },
                    {
                        path: 'cfo/:instance',
                        loadChildren: 'app/cfo/cfo.module#CfoModule', //Lazy load cfo *module
                        data: { preload: false },
                        resolve: { cfo: ModulePathResolverService }
                    }
                ]
            }
        ])
    ],
    exports: [ RouterModule ],
    providers: [ ModulePathResolverService, CfoActivateService ]
})
export class AppRoutingModule {
    constructor(
        private router: Router
    ) {
        router.events.subscribe((event) => {

            if (event instanceof RouteConfigLoadStart) {
                abp.ui.setBusy();
            }

            if (event instanceof RouteConfigLoadEnd) {
                abp.ui.clearBusy();
            }

            if (event instanceof NavigationEnd) {
                $('meta[property=og\\:url]').attr('content', window.location.href);
                $('#m_aside_left').mOffcanvas().hide();
            }

        });
    }
}
