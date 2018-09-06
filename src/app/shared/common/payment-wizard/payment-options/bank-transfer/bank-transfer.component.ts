import { Component, OnInit, Injector, ChangeDetectionStrategy } from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'bank-transfer',
    templateUrl: './bank-transfer.component.html',
    styleUrls: ['./bank-transfer.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankTransferComponent extends AppComponentBase implements OnInit {

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }

}
