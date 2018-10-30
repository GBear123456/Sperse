import { Component, ChangeDetectionStrategy, Output, Input, Injector, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { StatusInfo } from '@app/shared/common/payment-wizard/models/status-info';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';
import { values } from 'lodash';

@Component({
    selector: 'payment-status',
    templateUrl: './payment-status.component.html',
    styleUrls: ['./payment-status.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentStatusComponent extends AppComponentBase {
    @Input('paymentStatusData')
    set paymentStatusData(paymentStatusData) {
        this._paymentStatusData = paymentStatusData;
        /** Check if status is default from PaymentStatusEnum enum or custom */
        this.statusTitle = this.getStatusTitle(paymentStatusData.status);
        this.showBackButton = !paymentStatusData.hasOwnProperty('showBack') || paymentStatusData.showBack;
    }
    @Output() onClose: EventEmitter<null> = new EventEmitter();
    _paymentStatusData: StatusInfo;
    statusTitle: string;
    showBackButton: boolean;

    constructor(injector: Injector) {
        super(injector);
    }

    private getStatusTitle(status) {
        return this.separateToFewLines(
            values(PaymentStatusEnum).indexOf(status) >= 0 ?
                this.l('PaymentStatus_' + status ) :
                status
        );
    }

    private separateToFewLines(string: string) {
        const commaIndex = string.indexOf(',');
        let result;
        /** If comma exists in text - separate by comma */
        if (commaIndex !== -1) {
            result = string.slice(0, commaIndex + 1) + '\n' + string.slice(commaIndex + 1, string.length);
        /** Else - separate by first two words and else */
        } else {
            const words = string.split(' ');
            result = words.slice(0, 2).join(' ') + '\n' + words.slice(2, words.length).join(' ');
        }
        return result;
    }

    close() {
        this.onClose.emit();
    }
}
