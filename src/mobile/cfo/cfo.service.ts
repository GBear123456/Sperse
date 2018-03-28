import { Injectable } from '@angular/core';
import { CFOServiceBase } from '@shared/cfo/cfo-service-base';
import { InstanceServiceProxy, InstanceType, GetStatusOutputStatus } from '@shared/service-proxies/service-proxies';

@Injectable()
export class CFOService extends CFOServiceBase {

    constructor(private _instanceServiceProxy: InstanceServiceProxy) {
        super();
    }

    instanceChangeProcess() {
        this._instanceServiceProxy.getStatus(InstanceType[this.instanceType], this.instanceId).subscribe((data) => {
            this.initialized = (data.status == GetStatusOutputStatus.Active) && data.hasSyncAccounts;
        });
    }
}
