import { Component, ChangeDetectionStrategy, OnInit, Input, Injector } from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';
import {StatusInfo} from '@app/shared/common/payment-wizard/models/status-info';

@Component({
    selector: 'payment-status',
    templateUrl: './payment-status.component.html',
    styleUrls: ['./payment-status.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentStatusComponent extends AppComponentBase implements OnInit {
    @Input() paymentStatusData: StatusInfo;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {}

}
