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
import { CustomPeriodType, IPublicPriceOptionInfo, PriceOptionType, RecurringPaymentFrequency } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '../../../../shared/AppConsts';

@Component({
    selector: 'product-option-selector',
    templateUrl: './product-option-selector.component.html',
    styleUrls: ['./product-option-selector.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductOptionSelectorComponent extends AppComponentBase {
    priceOptions: IPublicPriceOptionInfo[];

    selectedPriceOption: IPublicPriceOptionInfo;
    selectedOptionDescription: string;
    //filterSubscriptions: boolean;

    //@Input() onlySubscriptions: boolean;
    @Input() set productPriceOptions(options: IPublicPriceOptionInfo[]) {
        this.priceOptions = options;
        if (options)
            this.initOptions(options);
    }
    @Output() onSelect: EventEmitter<IPublicPriceOptionInfo> = new EventEmitter();

    constructor(
        injector: Injector,
    ) {
        super(injector);
    }

    initOptions(options: IPublicPriceOptionInfo[]) {
        this.selectedPriceOption = options[0];
        this.onPriceOptionChanged();
    }

    onPriceOptionChanged() {
        this.selectedOptionDescription = this.getPriceDescription();
        this.onSelect.emit(this.selectedPriceOption);
    }

    getPriceDescription(): string {
        if (this.selectedPriceOption.type == PriceOptionType.Subscription) {
            if (this.selectedPriceOption.frequency == RecurringPaymentFrequency.Custom) {
                return this.ls(AppConsts.localization.CRMLocalizationSourceName, 'RecurringPaymentFrequency_CustomDescription', this.selectedPriceOption.customPeriodCount,
                    this.ls(AppConsts.localization.CRMLocalizationSourceName, 'CustomPeriodType_' + CustomPeriodType[this.selectedPriceOption.customPeriodType]));
            } else if (this.selectedPriceOption.frequency == RecurringPaymentFrequency.OneTime) {
                return this.l('price' + this.selectedPriceOption.frequency, this.selectedPriceOption.customPeriodCount);
            } else {
                return this.l('price' + this.selectedPriceOption.frequency);
            }
        }

        return this.l('ProductMeasurementUnit_' + this.selectedPriceOption.unit);
    }
}