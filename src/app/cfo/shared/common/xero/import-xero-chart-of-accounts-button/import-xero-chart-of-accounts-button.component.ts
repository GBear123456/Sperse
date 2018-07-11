import { Component, OnInit, Injector, Output, EventEmitter, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SyncAccountServiceProxy, CategoryTreeServiceProxy, InstanceType, SyncDto } from 'shared/service-proxies/service-proxies';
import { XeroLoginDialogComponent } from '@app/cfo/shared/common/xero/xero-login-dialog/xero-login-dialog.component';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'import-xero-chart-of-accounts-button',
    templateUrl: './import-xero-chart-of-accounts-button.component.html',
    styleUrls: ['./import-xero-chart-of-accounts-button.component.less'],
    providers: [SyncAccountServiceProxy, CategoryTreeServiceProxy]
})
export class ImportXeroChartOfAccountsButtonComponent extends CFOComponentBase implements OnInit {
    @ViewChild(XeroLoginDialogComponent) xeroLoginDialog: XeroLoginDialogComponent;
    @Output() onComplete = new EventEmitter();
    @Output() onClose: EventEmitter<any> = new EventEmitter();

    constructor(
        injector: Injector,
        private _syncAccountServiceProxy: SyncAccountServiceProxy,
        private _categoryTreeServiceProxy: CategoryTreeServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    importChartOfAccount(): void {
        abp.ui.setBusy();

        this._syncAccountServiceProxy.getActive(InstanceType[this.instanceType], this.instanceId, 'X')
            .subscribe(result => {
                if (result.length == 0) {
                    abp.ui.clearBusy();
                    this.xeroLoginDialog.isSyncBankAccountsEnabled = false;
                    this.xeroLoginDialog.show();
                } else {
                    let syncInput = SyncDto.fromJS({
                        syncAccountId: result[0]
                    });
                    this._categoryTreeServiceProxy.sync(InstanceType[this.instanceType], this.instanceId, syncInput)
                        .pipe(finalize(() => { abp.ui.clearBusy(); }))
                        .subscribe(result => {
                            this.notify.info(this.l('SavedSuccessfully'));
                            this.onComplete.emit();
                        });
                }
            });
    }

    private onDialogClose(e) {
        this.onClose.emit(e);
    }
}
