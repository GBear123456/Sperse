import { NgModule, ApplicationRef, Injector, AfterViewInit } from '@angular/core';
import { Routes, RouterModule, Router, NavigationEnd } from '@angular/router';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppConsts } from '@shared/AppConsts';
import { AppRootComponent } from 'root.components';

const routes: Routes = [{
    path: '',
    component: AppRootComponent,
    children: [
        {
            path: 'account',
            loadChildren: 'account/account.module#AccountModule', //Lazy load account module
            data: {preload: true}
        },
        {
            path: 'mobile',
            loadChildren: 'mobile/mobile.module#MobileModule', //Lazy load mobile module
            data: {preload: true}
        },
        {
            path: 'desktop',
            loadChildren: 'app/app.module#AppModule', //Lazy load desktop module
            data: {preload: true}
        }
    ]
}];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class RootRoutingModule implements AfterViewInit {
    constructor(private _router: Router,
                private _injector: Injector,
                private _applicationRef: ApplicationRef
    ) {
        _router.config[0].children.push(
           {
               path: '',
               redirectTo: AppConsts.isMobile
                   ? '/app/cfo/user/start'
                   : '/app/main/start',
               pathMatch: 'full'
           },
           {
               path: 'app',
               loadChildren: AppConsts.isMobile
                   ? 'mobile/mobile.module#MobileModule' //Lazy load mobile module
                   : 'app/app.module#AppModule',         //Lazy load desktop module
               data: {preload: true}
           }
        );
        _router.resetConfig(_router.config);
    }

    ngAfterViewInit() {
        this._router.events.subscribe((event: NavigationEnd) => {
                setTimeout(() => {
                    this._injector.get(this._applicationRef.componentTypes[0])
                        .checkSetClasses(abp.session.userId || (event.url.indexOf('/account/') >= 0));
                }, 0);
            }
        );
    }

    getSetting(key: string): string {
        return abp.setting.get(key);
    }
}
