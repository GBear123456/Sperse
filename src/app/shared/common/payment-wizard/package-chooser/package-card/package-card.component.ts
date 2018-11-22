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
    selectedEdition: PackageEditionConfigDto;

    constructor(public localizationService: AppLocalizationService) {}

    ngOnChanges(changes) {
        this.selectedEdition = this.getSelectedEdition();
        this.isActive = this.editions && !!this.selectedEdition;
    }

    l(key: string, ...args: any[]): string {
        return this.localizationService.l(key, 'CRM', ...args);
    }

    getSelectedEdition(): PackageEditionConfigDto {
        return this.editions.find(edition => this.usersAmount <= edition.maxUserCount);
    }

    get selectedOrLastEdition(): PackageEditionConfigDto {
        return this.selectedEdition || this.editions[this.editions.length - 1];
    }

    get selectedEditionUsersAmount(): number {
        return +this.selectedOrLastEdition.maxUserCount;
    }

    get displayedUsersAmount(): number {
        return this.isActive ? this.usersAmount : this.selectedOrLastEdition.maxUserCount;
    }

    get features(): PackageEditionConfigFeatureDto[] {
        return this.selectedOrLastEdition.features;
    }

    get pricePerMonth(): number {
        return this.billingPeriod === BillingPeriod.Monthly ?
                +(this.selectedOrLastEdition.monthlyPrice / this.usersCoefficient).toFixed(2) :
                +(this.selectedOrLastEdition.annualPrice / 12 / this.usersCoefficient).toFixed(2);
    }

    get editionPricePerMonth(): number {
        return this.billingPeriod === BillingPeriod.Monthly ?
                this.selectedOrLastEdition.monthlyPrice :
                +(this.selectedOrLastEdition.annualPrice / 12).toFixed(2);
    }

    get monthlyPricePerYear(): number {
        return this.selectedOrLastEdition.monthlyPrice * 12 / this.usersCoefficient;
    }

    get totalPrice(): number {
        return this.billingPeriod === BillingPeriod.Monthly
            ? this.selectedOrLastEdition.monthlyPrice / this.usersCoefficient
            : this.selectedOrLastEdition.annualPrice / this.usersCoefficient;
    }

    get pricePerUserPerMonth(): number {
        return (+(this.editionPricePerMonth / this.selectedEditionUsersAmount).toFixed(2));
    }

    get usersCoefficient() {
        return this.selectedEditionUsersAmount / this.displayedUsersAmount;
    }

    getFeatureValue(feature: PackageEditionConfigFeatureDto): string {
        let featureValue = '';
        if (feature.value !== undefined) {
            featureValue += ': ';
            if (feature.definition.isVariable && feature.value !== '-1') {
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
