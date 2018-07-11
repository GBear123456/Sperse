import { Component, OnInit, Injector, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { QuovoService, QuovoHandler } from '@app/cfo/shared/common/quovo/QuovoService';

@Component({
    selector: 'add-quovo-account-button',
    templateUrl: './add-quovo-account-button.component.html',
    styleUrls: ['./add-quovo-account-button.component.less'],
})
export class AddQuovoAccountButtonComponent extends CFOComponentBase implements OnInit {
    @Output() onClose: EventEmitter<any> = new EventEmitter();

    quovoHandler: QuovoHandler;
    canShow: boolean = false;

    constructor(
        injector: Injector,
        private _quovoService: QuovoService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.canShow = this.isInstanceAdmin;

        if (this.canShow && !this.quovoHandler) {
            this.quovoHandler = this._quovoService.getQuovoHandler(this.instanceType, this.instanceId);
        }
    }

    addAccount(): void {
        if (this.quovoHandler.isLoaded) {
            if (this.loading) {
                this.finishLoading(true);
            }
            this.quovoHandler.open((e) => this.onQuovoHanderClose(e));
        } else {
            if (!this.loading) {
                this.startLoading(true);
            }
            setTimeout(() => this.addAccount(), 100);
        }
    }

    private onQuovoHanderClose(e) {
        this.onClose.emit(e);
    }
}
