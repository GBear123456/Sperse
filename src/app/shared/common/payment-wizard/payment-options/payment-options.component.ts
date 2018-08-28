import { Component, ChangeDetectionStrategy, EventEmitter, OnInit, Output, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { OptionsPaymentPlan } from '@app/shared/common/payment-wizard/models/options-payment-plan.model';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { Step } from '@app/shared/common/payment-wizard/models/step.model';

@Component({
    selector: 'payment-options',
    templateUrl: './payment-options.component.html',
    styleUrls: ['./payment-options.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentOptionsComponent extends AppComponentBase implements OnInit {
    @Input() plan: OptionsPaymentPlan;
    @Input() steps: Step[] = [
        {
            name: this.l('ChooseYourPlan'),
            editable: true,
            completed: true
        },
        {
            name: this.l('PaymentOptions'),
            active: true
        },
        {
            name: this.l('PaymentConfirmation')
        }
    ];
    @Input() phoneNumber = '1-844-773-7739';
    @Output() onChangeStep: EventEmitter<number> = new EventEmitter<number>();
    @Output() onClose: EventEmitter<null> = new EventEmitter();
    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {}

    goToStep(i) {
        this.onChangeStep.emit(i);
    }

    getBillingTerm(billingPeriod: BillingPeriod) {
        return billingPeriod === BillingPeriod.Yearly ? 'annually' : 'monthly';
    }

    close() {
        this.onClose.emit();
    }
}
