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

/** Application imports */
import { AppComponent } from './app.component';
import { AccessDeniedComponent } from '@app/main/access-denied/access-denied.component';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Injectable()
export class ModulePathResolverService implements Resolve<any> {
    constructor(
        private cacheService: CacheService,
        private sessionService: AppSessionService
    ) {}

    resolve(route: ActivatedRouteSnapshot) {
        if (this.sessionService.userId && !location.pathname.match(/app\/cfo\/\d*\//))
            this.cacheService.set('lastVisitedModule_' + this.sessionService.tenantId + '_' + this.sessionService.userId, route.url[0].path);
        return of('');
    }
}

@Injectable()
export class CfoActivateService implements CanActivate {
    constructor(
        private router: Router,
        private permissionChecker: AppPermissionService,
        private featureService: FeatureCheckerService
    ) {}

    canActivate() {
        if (this.permissionChecker.isGranted(AppPermissions.CFOMainInstanceAccess)) {
            this.router.navigate(['/app/cfo/main']);
        } else if (this.featureService.isEnabled(AppFeatures.CFOPartner) && this.permissionChecker.isGranted(AppPermissions.CFOMemberAccess)) {
            this.router.navigate(['/app/cfo-portal']);
        } else {
            this.router.navigate(['/app/access-denied']);
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
                        data: { permission: 'Detect.Route' }
                    },
                    { path: 'access-denied', component: AccessDeniedComponent },
                    {
                        path: 'admin',
                        loadChildren: 'app/admin/admin.module#AdminModule', //Lazy load admin module
                        resolve: { admin: ModulePathResolverService },
                        data: { feature: 'Admin', localizationSource: 'Platform' }
                    },
                    {
                        path: 'api',
                        loadChildren: 'app/api/api.module#ApiModule', //Lazy load main module
                        resolve: { api: ModulePathResolverService },
                        data: { feature: 'API', localizationSource: 'Platform' }
                    },
                    {
                        path: 'crm',
                        loadChildren: 'app/crm/crm.module#CrmModule', //Lazy load admin module
                        resolve: { crm: ModulePathResolverService },
                        data: { feature: 'CRM', localizationSource: 'CRM' }
                    },
                    {
                        path: 'slice',
                        redirectTo: 'crm'
                    },
                    {
                        path: 'pfm',
                        loadChildren: 'app/pfm/pfm.module#PfmModule', //Lazy load admin module
                        resolve: { crm: ModulePathResolverService },
                        data: { feature: 'PFM', localizationSource: 'PFM' }
                    },
                    {
                        path: 'cfo',
                        canActivate: [ CfoActivateService ]
                    },
                    {
                        path: 'cfo/:instance',
                        loadChildren: 'app/cfo/cfo.module#CfoModule', //Lazy load cfo *module
                        data: { feature: 'CFO', localizationSource: 'CFO' },
                        resolve: { cfo: ModulePathResolverService }
                    },
                    {
                        path: 'cfo-portal',
                        loadChildren: 'app/cfo-portal/cfo-portal.module#CfoPortalModule', //Lazy load cfo-portal *module
                        data: { feature: 'CFO.Partner', permission: AppPermissions.CFOMemberAccess, localizationSource: 'CFO' },
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
        private router: Router,
        private loadingService: LoadingService
    ) {
        router.events.subscribe((event) => {

            if (event instanceof RouteConfigLoadStart) {
                /** If initial spinner is showing - then avoid showing of the default one */
                if (!this.loadingService.showInitialSpinner) {
                    abp.ui.setBusy();
                }
            }

            if (event instanceof RouteConfigLoadEnd) {
                this.loadingService.showInitialSpinner = false;
                abp.ui.clearBusy();
            }

            if (event instanceof NavigationEnd) {
                $('meta[property=og\\:url]').attr('content', window.location.href);
                $('#m_aside_left').mOffcanvas().hide();
            }

        });
    }
}
