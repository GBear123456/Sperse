import { Component, EventEmitter, OnInit, Input, Injector, Output, ViewChildren, QueryList } from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';
import { PaymentPlanModel } from '@app/shared/common/payment-wizard/models/payment-plan.model';
import { FeatureStatus } from '@app/shared/common/payment-wizard/models/feature-status.enum';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { PaymentPlanCardComponent } from '@app/shared/common/payment-wizard/payment-plan-chooser/payment-plan-card/payment-plan-card.component';
import { OptionsPaymentPlan } from '@app/shared/common/payment-wizard/models/options-payment-plan.model';

@Component({
    selector: 'payment-plan-chooser',
    templateUrl: './payment-plan-chooser.component.html',
    styleUrls: ['./payment-plan-chooser.component.less']
})
export class PaymentPlanChooserComponent extends AppComponentBase implements OnInit {
    @ViewChildren(PaymentPlanCardComponent) paymentPlanCardComponents: QueryList<PaymentPlanCardComponent>;
    @Input() title = this.l('TrialExpired');
    @Input() subtitle = this.l('ChoosePlan');
    @Input() yearDiscount = 20;
    @Output() onPlanChosen: EventEmitter<OptionsPaymentPlan> = new EventEmitter();
    @Output() moveToNextStep: EventEmitter<null> = new EventEmitter();
    selectedBillingPeriod = BillingPeriod.Yearly;
    selectedPaymentPlanIndex: number;
    paymentPlans: PaymentPlanModel[] = [
        {
            name: 'Standard',
            maxUsersAmount: 10,
            usersAmount: 5,
            billingPeriod: this.selectedBillingPeriod,
            monthlyBillingPrice: 15.99,
            yearlyBillingPricePerMonth: 12.79,
            features: [
                {
                    name: 'Contacts: 10000',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'File Storage: 25 GB Total',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'Lead Management Pipeline Funnel',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'Team Permissions Management',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'Document Manager: Limited',
                    status: FeatureStatus.Limited
                },
                {
                    name: 'Tasks Calendar & 2 Way Sync',
                    status: FeatureStatus.Disabled
                }
            ]
        },
        {
            name: 'Advanced',
            maxUsersAmount: 30,
            usersAmount: 10,
            billingPeriod: this.selectedBillingPeriod,
            monthlyBillingPrice: 19.99,
            yearlyBillingPricePerMonth: 15.79,
            features: [
                {
                    name: 'Contacts: Unlimited',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'File Storage: 100 GB Total',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'Lead Management Pipeline Funnel',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'Team Permissions Management',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'Document Manager: Complete',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'Tasks Calendar & 2 Way Sync',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'Tasks Calendar & 2 Way Sync',
                    status: FeatureStatus.Enabled
                }
            ],
            isBestValue: true
        },
        {
            name: 'Ultimate',
            maxUsersAmount: 10,
            usersAmount: 5,
            billingPeriod: this.selectedBillingPeriod,
            monthlyBillingPrice: 15.99,
            yearlyBillingPricePerMonth: 12.79,
            features: [
                {
                    name: 'Contacts: 10000',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'File Storage: 25 GB Total',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'Lead Management Pipeline Funnel',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'Team Permissions Management',
                    status: FeatureStatus.Enabled
                },
                {
                    name: 'Document Manager: Limited',
                    status: FeatureStatus.Limited
                },
                {
                    name: 'Tasks Calendar & 2 Way Sync',
                    status: FeatureStatus.Disabled
                }
            ]
        }
    ];

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

    goToNextStep() {
        const selectedPlanCardComponent = this.paymentPlanCardComponents.toArray()[this.selectedPaymentPlanIndex];
        const wholePrice = selectedPlanCardComponent.pricePerMonth * selectedPlanCardComponent.usersAmount;
        const plan: OptionsPaymentPlan = {
            name: selectedPlanCardComponent.name,
            pricePerMonth: selectedPlanCardComponent.pricePerMonth,
            subtotal: wholePrice,
            discount: this.selectedBillingPeriod === BillingPeriod.Yearly ? this.yearDiscount : null,
            total: wholePrice,
            usersAmount: selectedPlanCardComponent.usersAmount + selectedPlanCardComponent.additionalUsersAmount
        };
        this.onPlanChosen.emit(plan);
        this.moveToNextStep.next();
    }

}
