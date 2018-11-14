import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
    Input,
    HostBinding,
    ViewEncapsulation
} from '@angular/core';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { PackageEditionConfigDto, PackageEditionConfigFeatureDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { Module } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

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
    baseUrl = AppConsts.appBaseHref;
    lastActiveSelectedEditionUsersAmount: number;
    lastActiveFeatures: any[];
    lastActivePricePerMonth: number;
    lastActiveEditionPricePerMonth: number;
    lastActiveDisplayedUsersAmount: number;
    lastActiveMonthlyPricePerYear: number;
    lastActiveTotalPrice: number;
    lastActivePricePerUserPerMonth: number;

    constructor(public localizationService: AppLocalizationService) {}

    ngOnChanges() {
        this.isActive = this.editions && !!this.selectedEdition;
    }

    l(key: string, ...args: any[]): string {
        return this.localizationService.l(key, 'CRM', ...args);
    }

    get selectedEdition(): PackageEditionConfigDto {
        return this.editions.find(edition => {
            return this.usersAmount <= edition.maxUserCount;
        });
    }

    get selectedEditionUsersAmount(): number {
        if (this.isActive) {
            this.lastActiveSelectedEditionUsersAmount = +this.selectedEdition.maxUserCount;
        }
        return this.lastActiveSelectedEditionUsersAmount;
    }

    get displayedUsersAmount(): number {
        if (this.isActive) {
            this.lastActiveDisplayedUsersAmount = this.usersAmount;
        }
        return this.lastActiveDisplayedUsersAmount;
    }

    get features(): PackageEditionConfigFeatureDto[] {
        if (this.isActive) {
            this.lastActiveFeatures = this.selectedEdition.features;
        }
        return this.lastActiveFeatures;
    }

    get pricePerMonth(): number {
        if (this.isActive) {
            this.lastActivePricePerMonth = this.billingPeriod === BillingPeriod.Monthly ?
                +(this.selectedEdition.monthlyPrice / this.usersCoefficient).toFixed(2) :
                +(this.selectedEdition.annualPrice / 12 / this.usersCoefficient).toFixed(2);
        }
        return this.lastActivePricePerMonth;
    }

    get editionPricePerMonth(): number {
        if (this.isActive) {
            this.lastActiveEditionPricePerMonth = this.billingPeriod === BillingPeriod.Monthly ?
                this.selectedEdition.monthlyPrice :
                +(this.selectedEdition.annualPrice / 12).toFixed(2);
        }
        return this.lastActiveEditionPricePerMonth;
    }

    get monthlyPricePerYear(): number {
        if (this.isActive) {
            this.lastActiveMonthlyPricePerYear = this.selectedEdition.monthlyPrice * 12 / this.usersCoefficient;
        }
        return this.lastActiveMonthlyPricePerYear;
    }

    get totalPrice(): number {
        if (this.isActive) {
            this.lastActiveTotalPrice = this.billingPeriod === BillingPeriod.Monthly
                ? this.selectedEdition.monthlyPrice / this.usersCoefficient
                : this.selectedEdition.annualPrice / this.usersCoefficient;
        }
        return this.lastActiveTotalPrice;
    }

    get pricePerUserPerMonth(): number {
        if (this.isActive) {
            this.lastActivePricePerUserPerMonth = (+(this.editionPricePerMonth / this.selectedEditionUsersAmount).toFixed(2));
        }
        return this.lastActivePricePerUserPerMonth;
    }

    get usersCoefficient() {
        return this.selectedEditionUsersAmount / this.usersAmount;
    }

    getFeatureValue(feature: PackageEditionConfigFeatureDto): string {
        let featureValue = '';
        if (feature.value !== undefined) {
            featureValue += ': ';
            if (feature.feature.isVariable && feature.value !== '-1') {
                featureValue += +feature.value / this.usersCoefficient;
            } else if (feature.value === '-1') {
                featureValue += this.l('Unlimited');
            } else {
                featureValue += feature.value;
            }
        }
        return featureValue;
    }

}
