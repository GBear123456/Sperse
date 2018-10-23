import { Injectable } from '@angular/core';
import { CFOServiceBase } from 'shared/cfo/cfo-service-base';
import { InstanceServiceProxy, InstanceType, GetStatusOutputStatus } from 'shared/service-proxies/service-proxies';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class UserOnlyCFOService extends CFOServiceBase {
    constructor(
        private _instanceServiceProxy: InstanceServiceProxy
    ) {
        super();

        this.instanceType = InstanceType.User;
        this.instanceTypeChanged.next(this.instanceType);
        this.statusActive = new BehaviorSubject(false);
    }

    instanceChangeProcess(callback: any = null) {
        this._instanceServiceProxy.getStatus(<any>InstanceType.User, this.instanceId).subscribe((data) => {
            const statusActive = data.status == GetStatusOutputStatus.Active;
            this.statusActive.next(statusActive);
            this.initialized = statusActive && data.hasSyncAccounts;
            this.hasTransactions = this.initialized && data.hasTransactions;
            callback && callback.call(this, this.hasTransactions);
        });
    }
}
