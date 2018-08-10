import { Injectable } from '@angular/core';
import { CFOServiceBase } from 'shared/cfo/cfo-service-base';
import { InstanceServiceProxy, InstanceType, GetStatusOutputStatus } from 'shared/service-proxies/service-proxies';

@Injectable()
export class UserOnlyCFOService extends CFOServiceBase {

    constructor(
        private _instanceServiceProxy: InstanceServiceProxy
    ) {
        super();

        this.instanceType = InstanceType.User;
    }

    instanceChangeProcess(callback: any = null) {
        this._instanceServiceProxy.getStatus(<any>InstanceType.User, this.instanceId).subscribe((data) => {
            this.initialized = data.status == GetStatusOutputStatus.Active && data.hasSyncAccounts;
            this.hasTransactions = this.initialized && data.hasTransactions;
            callback && callback.call(this, this.hasTransactions);
        });
    }
}
