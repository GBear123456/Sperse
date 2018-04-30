import { Component, OnInit, Injector, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { QuovoService, QuovoHandler } from '@app/cfo/shared/common/quovo/QuovoService';

@Component({
    selector: 'add-account-button',
    templateUrl: './add-account-button.component.html',
    styleUrls: ['./add-account-button.component.less'],
})
export class AddAccountButtonComponent extends CFOComponentBase implements OnInit {
    @Output() onClose: EventEmitter<any> = new EventEmitter();

    quovoHandler: QuovoHandler;

    constructor(
        injector: Injector,
        private _quovoService: QuovoService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();

        if (!this.quovoHandler) {
            this.quovoHandler = this._quovoService.getQuovoHandler(this.instanceType, this.instanceId);
        }
    }

    addAccount(): void {
        this.quovoHandler.open((e) => this.onQuovoHanderClose(e));
    }

    private onQuovoHanderClose(e) {
        this.onClose.emit(e);
    }
}
