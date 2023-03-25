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
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';

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
                        loadChildren: () => import('app/admin/admin.module').then(m => m.AdminModule), //Lazy load admin module
                        resolve: { admin: ModulePathResolverService },
                        data: { feature: AppFeatures.Admin, permission: AppPermissions.Administration, localizationSource: 'Platform' }
                    },
                    {
                        path: 'api',
                        loadChildren: () => import('app/api/api.module').then(m => m.ApiModule), //Lazy load main module
                        resolve: { api: ModulePathResolverService },
                        data: { feature: AppFeatures.API, permission: AppPermissions.API, localizationSource: 'Platform' }
                    },
                    {
                        path: 'crm',
                        loadChildren: () => import('app/crm/crm.module').then(m => m.CrmModule), //Lazy load admin module
                        resolve: { crm: ModulePathResolverService },
                        data: { feature: AppFeatures.CRM, permission: AppPermissions.CRM, localizationSource: 'CRM' }
                    },
                    {
                        path: 'slice',
                        redirectTo: 'crm',
                        data: { localizationSource: 'CRM' }
                    },
                    {
                        path: 'pfm',
                        loadChildren: () => import('app/pfm/pfm.module').then(m => m.PfmModule), //Lazy load admin module
                        resolve: { crm: ModulePathResolverService },
                        data: { feature: AppFeatures.PFM, permission: AppPermissions.PFM, localizationSource: 'PFM' }
                    },
                    {
                        path: 'cfo',
                        canActivate: [ CfoActivateService ]
                    },
                    {
                        path: 'cfo/:instance',
                        loadChildren: () => import('app/cfo/cfo.module').then(m => m.CfoModule), //Lazy load cfo *module
                        data: { feature: AppFeatures.CFO, permission: AppPermissions.CFO, localizationSource: 'CFO' },
                        resolve: { cfo: ModulePathResolverService }
                    },
                    {
                        path: 'cfo-portal',
                        loadChildren: () => import('app/cfo-portal/cfo-portal.module').then(m => m.CfoPortalModule), //Lazy load cfo-portal *module
                        data: { feature: AppFeatures.CFOPartner, permission: AppPermissions.CFOMemberAccess, localizationSource: 'CFO' },
                        resolve: { cfo: ModulePathResolverService }
                    },
                    {
                        path: 'hub',
                        loadChildren: () => import('app/hub/hub.module').then(m => m.HubModule), //Lazy load cfo *module
                        data: { feature: AppFeatures.HUB, localizationSource: 'HUB' },
                        resolve: { hub: ModulePathResolverService }
                    }
                ]
            }
        ])
    ],
    exports: [ RouterModule ],
    providers: [ ModulePathResolverService, CfoActivateService ]
})
export class AppRoutingModule {
    constructor(private router: Router) {
        router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                $('meta[property=og\\:url]').attr('content', window.location.href);
                $('#m_aside_left').mOffcanvas().hide();
            }
        });
    }
}