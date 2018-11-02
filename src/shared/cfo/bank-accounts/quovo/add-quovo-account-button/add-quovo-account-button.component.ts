import { Component, OnInit, Injector, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { QuovoService } from '../QuovoService';

@Component({
    selector: 'add-quovo-account-button',
    templateUrl: './add-quovo-account-button.component.html',
    styleUrls: ['./add-quovo-account-button.component.less'],
})
export class AddQuovoAccountButtonComponent extends CFOComponentBase implements OnInit {
    @Output() onClose: EventEmitter<any> = new EventEmitter();

    canShow = false;

    constructor(
        injector: Injector,
        private _quovoService: QuovoService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.canShow = this.isInstanceAdmin;

        if (this.canShow) {
            this._quovoService.connect();
        }
    }

    addAccount(): void {
        this.startLoading(true);
        this._quovoService.open();
        this._quovoService.quovoClosed$.subscribe(e => {
            this.onQuovoHanderClose(e);
        });
    }

    private onQuovoHanderClose(e) {
        this.onClose.emit(e);
    }
}
