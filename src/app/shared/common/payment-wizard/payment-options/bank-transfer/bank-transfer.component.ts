import { Component, OnInit, Injector, ChangeDetectionStrategy, Input } from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'bank-transfer',
    templateUrl: './bank-transfer.component.html',
    styleUrls: ['./bank-transfer.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankTransferComponent extends AppComponentBase implements OnInit {
    @Input() titleText = this.l('BankTransferTitleText');

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }

}
