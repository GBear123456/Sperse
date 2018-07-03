import { Component, OnInit, Injector, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SyncAccountServiceProxy, CreateSyncAccountInput, InstanceType } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'xero-login',
    templateUrl: './xero-login.component.html',
    styleUrls: ['./xero-login.component.less'],
    providers: [SyncAccountServiceProxy]
})
export class XeroLoginButtonComponent extends CFOComponentBase {
    popupVisible = false;
    consumerKey: string;
    consumerSecret: string;
    constructor(
        injector: Injector,
        private _syncAccountServiceProxy: SyncAccountServiceProxy
    ) {
        super(injector);
    }

    addAccount(): void {
        this.popupVisible = true;
    }

    connectToXero(e) {
        abp.ui.setBusy();
        this._syncAccountServiceProxy.createSyncAccount(InstanceType[this.instanceType], this.instanceId,
            new CreateSyncAccountInput({
                consumerKey: this.consumerKey,
                consumerSecret: this.consumerSecret,
                typeId: 'X',
                syncRef: null
            }))
            .finally(() => {
                abp.ui.clearBusy();
                this.popupVisible = false;
                this.consumerKey = null;
                this.consumerSecret = null;
            })
            .subscribe((result) => {
            });
    }
}
