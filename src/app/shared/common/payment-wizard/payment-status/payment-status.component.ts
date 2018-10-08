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

    separateToFewLines(string: string) {
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
}
