import { Component, OnInit, Injector, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { QuovoService, QuovoHandler } from '../quovo/QuovoService';
import { SyncAccountServiceProxy, InstanceType } from 'shared/service-proxies/service-proxies';
import { CFOService } from '@shared/cfo/cfo.service';

@Component({
    selector: 'add-account-button',
    templateUrl: './add-account-button.component.html',
    styleUrls: ['./add-account-button.component.less'],
    providers: [SyncAccountServiceProxy]
})
export class AddAccountButtonComponent extends CFOComponentBase implements OnInit {
    @Output() onClose: EventEmitter<any> = new EventEmitter();
    @Output() onComplete: EventEmitter<any> = new EventEmitter();
    tooltipVisible = false;
    quovoHandler: QuovoHandler;
    createAccountAvailable: boolean;
    constructor(
        injector: Injector,
        private quovoService: QuovoService,
        private cfoService: CFOService,
        private _syncAccountServiceProxy: SyncAccountServiceProxy
    ) {
        super(injector);
        this._syncAccountServiceProxy.isAvailableCreateAccount(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                this.createAccountAvailable = result;
            });
    }

    ngOnInit(): void {
        super.ngOnInit();
        if (!this.quovoHandler) {
            this.quovoHandler = this.quovoService.getQuovoHandler(this.cfoService.instanceType, this.cfoService.instanceId);
        }
    }

    openAddAccountDialog() {
        if (!this.createAccountAvailable)
            return;

        if (this.quovoHandler.isLoaded) {
            if (this.loading) {
                this.finishLoading(true);
            }
            this.quovoHandler.open((e) => {
                this.tooltipVisible = false;
                this.onClose.emit(e);
            });
            this.tooltipVisible = true;
        } else {
            if (!this.loading) {
                this.startLoading(true);
            }
            setTimeout(() => this.openAddAccountDialog(), 100);
        }
    }

    xeroButtonClick() {
        this.quovoHandler.close();
    }

    addXeroAccount() {
        this.onComplete.emit();
    }
}
