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
    get title() {
        switch (this.paymentStatus) {
            case PaymentStatusEnum.BeingConfirmed: return this.l('PaymentIsBeingConfirmedStatusTitle');
            case PaymentStatusEnum.Pending: return this.l('PaymentPendingStatusTitle');
            case PaymentStatusEnum.Confirmed: return this.l('PaymentConfirmedStatusTitle');
            case PaymentStatusEnum.Failed: return this.l('PaymentFailedStatusTitle');
        }
    }

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {}

}
