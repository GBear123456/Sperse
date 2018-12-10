import { NgModule, ApplicationRef, Injector, Injectable, AfterViewInit } from '@angular/core';
import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot, RouterModule, Route, Router, Routes, NavigationEnd, PreloadingStrategy } from '@angular/router';
import { AppRootComponent } from 'root.components';
import { RouteGuard } from '@shared/common/auth/route-guard';

import { Observable, of } from 'rxjs';

@Injectable()
export class CustomReuseStrategy implements RouteReuseStrategy {
    private handlers: {[key: string]: DetachedRouteHandle} = {};
    private activateTimeout: any;

    constructor(
        private _injector: Injector
    ) {
    }

    private getKey(route: ActivatedRouteSnapshot) {
        return route && route.routeConfig.path;
    }

    private checkSameRoute(route, handle) {
        return handle && (handle.route.value.snapshot.routeConfig == route.routeConfig);
    }

    invalidate(key: string) {
        if (this.handlers[key])
            (<any>this.handlers[key]).componentRef.instance.invalidate();
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
        return this.checkSameRoute(route, <any>this.handlers[this.getKey(route)]);
    }

    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
        if (!route.routeConfig || route.routeConfig.loadChildren)
            return null;

        let handle = <any>this.handlers[this.getKey(route)];
        if (handle && handle.componentRef.instance.activate) {
            clearTimeout(this.activateTimeout);
            this.activateTimeout = setTimeout(() => {
                let router = this._injector.get(Router);
                if (route['_routerState'].url == router.url)
                    handle.componentRef.instance.activate();
            });
        }
        return (this.checkSameRoute(route, handle) ? handle : null);
    }

    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        return (future.routeConfig === curr.routeConfig);
    }
}

@Injectable()
export class AppPreloadingStrategy implements PreloadingStrategy {
    preload(route: Route, load: Function): Observable<any> {
        return abp.session.userId && (!route.data || !route.data.feature || abp.features.isEnabled(route.data.feature)) ? load(): of(null);
    }
}

const routes: Routes = [{
    path: '',
    canActivate: [ RouteGuard ],
    canActivateChild: [ RouteGuard ],
    children: [
            {
                path: 'account',
                loadChildren: 'account/account.module#AccountModule', //Lazy load account module
            },
            {
                path: 'personal-finance',
                loadChildren: 'personal-finance/personal-finance.module#PersonalFinanceModule', //Lazy load account module
                data: { feature: 'PFM' }
            },
            {
                path: 'app',
                loadChildren: 'app/app.module#AppModule', //Lazy load desktop module
                data: { feature: 'Admin' }
            }
        ]
    },
    {
        path: '**',
        loadChildren: 'shared/not-found/not-found.module#NotFoundModule',
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { 
            preloadingStrategy: AppPreloadingStrategy
        })
    ],
    exports: [
        RouterModule
    ]
})

export class RootRoutingModule implements AfterViewInit {
    constructor(
        private _injector: Injector,
        private _router: Router,
        private _applicationRef: ApplicationRef
    ) {}

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