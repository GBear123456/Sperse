import { CanActivate } from '@angular/router';
import { Injectable } from '@angular/core';
import { CFOService } from '@shared/cfo/cfo.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { InstanceServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';

@Injectable()
export class CfoInstanceStatusGuard implements CanActivate {
    constructor(
        private cfoService: CFOService,
        private instanceServiceProxy: InstanceServiceProxy
    ) {}

    canActivate() {
        /** Setup instance before moving to the page if it hasn't initialized yet */
        if (this.cfoService.initialized)
            return this.setup();
        else
            return Observable.create(observer =>
                this.cfoService.instanceChangeProcess(() => {
                    observer.next(this.setup());
                })
            );

    }

    setup() {
        if (!this.cfoService.statusActive.value)
            return this.instanceServiceProxy.setup(InstanceType[this.cfoService.instanceType], undefined).pipe(
                map(() => true),
                catchError(() => of(false))
            );
        return true;
    }
}