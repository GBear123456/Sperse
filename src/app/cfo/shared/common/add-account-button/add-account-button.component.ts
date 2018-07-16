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
    tooltipVisible = false;

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    addAccount(): void {
        this.tooltipVisible = !this.tooltipVisible;
    }

    onQuovoHanderClose(e) {
        this.onClose.emit(e);
    }
}
