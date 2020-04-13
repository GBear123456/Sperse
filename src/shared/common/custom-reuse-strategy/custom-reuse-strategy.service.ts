import { Injectable, Injector } from '@angular/core';
import { ActivatedRouteSnapshot, DetachedRouteHandle, Router, RouteReuseStrategy } from '@angular/router';

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

    keyExists(key: string): boolean {
        return !!this.handlers[key];
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
        if (handle) {
            if ((<any>handle).componentRef.instance.deactivate && this.componentIsTheSame(route, handle))
                (<any>handle).componentRef.instance.deactivate();
            this.handlers[this.getKey(route)] = handle;
        }
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