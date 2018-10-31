import { Component, OnInit, Injector, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { QuickBookServiceProxy, InstanceType } from 'shared/service-proxies/service-proxies';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'import-quick-book-button',
    templateUrl: './import-quick-book-button.component.html',
    styleUrls: ['./import-quick-book-button.component.less'],
    providers: [QuickBookServiceProxy]
})
export class ImportFromQuickBooksButtonComponent extends CFOComponentBase implements OnInit {
    @Output() onClose: EventEmitter<any> = new EventEmitter();

    constructor(
        injector: Injector,
        private _quickBookService: QuickBookServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    buttonClick(): void {
        abp.message.confirm(this.l('ImportQbCoAConfirmation'), this.l('ImportQbCoAConfirmationTitle'), (result) => {
            if (result) {
                abp.ui.setBusy();
                this.checkConnection(true);
            }
        });
    }

    checkConnection(tryNewConnect: boolean) {
        this._quickBookService.checkToken(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                if (result) {
                    this.syncCoA();
                }
                else {
                    if (tryNewConnect)
                        this.newConnect();
                    else
                        this.onDialogClose(null);
                }
            });
    }

    newConnect() {
        this._quickBookService.getQuickBookConnectionLink(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                if (result.connectionLink) {
                    let qbWindow = window.open(result.connectionLink, 'Quick Book Connection', 'menubar=0,scrollbars=1,width=780,height=900,top=10');
                    this.checkWindowClose(qbWindow);
                }
            });
    }

    syncCoA() {
        this._quickBookService.syncChartOfAccounts(InstanceType[this.instanceType], this.instanceId, false)
            .subscribe((result) => {
                this.onDialogClose(null);
            });
    }

    checkWindowClose(qbWindow: Window) {
        if (qbWindow.closed)
            this.checkConnection(false);
        else {
            setTimeout(() => { this.checkWindowClose(qbWindow); }, 100);
        }
    }

    private onDialogClose(e) {
        abp.ui.clearBusy(); 
        this.onClose.emit(e);
    }
}
