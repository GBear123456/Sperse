import { Component, ChangeDetectionStrategy, OnInit, Input, Injector, HostBinding } from '@angular/core';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { Feature } from '@app/shared/common/payment-wizard/models/feature.model';
import { FeatureStatus } from '@app/shared/common/payment-wizard/models/feature-status.enum';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'payment-plan-card',
    templateUrl: './payment-plan-card.component.html',
    styleUrls: ['./payment-plan-card.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentPlanCardComponent extends AppComponentBase implements OnInit {
    @Input() name: string;
    @Input() billingPeriod: BillingPeriod;
    @Input() currencySymbol = '$';
    @Input() monthlyBillingPrice: number;
    @Input() yearlyBillingPricePerMonth: number;
    @Input() features: Feature[];
    @Input() maxUsersAmount: number;
    @Input() usersAmount: number;
    @HostBinding('class.isBestValue') @Input() isBestValue = false;
    additionalUsersAmount = 0;

    get pricePerMonth() {
        return this.billingPeriod === BillingPeriod.Monthly ? this.monthlyBillingPrice : this.yearlyBillingPricePerMonth;
    }

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {}

    increaseAdditionalUsersAmount() {
        if (this.additionalUsersAmount < (this.maxUsersAmount - this.usersAmount)) {
            this.additionalUsersAmount++;
        }
    }

    decreaseAdditionalUsersAmount() {
        if (this.additionalUsersAmount > 0) {
            this.additionalUsersAmount--;
        }
    }

    getFeatureStatusIconName(featureStatus: FeatureStatus) {
        return featureStatus;
    }
}
