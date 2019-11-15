import { NgModule, ApplicationRef, Injector, Injectable, AfterViewInit } from '@angular/core';
import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot, RouterModule, Route, Router, Routes, NavigationEnd, PreloadingStrategy } from '@angular/router';
import { Observable, of } from 'rxjs';
import { RouteGuard } from '@shared/common/auth/route-guard';
import { LocalizationResolver } from '@shared/common/localization-resolver';

@Injectable()
export class CustomReuseStrategy implements RouteReuseStrategy {
    private handlers: {[key: string]: DetachedRouteHandle} = {};
    private activateTimeout: any;

    constructor(
        private injector: Injector
    ) {}

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
        if (handle && (<any>handle).componentRef.instance.deactivate && this.componentIsTheSame(route, handle))
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
        if (handle && handle.componentRef.instance.activate && this.componentIsTheSame(route, handle)) {
            clearTimeout(this.activateTimeout);
            this.activateTimeout = setTimeout(() => {
                let router = this.injector.get(Router);
                if (route['_routerState'].url == router.url)
                    handle.componentRef.instance.activate();
            });
        }
        return (this.checkSameRoute(route, handle) ? handle : null);
    }

    private componentIsTheSame(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle) {
        return (<any>handle).componentRef.instance.constructor === route.routeConfig.component;
    }

    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        return future.routeConfig === curr.routeConfig;
    }
}

@Injectable()
export class AppPreloadingStrategy implements PreloadingStrategy {
    preload(route: Route, load: Function): Observable<any> {
        //return abp.session.userId && (!route.data || !route.data.feature || abp.features.isEnabled(route.data.feature)) ? load() : of(null);
        return of(null);
    }
}

const routes: Routes = [
    {
        path: '',
        canActivate: [ RouteGuard ],
        canActivateChild: [ RouteGuard, LocalizationResolver ],
        children: [
            {
                path: 'account',
                loadChildren: 'account/account.module#AccountModule', //Lazy load account module
            },
            {
                path: 'personal-finance',
                loadChildren: 'personal-finance/personal-finance.module#PersonalFinanceModule', //Lazy load account module
                data: { feature: 'PFM', localizationSource: 'PFM' }
            },
            {
                path: 'code-breaker',
                loadChildren: 'bank-code/bank-code.module#BankCodeModule', //Lazy load bank code module
                data: { localizationSource: 'Platform' }
            },
            {
                path: 'app',
                loadChildren: 'app/app.module#AppModule', //Lazy load desktop module
                data: { localizationSource: 'Platform' }
            }
        ]
    },
    {
        path: '**',
        canActivateChild: [ LocalizationResolver ],
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
    ],
    providers: [LocalizationResolver]
})

export class RootRoutingModule implements AfterViewInit {
    constructor(
        private injector: Injector,
        private router: Router,
        private applicationRef: ApplicationRef
    ) {}

    ngAfterViewInit() {
        this.router.events.subscribe((event: NavigationEnd) => {
                setTimeout(() => {
                    this.injector.get(this.applicationRef.componentTypes[0])
                        .checkSetClasses(abp.session.userId || (event.url.indexOf('/account/') >= 0));
                }, 0);
            }
        );
    }
}
