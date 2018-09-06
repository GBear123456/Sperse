import { Component, EventEmitter, OnInit, Output, Injector } from '@angular/core';
import { QuovoHandler, QuovoService } from '@shared/cfo/bank-accounts/quovo/QuovoService';
import { CFOService } from '@shared/cfo/cfo.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

@Component({
    selector: 'quovo-login',
    template: ``
})
export class QuovoLoginComponent extends CFOComponentBase implements OnInit {
    @Output() onClose: EventEmitter<any> = new EventEmitter();

    quovoHandler: QuovoHandler;

    constructor(
        injector: Injector,
        private _quovoService: QuovoService,
        public _cfoService: CFOService
    ) {
        super(injector);
        if (!this.quovoHandler) {
            this.quovoHandler = this._quovoService.getQuovoHandler(this._cfoService.instanceType, this._cfoService.instanceId);
        }
    }

    ngOnInit(): void {
        if (this.quovoHandler.isLoaded) {
            if (this.loading) {
                this.finishLoading(true);
            }
            this.quovoHandler.open((e) => this.onQuovoHanderClose(e));
        } else {
            if (!this.loading) {
                this.startLoading(true);
            }
            setTimeout(() => this.ngOnInit(), 100);
        }
    }


    private onQuovoHanderClose(e) {
        this.onClose.emit(e);
    }
}
