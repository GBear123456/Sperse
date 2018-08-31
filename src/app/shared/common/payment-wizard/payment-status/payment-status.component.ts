import { Component, ChangeDetectionStrategy, OnInit, Input, Injector } from '@angular/core';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'payment-status',
    templateUrl: './payment-status.component.html',
    styleUrls: ['./payment-status.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentStatusComponent extends AppComponentBase implements OnInit {
    @Input() paymentStatus: PaymentStatusEnum = PaymentStatusEnum.Pending;
    @Input() text = '';

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {}

}
