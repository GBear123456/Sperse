import {
    Component,
    ChangeDetectionStrategy,
    Input,
    Injector,
    HostBinding
} from '@angular/core';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { AppComponentBase } from '@shared/common/app-component-base';
import { PackageEditionConfigDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'payment-plan-card',
    templateUrl: './payment-plan-card.component.html',
    styleUrls: ['./payment-plan-card.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentPlanCardComponent extends AppComponentBase {
    @Input() name: string;
    @Input() billingPeriod: BillingPeriod;
    @Input() currencySymbol = '$';
    @Input() usersAmount: number;
    @Input() editions: PackageEditionConfigDto[];

    get selectedEdition(): PackageEditionConfigDto {
        return this.editions.find(edition => {
            const maxUsersCount = +edition.features['CRM.MaxUserCount'];
            return this.usersAmount <= maxUsersCount;
        });
    }

    get selectedEditionUsersAmount(): number {
        return +this.selectedEdition.features['CRM.MaxUserCount'];
    }

    get features() {
        const maxActiveContactCount = +this.selectedEdition.features['CRM.MaxActiveContactCount'] ? this.selectedEdition.features['CRM.MaxActiveContactCount'] : this.l('Unlimited');
        const maxSpaceGB = +this.selectedEdition.features['Admin.MaxSpaceGB'] ? this.selectedEdition.features['Admin.MaxSpaceGB'] : this.l('Unlimited');
        return [
            {
                name: 'Contacts',
                value: this.l('FeaturesContacts') + ': ' + maxActiveContactCount
            },
            {
                name: 'File Storage',
                value: this.l('FeaturesFileStorage') + ': ' + maxSpaceGB
            },
            {
                name: 'Lead Management Pipeline Funnel',
                value: this.l('LeadManagementPipelineFunnel')
            },
            {
                name: 'Team Permission Management',
                value: this.l('Team Permission Management')
            }
        ];
    }

    get pricePerMonth(): number {
        return this.billingPeriod === BillingPeriod.Monthly ? this.selectedEdition.monthlyPrice : +(this.selectedEdition.annualPrice / 12).toFixed(2);
    }

    get monthlyPricePerYear(): number {
        return this.selectedEdition.monthlyPrice * 12;
    }

    get totalPrice(): number {
        return this.billingPeriod === BillingPeriod.Monthly ? this.selectedEdition.monthlyPrice : this.selectedEdition.annualPrice;
    }

    get pricePerUserPerMonth(): number {
        return +(this.pricePerMonth / this.selectedEditionUsersAmount).toFixed(2);
    }

    @HostBinding('class.bestValue') @Input() bestValue = false;

    constructor(injector: Injector) {
        super(injector);
    }

}
