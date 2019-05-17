import { Injectable } from '@angular/core';
import { CFOServiceBase } from './cfo-service-base';
import { InstanceServiceProxy, InstanceType, GetStatusOutputStatus } from 'shared/service-proxies/service-proxies';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class UserOnlyCFOService extends CFOServiceBase {    
    get instanceType() {
        return InstanceType.User;
    }
    set instanceType(val) { }

    constructor(
        private _instanceServiceProxy: InstanceServiceProxy
    ) {
        super();
      
        this.hasStaticInstance = true;
        this.instanceTypeChanged.next(this.instanceType);
        this.statusActive = new BehaviorSubject(false);
    }

    instanceChangeProcess(callback: any = null, invalidateServerCache: boolean = false) {
        this._instanceServiceProxy.getStatus(<any>InstanceType.User, this.instanceId, invalidateServerCache).subscribe((data) => {
            const statusActive = data.status == GetStatusOutputStatus.Active;
            this.statusActive.next(statusActive);
            this.initialized = statusActive && data.hasSyncAccounts;
            this.hasTransactions = this.initialized && data.hasTransactions;
            callback && callback.call(this, this.hasTransactions);
        });
    }
}