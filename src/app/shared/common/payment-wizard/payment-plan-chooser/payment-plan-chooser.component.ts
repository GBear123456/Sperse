import { Component, ChangeDetectionStrategy, EventEmitter, OnInit, Input, Injector, Output, ViewChildren, QueryList } from '@angular/core';

import { MatSliderChange, MatSlider } from '@angular/material';

import { AppComponentBase } from '@shared/common/app-component-base';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { PaymentPlanCardComponent } from '@app/shared/common/payment-wizard/payment-plan-chooser/payment-plan-card/payment-plan-card.component';
import { OptionsPaymentPlan } from '@app/shared/common/payment-wizard/models/options-payment-plan.model';
import { PackageConfigDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'payment-plan-chooser',
    templateUrl: './payment-plan-chooser.component.html',
    styleUrls: ['./payment-plan-chooser.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentPlanChooserComponent extends AppComponentBase implements OnInit {
    @ViewChildren(PaymentPlanCardComponent) paymentPlanCardComponents: QueryList<PaymentPlanCardComponent>;
    @ViewChildren(MatSlider) slider: MatSlider;
    @Input() title = this.l('TrialExpired');
    @Input() subtitle = this.l('ChoosePlan');
    @Input() yearDiscount = 33;
    @Input() paymentPlansMaxUsersAmount: number;
    @Input() paymentPlans: PackageConfigDto[];
    @Output() onPlanChosen: EventEmitter<OptionsPaymentPlan> = new EventEmitter();
    @Output() moveToNextStep: EventEmitter<null> = new EventEmitter();
    selectedBillingPeriod = BillingPeriod.Yearly;
    selectedPaymentPlanIndex: number;
    usersAmount = 25;
    sliderInitialMinValue = 5;
    sliderInitialStep = 5;
    sliderInitialMaxValue = 100;
    sliderStep = 5;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {}

    billingPeriodChanged(e) {
        this.selectedBillingPeriod = e.value ? BillingPeriod.Yearly : BillingPeriod.Monthly;
    }

    selectPaymentPlan(i) {
        this.selectedPaymentPlanIndex = i;
    }

    getActiveStatus(status: 'month' | 'year') {
        return (status === 'month' && this.selectedBillingPeriod === BillingPeriod.Monthly) ||
               (status === 'year' && this.selectedBillingPeriod === BillingPeriod.Yearly);
    }

    onActiveUsersChange(event: MatSliderChange) {
        this.usersAmount = event.value;
    }

    decreaseUserCount() {
        if (this.usersAmount < this.sliderInitialMinValue) return;
        if (this.sliderStep !== this.sliderInitialStep && this.usersAmount === this.sliderInitialMaxValue) {
            this.repaintSlider(this.sliderInitialMinValue, this.sliderInitialMaxValue, this.sliderInitialStep);
        }
        this.usersAmount = this.usersAmount - this.sliderStep;
    }

    increaseUserCount() {
        if (this.usersAmount >= this.paymentPlansMaxUsersAmount) return;
        if (this.usersAmount > ( this.sliderInitialMaxValue - this.sliderStep ) && this.paymentPlansMaxUsersAmount > this.sliderInitialMaxValue ) {
            const step = (this.paymentPlansMaxUsersAmount - this.sliderInitialMaxValue) / 8;
            this.repaintSlider(this.sliderInitialMaxValue, this.paymentPlansMaxUsersAmount, step);
        }
        this.usersAmount = this.usersAmount + this.sliderStep;
    }

    repaintSlider(min: number, max: number, step: number) {
        this.slider['first']._min = min;
        this.slider['first']._max = max;
        this.slider['first']._step = this.sliderStep = step;
    }

    goToNextStep() {
        const selectedPlanCardComponent = this.paymentPlanCardComponents.toArray()[this.selectedPaymentPlanIndex];
        const totalPrice = selectedPlanCardComponent.totalPrice;
        const plan: OptionsPaymentPlan = {
            name: selectedPlanCardComponent.name,
            billingPeriod: selectedPlanCardComponent.billingPeriod,
            pricePerUserPerMonth: selectedPlanCardComponent.pricePerUserPerMonth,
            subtotal: this.selectedBillingPeriod === BillingPeriod.Yearly ? selectedPlanCardComponent.monthlyPricePerYear : totalPrice,
            discount: this.selectedBillingPeriod === BillingPeriod.Yearly ? this.yearDiscount : 0,
            total: totalPrice,
            usersAmount: selectedPlanCardComponent.selectedEditionUsersAmount,
            selectedEditionId: selectedPlanCardComponent.selectedEdition.id
        };
        this.onPlanChosen.emit(plan);
        this.moveToNextStep.next();
    }

}
