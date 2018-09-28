import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
    Input,
    HostBinding,
    ViewEncapsulation
} from '@angular/core';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { PackageEditionConfigDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { environment } from '@root/environments/environment';
import { Module } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'package-card',
    templateUrl: './package-card.component.html',
    styleUrls: ['./package-card.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.Emulated
})
export class PackageCardComponent implements OnChanges {
    @Input() name: string;
    @Input() billingPeriod: BillingPeriod;
    @Input() currencySymbol = '$';
    @Input() usersAmount: number;
    @Input() editions: PackageEditionConfigDto[];
    @Input() module: Module;
    @HostBinding('class.isActive') public isActive: boolean;
    @HostBinding('class.bestValue') @Input() bestValue = false;
    baseUrl = environment.appBaseUrl;
    lastActiveSelectedEditionUsersAmount: number;
    lastActiveFeatures: any[];
    lastActivePricePerMonth: number;
    lastActiveMonthlyPricePerYear: number;
    lastActiveTotalPrice: number;
    lastActivePricePerUserPerMonth: number;

    constructor(private localizationService: AppLocalizationService) {}

    ngOnChanges() {
        this.isActive = this.editions && !!this.selectedEdition;
    }

    l(key: string, ...args: any[]): string {
        return this.localizationService.l(key, 'CRM', ...args);
    }

    get selectedEdition(): PackageEditionConfigDto {
        return this.editions.find(edition => {
            const maxUsersCount = +edition.features[this.module + '.MaxUserCount'];
            return this.usersAmount <= maxUsersCount;
        });
    }

    get selectedEditionUsersAmount(): number {
        if (this.isActive) {
            this.lastActiveSelectedEditionUsersAmount = +this.selectedEdition.features[this.module + '.MaxUserCount'];
        }
        return this.lastActiveSelectedEditionUsersAmount;
    }

    get features() {
        if (this.isActive) {
            const maxActiveContactCount = +this.selectedEdition.features[this.module + '.MaxActiveContactCount'] ? this.selectedEdition.features[this.module + '.MaxActiveContactCount'] : this.l('Unlimited');
            const maxSpaceGB = +this.selectedEdition.features['Admin.MaxSpaceGB'] ? this.selectedEdition.features['Admin.MaxSpaceGB'] : this.l('Unlimited');
            this.lastActiveFeatures = [
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
        return this.lastActiveFeatures;
    }

    get pricePerMonth(): number {
        if (this.isActive) {
            this.lastActivePricePerMonth = this.billingPeriod === BillingPeriod.Monthly ? this.selectedEdition.monthlyPrice : +(this.selectedEdition.annualPrice / 12).toFixed(2);
        }
        return this.lastActivePricePerMonth;
    }

    get monthlyPricePerYear(): number {
        if (this.isActive) {
            this.lastActiveMonthlyPricePerYear = this.selectedEdition.monthlyPrice * 12;
        }
        return this.lastActiveMonthlyPricePerYear;
    }

    get totalPrice(): number {
        if (this.isActive) {
            this.lastActiveTotalPrice = (this.billingPeriod === BillingPeriod.Monthly ? this.selectedEdition.monthlyPrice : this.selectedEdition.annualPrice);
        }
        return this.lastActiveTotalPrice;
    }

    get pricePerUserPerMonth(): number {
        if (this.isActive) {
            this.lastActivePricePerUserPerMonth = (+(this.pricePerMonth / this.selectedEditionUsersAmount).toFixed(2));
        }
        return this.lastActivePricePerUserPerMonth;
    }

}
