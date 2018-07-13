import { Component, OnInit, Injector, Output, EventEmitter, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SyncAccountServiceProxy, CreateSyncAccountInput, InstanceType } from 'shared/service-proxies/service-proxies';
import { XeroLoginDialogComponent } from '@app/cfo/shared/common/xero/xero-login-dialog/xero-login-dialog.component';

@Component({
    selector: 'xero-login',
    templateUrl: './xero-login.component.html',
    styleUrls: ['./xero-login.component.less'],
    providers: [SyncAccountServiceProxy]
})
export class XeroLoginButtonComponent extends CFOComponentBase {
    @ViewChild(XeroLoginDialogComponent) xeroLoginDialog: XeroLoginDialogComponent;
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

    addAccount(): void {
        this.xeroLoginDialog.show();
    }
}
