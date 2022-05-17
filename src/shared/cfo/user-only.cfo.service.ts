import { Injectable } from '@angular/core';
import { CFOServiceBase } from './cfo-service-base';
import { InstanceType } from 'shared/service-proxies/service-proxies';
import { BehaviorSubject } from 'rxjs';
// import { map } from 'rxjs/operators';

@Injectable()
export class UserOnlyCFOService extends CFOServiceBase {
    constructor(
    ) {
        super();

        this.instanceType = InstanceType.User;
        this.hasStaticInstance = true;
        this.isForUser = true;

        this.instance.next({
            instanceType: this.instanceType,
            instanceId: this.instanceId
        });
        this.statusActive = new BehaviorSubject(false);
    }

    /*instanceChangeProcess(invalidateServerCache: boolean = false) {
        return this.myFinancesService.getUserInstanceStatus().pipe(map(data => {
            const statusActive = data.status == InstanceStatus.Active;
            this.statusActive.next(statusActive);
            this.initialized = statusActive;
            this.hasTransactions = this.initialized && data.hasTransactions;
            return this.hasTransactions;
        }));
    }*/
}
