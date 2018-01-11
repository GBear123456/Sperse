import { Injectable, Input } from "@angular/core";
import { AppService } from "app/app.service";
import { InstanceServiceProxy, InstanceType, GetStatusOutputStatus } from "shared/service-proxies/service-proxies";
import { ActivatedRoute } from "@angular/router";

@Injectable()
export class CFOService {
    instanceId: number;
    instanceType: string;
    initialized: boolean;

    constructor(
        protected _route: ActivatedRoute,
        private _appService: AppService,
        private _instanceServiceProxy: InstanceServiceProxy) {

        _appService.subscribeModuleChange((config) => {
            this.instanceId = undefined;
            this.instanceType = undefined;
            this.initialized = undefined;

            if (config['name'] == 'CFO') {
                this._appService.topMenu.items
                    .forEach((item, i) => {
                        if (i != 0) {
                            item.disabled = true;
                        }
                    });
            }
        });
    }

    instanceChangeProcess() {
        this._instanceServiceProxy.getStatus(InstanceType[this.instanceType]).subscribe((data) => {
            this.initialized = (data.status == GetStatusOutputStatus.Active);
            this._appService.topMenu.items
                .forEach((item, i) => {
                    if (i == 0) {
                        item.text = this.initialized ? 'Dashboard' : 'Setup';
                    } else {
                        if (i !== this._appService.topMenu.items.length - 1)
                        {
                            item.disabled = !this.initialized;
                        }
                    }
                });
        });
    }
}
