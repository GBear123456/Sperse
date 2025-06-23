/** Core imports */
import {
    Component,
    Injector,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy
} from '@angular/core';

/** Third party imports */

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { CustomPeriodType, PublicProductSubscriptionOptionInfo, RecurringPaymentFrequency } from '@shared/service-proxies/service-proxies';
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { AppConsts } from '../../../../shared/AppConsts';

@Component({
    selector: 'product-option-selector',
    templateUrl: './product-option-selector.component.html',
    styleUrls: ['./product-option-selector.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductOptionSelectorComponent extends AppComponentBase {
    static availablePeriodsOrder = [BillingPeriod.Monthly, BillingPeriod.Yearly, BillingPeriod.LifeTime, BillingPeriod.OneTime, BillingPeriod.Custom];
    billingPeriod = BillingPeriod;

    subscriptionOptions: PublicProductSubscriptionOptionInfo[];
    availablePeriods: BillingPeriod[] = [];

    selectedBillingPeriod: BillingPeriod;
    selectedSubscriptionOption: PublicProductSubscriptionOptionInfo;
    selectedOptionDescription: string;

    @Input() set productSubscriptionOptions(options: PublicProductSubscriptionOptionInfo[]) {
        this.subscriptionOptions = options;
        this.initOptions(options);
    }
    @Output() onSelect: EventEmitter<{ period: BillingPeriod, option: PublicProductSubscriptionOptionInfo }> = new EventEmitter();

    constructor(
        injector: Injector,
    ) {
        super(injector);
    }

    initOptions(options: PublicProductSubscriptionOptionInfo[]) {
        let periods: RecurringPaymentFrequency[] = options.map(v => v.frequency);

        let billingPeriods = periods.map(v => PaymentService.getBillingPeriodByPaymentFrequency(v));
        this.availablePeriods = [];
        ProductOptionSelectorComponent.availablePeriodsOrder.forEach(v => {
            if (billingPeriods.indexOf(v) >= 0)
                this.availablePeriods.push(v);
        });
        this.toggle(this.availablePeriods[0]);
    }

    getActiveStatus(period: BillingPeriod) {
        return this.selectedBillingPeriod == period;
    }

    getSliderValue(): number {
        let periodIndex = this.availablePeriods.findIndex(v => v == this.selectedBillingPeriod);
        let value = periodIndex * (100 / this.availablePeriods.length);
        return +value.toFixed();
    }

    toggle(value: BillingPeriod) {
        this.selectedBillingPeriod = value;
        this.selectedSubscriptionOption = this.subscriptionOptions.find(v => v.frequency == PaymentService.getRecurringPaymentFrequency(this.selectedBillingPeriod));
        this.selectedOptionDescription = this.getPriceDescription();
        this.onSelect.emit({ period: value, option: this.selectedSubscriptionOption });
    }

    getPriceDescription(): string {
        if (this.selectedBillingPeriod == BillingPeriod.Custom) {
            return this.ls(AppConsts.localization.CRMLocalizationSourceName, 'RecurringPaymentFrequency_CustomDescription', this.selectedSubscriptionOption.customPeriodCount,
                this.ls(AppConsts.localization.CRMLocalizationSourceName, 'CustomPeriodType_' + CustomPeriodType[this.selectedSubscriptionOption.customPeriodType]));
        } else if (this.selectedBillingPeriod == BillingPeriod.OneTime) {
            return this.l('price' + BillingPeriod[this.selectedBillingPeriod], this.selectedSubscriptionOption.customPeriodCount);
        } else {
            return this.l('price' + BillingPeriod[this.selectedBillingPeriod]);
        }
    }
}