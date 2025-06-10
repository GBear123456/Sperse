import { Injectable } from '@angular/core';
import { CFOServiceBase } from '@shared/cfo/cfo-service-base';
import { InstanceServiceProxy, InstanceType, InstanceStatus } from '@shared/service-proxies/service-proxies';

@Injectable()
export class CFOService extends CFOServiceBase {

    constructor(private instanceServiceProxy: InstanceServiceProxy) {
        super();
    }

    instanceChangeProcess() {
        this.instanceServiceProxy.getStatus(InstanceType[this.instanceType], this.instanceId, false).subscribe((data) => {
            this.initialized = (data.status == InstanceStatus.Active) && data.hasSyncAccounts;
        });
    }
}
