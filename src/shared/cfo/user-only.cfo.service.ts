import { Injectable } from '@angular/core';
import { CFOServiceBase } from './cfo-service-base';
import { InstanceType, InstanceStatus, MyFinancesServiceProxy } from 'shared/service-proxies/service-proxies';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class UserOnlyCFOService extends CFOServiceBase {
    get instanceType() {
        return InstanceType.User;
    }
    set instanceType(val) { }

    constructor(
        private _myFinancesService: MyFinancesServiceProxy
    ) {
        super();

        this.hasStaticInstance = true;
        this.isForUser = true;

        this.instanceTypeChanged.next(this.instanceType);
        this.statusActive = new BehaviorSubject(false);
    }

    instanceChangeProcess(invalidateServerCache: boolean = false) {
        return this._myFinancesService.getUserInstanceStatus().pipe(map(data => {
            const statusActive = data.status == InstanceStatus.Active;
            this.statusActive.next(statusActive);
            this.initialized = statusActive;
            this.hasTransactions = this.initialized && data.hasTransactions;
            return this.hasTransactions;
        }));
    }
}
