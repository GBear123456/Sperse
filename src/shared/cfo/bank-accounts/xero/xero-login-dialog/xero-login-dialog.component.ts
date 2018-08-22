import { Component, Injector, Output, EventEmitter, Input } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import {
    SyncAccountServiceProxy, CreateSyncAccountInput, InstanceType,
    UpdateSyncAccountInput
} from 'shared/service-proxies/service-proxies';
import { finalize } from 'rxjs/operators';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'xero-login-dialog',
    templateUrl: './xero-login-dialog.component.html',
    styleUrls: ['./xero-login-dialog.component.less'],
    providers: [SyncAccountServiceProxy]
})
export class XeroLoginDialogComponent extends CFOComponentBase {
    @Input() operationType: 'add' | 'update' = 'add';
    @Output() onComplete = new EventEmitter();
    showForm = false;
    popupVisible = false;
    consumerKey: string;
    consumerSecret: string;
    isSyncBankAccountsEnabled = true;
    getXeroCertificateUrl: string;
    accountId: number;

    constructor(
        injector: Injector,
        private _syncAccountServiceProxy: SyncAccountServiceProxy
    ) {
        super(injector);
        this.getXeroCertificateUrl = AppConsts.remoteServiceBaseUrl + '/Xero/GetCertificate';
    }

    show(data: {id: number} = null): void {
        if (data && data.id) {
            this.accountId = data.id;
        }
        this.popupVisible = true;
    }

    hide(): void {
        this.showForm = false;
        this.popupVisible = false;
    }

    onClick(event) {
        let result = event.validationGroup.validate();
        if (result.isValid) {
            if (this.operationType === 'add')
                this.connectToXero(event);
            else
                this.updateSyncAccount();
        }
    }

    connectToXero(e) {
        abp.ui.setBusy(document.querySelector('.dx-overlay-wrapper.xeroLoginDialog .dx-overlay-content'));
        this._syncAccountServiceProxy.create(InstanceType[this.instanceType], this.instanceId,
            new CreateSyncAccountInput({
                typeId: 'X',
                consumerKey: this.consumerKey,
                consumerSecret: this.consumerSecret,
                isSyncBankAccountsEnabled: this.isSyncBankAccountsEnabled
            }))
            .pipe(finalize(this.finalize))
            .subscribe((result) => {
                this.onComplete.emit();
            });
    }

    updateSyncAccount() {
        if (this.accountId) {
            abp.ui.setBusy(document.querySelector('.dx-overlay-wrapper.xeroLoginDialog .dx-overlay-content'));
            this._syncAccountServiceProxy.update(InstanceType[this.instanceType], this.instanceId,
                new UpdateSyncAccountInput({
                    id: this.accountId,
                    consumerKey: this.consumerKey,
                    consumerSecret: this.consumerSecret
                }))
                .pipe(finalize(this.finalize))
                .subscribe((res) => {
                    this.onComplete.emit();
                });
        }
    }

    finalize = () => {
        abp.ui.clearBusy();
        this.hide();
        this.consumerKey = null;
        this.consumerSecret = null;
    }
}
