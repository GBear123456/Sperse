import { Component, Injector, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CFOComponentBase } from 'shared/cfo/cfo-component-base';
import {
    SyncAccountServiceProxy, CreateSyncAccountInput, InstanceType,
    UpdateSyncAccountInput
} from 'shared/service-proxies/service-proxies';
import { finalize } from 'rxjs/operators';
import { AppConsts } from 'shared/AppConsts';

@Component({
    selector: 'xero-login',
    templateUrl: './xero-login.component.html',
    styleUrls: ['./xero-login.component.less'],
    providers: [ SyncAccountServiceProxy ]
})
export class XeroLoginComponent extends CFOComponentBase implements OnInit {
    @Output() onComplete: EventEmitter<null> = new EventEmitter();
    @Output() onClose: EventEmitter<null> = new EventEmitter();
    @Input() accountId: number;
    @Input() isSyncBankAccountsEnabled = true;
    showForm = false;
    consumerKey: string;
    consumerSecret: string;
    getXeroCertificateUrl: string;
    overlayElement;

    constructor(
        injector: Injector,
        private _syncAccountServiceProxy: SyncAccountServiceProxy
    ) {
        super(injector);
        this.getXeroCertificateUrl = AppConsts.remoteServiceBaseUrl + '/Xero/GetCertificate';
    }

    ngOnInit() {
        this.overlayElement = document.querySelector('.dx-overlay-wrapper.xeroLoginDialog .dx-overlay-content');
    }

    onClick(event) {
        let result = event.validationGroup.validate();
        if (result.isValid) {
            if (this.accountId)
                this.updateSyncAccount();
            else
                this.connectToXero(event);
        }
    }

    connectToXero(e) {
        abp.ui.setBusy(this.overlayElement);
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
        abp.ui.setBusy(this.overlayElement);
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

    finalize = () => {
        abp.ui.clearBusy(this.overlayElement);
        this.onClose.emit();
        this.consumerKey = null;
        this.consumerSecret = null;
    }
}
