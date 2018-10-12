import { Injectable } from '@angular/core';
import { AppService } from '@app/app.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { CFOServiceBase } from 'shared/cfo/cfo-service-base';
import { InstanceServiceProxy, InstanceType, GetStatusOutputStatus, ContactServiceProxy } from 'shared/service-proxies/service-proxies';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class CFOService extends CFOServiceBase {
    instanceTypeChanged: Subject<string> = new Subject<null>();
    instanceTypeChanged$: Observable<string> = this.instanceTypeChanged.asObservable();

    constructor(
        private _appService: AppService,
        private _layoutService: LayoutService,
        private _instanceServiceProxy: InstanceServiceProxy,
        private _contactService: ContactServiceProxy
    ) {
        super();

        _appService.subscribeModuleChange((config) => {
            if (config['name'] == 'CFO') {
                if (this.initialized === undefined) {
                    this._appService.topMenu.items
                        .forEach((item, i) => {
                            if (i != 0) {
                                item.disabled = true;
                            }
                        });
                    if (this.instanceType !== undefined) {
                        this.instanceChangeProcess();
                    }
                } else {
                    this.updateMenuItems();
                }
            }
        });
    }

    initContactInfo(userId) {
        this._contactService.getContactInfoByUser(userId).subscribe(response => {
            this._appService.contactInfo = response;
        });
    }

    instanceChangeProcess(callback: any = null) {
        if (this.instanceId != null) {
            this._appService.setContactInfoVisibility(true);
            this._layoutService.hideDefaultPageHeader();
        }
        this._instanceServiceProxy.getStatus(InstanceType[this.instanceType], this.instanceId).subscribe((data) => {
            if (this.instanceId && data.userId)
                this.initContactInfo(data.userId);
            this.initialized = (data.status == GetStatusOutputStatus.Active) && data.hasSyncAccounts;
            this.hasTransactions = this.initialized && data.hasTransactions;
            this.updateMenuItems();
            callback && callback.call(this, this.hasTransactions);
        });
    }

    private updateMenuItems() {
        this._appService.topMenu.items
            .forEach((item, i) => {
                if (i == 0) {
                    item.text = this.initialized ? 'Dashboard' : 'Setup';
                } else if (i == 1) {
                    item.disabled = !this.initialized;
                } else {
                    item.disabled = !this.hasTransactions;
                }
            });
    }
}
