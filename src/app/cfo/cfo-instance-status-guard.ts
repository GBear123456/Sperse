/** Core imports */
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

/** Third party imports */
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

/** Application imports */
import { InstanceServiceProxy, InstanceType, GetStatusOutput } from '@shared/service-proxies/service-proxies';
import { CFOService } from '@shared/cfo/cfo.service';

@Injectable()
export class CfoInstanceStatusGuard implements CanActivate {
    constructor(
        private router: Router,
        private cfoService: CFOService,
        private instanceServiceProxy: InstanceServiceProxy
    ) {   }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        /** Setup instance before moving to the page if it hasn't initialized yet */
        return this.cfoService.initialized ? this.instanceTypeCheckProcess(state.url) :
            this.cfoService.instanceChangeProcess().pipe(switchMap(() => this.instanceTypeCheckProcess(state.url)));
    }

    instanceTypeCheckProcess(url: string) {
        let urlParts = url.match(/\/app\/cfo\/(\d+)/i),
            instanceId: any = urlParts && parseInt(urlParts.pop());

        if (instanceId && this.cfoService.userId == abp.session.userId) {
            this.router.navigateByUrl(url.replace('cfo/' + this.cfoService.instanceId, 'cfo-portal'));
            return of(false);
        } else
            return this.setup();
    }

    setup(): Observable<boolean> {
        if (!this.cfoService.statusActive.value)
            return this.instanceServiceProxy.setup(InstanceType[this.cfoService.instanceType], undefined).pipe(
                map(() => true), catchError(() => of(false))
            );
        return of(true);
    }
}