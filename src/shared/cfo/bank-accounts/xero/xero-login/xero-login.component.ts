import { Component, Injector, Output, EventEmitter, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SyncAccountServiceProxy } from 'shared/service-proxies/service-proxies';
import { XeroLoginDialogComponent } from '../xero-login-dialog/xero-login-dialog.component';

@Component({
    selector: 'xero-login',
    templateUrl: './xero-login.component.html',
    styleUrls: ['./xero-login.component.less'],
    providers: [SyncAccountServiceProxy]
})
export class XeroLoginButtonComponent extends CFOComponentBase {
    @ViewChild(XeroLoginDialogComponent) xeroLoginDialog: XeroLoginDialogComponent;
    @Output() onComplete = new EventEmitter();

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    addAccount(): void {
        this.xeroLoginDialog.show();
    }
}
