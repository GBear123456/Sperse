import { NgModule, ApplicationRef, Injector, Injectable, AfterViewInit } from '@angular/core';
import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot, Routes, RouterModule, Router, NavigationEnd } from '@angular/router';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppConsts } from '@shared/AppConsts';
import { AppRootComponent } from 'root.components';

@Injectable()
export class CustomReuseStrategy implements RouteReuseStrategy {
    private handlers: {[key: string]: DetachedRouteHandle} = {};
    private activateTimeout: any;

    private getKey(route: ActivatedRouteSnapshot) {
        return route && route.routeConfig.path;
    }
    
    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        if (!route.routeConfig || route.routeConfig.loadChildren)
            return false;

        return route.routeConfig.data && route.routeConfig.data.reuse;
    }

    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        if (handle && (<any>handle).componentRef.instance.deactivate)
            (<any>handle).componentRef.instance.deactivate();             
        this.handlers[this.getKey(route)] = handle;
    }

    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        return Boolean(this.handlers[this.getKey(route)]);
    }

    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
        if (!route.routeConfig || route.routeConfig.loadChildren) 
            return null;

        let handle = <any>this.handlers[this.getKey(route)];
        if (handle && handle.componentRef.instance.activate) {
            clearTimeout(this.activateTimeout);
            this.activateTimeout = setTimeout(() => 
                handle.componentRef.instance.activate());
        }
        return handle;
    }

    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        return (future.routeConfig === curr.routeConfig);
    }
}

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
                   ? '/app/cfo/main/start'
                   : '/app/crm/start',
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
