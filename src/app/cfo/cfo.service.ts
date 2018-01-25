import { Injectable, Input } from "@angular/core";
import { AppService } from "app/app.service";
import { InstanceServiceProxy, InstanceType, GetStatusOutputStatus, CustomersServiceProxy } from "shared/service-proxies/service-proxies";
import { ActivatedRoute } from "@angular/router";

@Injectable()
export class CFOService {
    instanceId: number;
    instanceType: string;
    initialized: boolean;

    constructor(
        protected _route: ActivatedRoute,
        private _appService: AppService,
        private _instanceServiceProxy: InstanceServiceProxy,
        private _customerService: CustomersServiceProxy
    ) {
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

    initContactInfo(userId) {
        this._customerService.getContactInfoByUser(userId).subscribe(response => {
            this._appService.contactInfo = response;
        });
    }

    instanceChangeProcess(callback: any = null) {
        if (this.instanceId != null)
            this._appService.setContactInfoVisibility(true);
        this._instanceServiceProxy.getStatus(InstanceType[this.instanceType], this.instanceId).subscribe((data) => {
            if (this.instanceId && data.userId)
                this.initContactInfo(data.userId);
            this.initialized = (data.status == GetStatusOutputStatus.Active) && data.hasSyncAccounts;
            let hasTransactions = this.initialized && data.hasTransactions;            
            this._appService.topMenu.items
                .forEach((item, i) => {
                    if (i == 0) {
                        item.text = this.initialized ? 'Dashboard' : 'Setup';
                    }
                    else {
                        if (i == 1) {
                            item.disabled = !this.initialized;
                        }
                        else {
                            if (i !== this._appService.topMenu.items.length - 1) {
                                item.disabled = !hasTransactions;
                            }
                        }
                    }
                });
            callback && callback.call(this, hasTransactions);
        });
    }
}
