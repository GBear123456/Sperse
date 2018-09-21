import { NgModule } from '@angular/core';
import { RouterModule, Router, NavigationEnd, RouteConfigLoadStart, RouteConfigLoadEnd } from '@angular/router';
import { AppComponent } from './mobile.component';
import { RouteGuard } from '@shared/common/auth/route-guard';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: AppComponent,
                canActivate: [RouteGuard],
                canActivateChild: [RouteGuard],
                children: [
                    {
                        path: 'cfo/:instance',
                        loadChildren: 'mobile/cfo/cfo.module#CfoModule', //Lazy load cfo *module
                        data: { preload: true }
                    }
                ]
            }
        ])
    ],
    exports: [RouterModule]
})

export class MobileRoutingModule {
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
            }

        });
    }
}
