/** Core imports */
import { Component, ChangeDetectionStrategy, EventEmitter, OnInit, Output, Injector, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

/** Third party imports */
import * as moment from 'moment';

/** Application imports */
import { ECheckDataModel } from '@app/shared/common/payment-wizard/models/e-check-data.model';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'e-check',
    templateUrl: './e-check.component.html',
    styleUrls: ['./e-check.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ECheckComponent extends AppComponentBase implements OnInit {
    @Input() descriptionText = this.l('eCheckDescription');
    @Input() paymentReceiver = this.l('SperseLLC');
    @Input() price;
    @Input() currencySymbol = '$';
    @Output() onSubmit: EventEmitter<ECheckDataModel> = new EventEmitter<ECheckDataModel>();

    currentDate = moment();
    echeckForm = this.formBuilder.group({
        paymentReceiver: this.paymentReceiver,
        amount: this.price,
        date: this.currentDate,
        paymentDescription: this.currentDate.format('MMMM YYYY') + ' ' + this.l('SubscriptionPayment'),
        routingNumber: ['',
            [
                Validators.pattern('^[0-9]*$'),
                Validators.minLength(9),
                Validators.maxLength(9)
            ]
        ],
        bankAccountNumber: ['',
            [
                Validators.pattern('^[0-9]*$'),
                Validators.minLength(4),
                Validators.minLength(17)
            ]
        ]
    });

    constructor(
        injector: Injector,
        private formBuilder: FormBuilder
    ) {
        super(injector);
    }

    ngOnInit() {}

    submit() {
        this.onSubmit.next(this.echeckForm.value);
    }
}
