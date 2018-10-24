import { Component, EventEmitter, OnInit, Input, Output, Injector, OnDestroy } from '@angular/core';
import { QuovoHandler, QuovoService } from '@shared/cfo/bank-accounts/quovo/QuovoService';
import { CFOService } from '@shared/cfo/cfo.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'quovo-login',
    template: ``
})
export class QuovoLoginComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @Input() accountId: any;
    @Input() loadingContainerElement: Element;
    @Output() onClose: EventEmitter<any> = new EventEmitter();

    quovoHandler: QuovoHandler;

    constructor(
        injector: Injector,
        private _quovoService: QuovoService,
        public _cfoService: CFOService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        if (!this.quovoHandler) {
            this.quovoHandler = this._quovoService.getQuovoHandler(this._cfoService.instanceType, this._cfoService.instanceId);
        }

        if (this.quovoHandler.isLoaded) {
            /** Open quovo popup only after instance initialization - show the spinner untill that moment */
            this._cfoService.statusActive
                .pipe(takeUntil(this.destroy$))
                .subscribe(statusActive => {
                    if (statusActive) {
                        this.quovoHandler.open((e) => this.onQuovoHanderClose(e), this.accountId);
                    } else {
                        this.startLoading(!this.loadingContainerElement, this.loadingContainerElement);
                    }
                });
        } else {
            if (!this.loading) {
                this.startLoading(!this.loadingContainerElement, this.loadingContainerElement);
            }
            setTimeout(() => this.ngOnInit(), 100);
        }
    }

    private onQuovoHanderClose(e) {
        this.finishLoading(!this.loadingContainerElement, this.loadingContainerElement);
        this.onClose.emit(e);
    }

    ngOnDestroy() {
        super.ngOnDestroy();
    }
}
