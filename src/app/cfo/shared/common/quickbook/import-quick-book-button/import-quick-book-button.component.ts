import { Component, OnInit, Injector, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { QuickBookServiceProxy, InstanceType } from 'shared/service-proxies/service-proxies';

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
        abp.ui.setBusy();
        this._quickBookService.getQuickBookConnectionLink(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                if (result.connectionLink) {
                    window.open(result.connectionLink, "Quick Book Connection", "menubar=0,scrollbars=1,width=780,height=900,top=10");
                }
                abp.ui.clearBusy();                
            });
    }

    private onDialogClose(e) {
        this.onClose.emit(e);
    }
}
