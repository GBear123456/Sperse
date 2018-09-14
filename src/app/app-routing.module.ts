import { NgModule } from '@angular/core';
import { NavigationEnd, RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { AppRouteGuard } from '@shared/common/auth/auth-route-guard';
import { NotificationsComponent } from './shared/layout/notifications/notifications.component';
import { AccessDeniedComponent } from '@app/main/access-denied/access-denied.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: AppComponent,
                canActivate: [ AppRouteGuard ],
                canActivateChild: [ AppRouteGuard ],
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
                        data: { preload: false }
                    },
                   {
                        path: 'contacts',
                        loadChildren: 'app/crm/clients/details/client-details.module#ClientDetailsModule', //Lazy load contacts module
                        data: { preload: false }
                    },
                    {
                        path: 'cfo/:instance',
                        loadChildren: 'app/cfo/cfo.module#CfoModule', //Lazy load cfo *module
                        data: { preload: false }
                    },
                    { path: '**', redirectTo: 'notifications' }
                ]
            }
        ])
    ],
    exports: [RouterModule]
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