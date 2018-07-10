import { Component, OnInit, Injector, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SyncAccountServiceProxy, CreateSyncAccountInput, InstanceType } from 'shared/service-proxies/service-proxies';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'xero-login-dialog',
    templateUrl: './xero-login-dialog.component.html',
    styleUrls: ['./xero-login-dialog.component.less'],
    providers: [SyncAccountServiceProxy]
})
export class XeroLoginDialogComponent extends CFOComponentBase {
    @Output() onComplete = new EventEmitter();

    popupVisible = false;
    consumerKey: string;
    consumerSecret: string;

    constructor(
        injector: Injector,
        private _syncAccountServiceProxy: SyncAccountServiceProxy
    ) {
        super(injector);
    }

    show(): void {
        this.popupVisible = true;
    }

    hide(): void {
        this.popupVisible = false;
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
            .pipe(finalize(() => {
                abp.ui.clearBusy();

                this.hide();

                this.consumerKey = null;
                this.consumerSecret = null;
            }))
            .subscribe((result) => {
                this.onComplete.emit();
            });
    }
}
