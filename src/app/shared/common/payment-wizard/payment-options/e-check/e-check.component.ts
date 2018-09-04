/** Core imports */
import { Component, ChangeDetectionStrategy, EventEmitter, OnInit, Output, Injector, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

/** Third party imports */
import * as moment from 'moment';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { ECheckDataModel } from '@app/shared/common/payment-wizard/models/e-check-data.model';
import { CustomNumberPipe } from '@shared/common/pipes/custom-number/custom-number.pipe';
import { NumberToWordsPipe } from '@shared/common/pipes/number-to-words/number-to-words.pipe';

@Component({
    selector: 'e-check',
    templateUrl: './e-check.component.html',
    styleUrls: ['./e-check.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ CustomNumberPipe, NumberToWordsPipe ]
})
export class ECheckComponent extends AppComponentBase implements OnInit {
    @Input() descriptionText = this.l('eCheckDescription');
    @Input() paymentReceiver = this.l('SperseLLC');
    @Input() price: number;
    @Input() currencySymbol = '$';
    @Output() onSubmit: EventEmitter<ECheckDataModel> = new EventEmitter<ECheckDataModel>();

    currentDate = moment();
    echeckForm = this.formBuilder.group({
        paymentReceiver: { value: this.paymentReceiver, disabled: true },
        amount: { value: this.price, disabled: true },
        date: { value: this.currentDate, disabled: true },
        paymentDescription: this.currentDate.format('MMMM YYYY') + ' ' + this.l('SubscriptionPayment'),
        routingNumber: ['',
            [
                Validators.required,
                Validators.pattern('^[0-9]*$'),
                Validators.minLength(9),
                Validators.maxLength(9)
            ]
        ],
        bankAccountNumber: ['',
            [
                Validators.required,
                Validators.pattern('^[0-9]*$'),
                Validators.minLength(4),
                Validators.maxLength(17)
            ]
        ]
    });

    constructor(
        injector: Injector,
        private formBuilder: FormBuilder,
        private customNumberPipe: CustomNumberPipe,
        private numberToWordsPipe: NumberToWordsPipe
    ) {
        super(injector);
    }

    ngOnInit() {}

    onKeyPress(e) {
        if (e.which < 48 || e.which > 57) {
            e.preventDefault();
        }
    }

    getTextPrice(price) {
        const dollars = this.numberToWordsPipe.transform(+this.customNumberPipe.transform(price, '1.0-0')).replace(/\b\w/g, l => l.toUpperCase());
        const cents = this.customNumberPipe.transform(price, '0.2-2');
        const centsText = !cents || cents === '00' ? '' : `${this.l('And')} ${cents} ${this.l('Cents')}`;
        return `${dollars} ${this.l('Dollars')} ${centsText}`;
    }

    submit() {
        if (this.echeckForm.valid) {
            this.onSubmit.next(this.echeckForm.getRawValue());
        }
    }

}
