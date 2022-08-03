import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
    Input,
    HostBinding,
    ViewEncapsulation
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { PackageEditionConfigDto, ProductInfo, ProductSubscriptionOptionInfo, RecurringPaymentFrequency } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModuleType } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'package-card',
    templateUrl: './package-card.component.html',
    styleUrls: ['./package-card.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.Emulated,
    providers: [ DecimalPipe ]
})
export class PackageCardComponent implements OnChanges {
    @Input() productInfo: ProductInfo;
    @Input() billingPeriod: BillingPeriod;
    @Input() currencySymbol = '$';
    @Input() usersAmount: number;
    @Input() module: ModuleType;
    @HostBinding('class.isActive') @Input() public isActive: boolean;
    @HostBinding('class.bestValue') @Input() bestValue = false;
    @HostBinding('style.background') background;

    saveAmountPerMonth: number;
    baseUrl = AppConsts.appBaseHref;
    selectedEdition: PackageEditionConfigDto;
    price: number;

    features;
    products = {
        Startup: {
            saveAmount: 159,
            background: '#a0bc51',
            features: {
                included: ['Single Team Admin User', '2,000 Leads & Contacts', 'Customer Relationship Manager', 'Sales Management'],
                excluded: ['Affiliate Tracking System', 'Member Portal & Management', 'Developer Features & API Access', 'Custom Branding & Domain']
            }
        },
        Launch: {
            saveAmount: 759,
            background: '#eb8a2e',
            features: {
                included: ['Up to 5 Team Admin & Users', '10,000 Leads & Contacts', 'Customer Relationship Manager', 'Sales Management', 'Affiliate Tracking System', 'Member Portal & Management'],
                excluded: ['Developer Features & API Access', 'Custom Branding & Domain']
            }
        },
        Growth: {
            saveAmount: 3795,
            background: '#79519a',
            features: {
                included: ['Up to 25 Team Admin & Users', '50,000 Leads & Contacts', 'Customer Relationship Manager', 'Sales Management', 'Affiliate Tracking System', 'Member Portal & Management', 'Developer Features & API Access', 'Custom Branding & Domain'],
                excluded: []
            }
        },
        Fortune: {
            saveAmount: 5995,
            background: '#d73061',
            features: {
                included: ['Up to 50 Team Admin & Users', '100,000 Leads & Contacts', 'Customer Relationship Manager', 'Sales Management', 'Affiliate Tracking System', 'Member Portal & Management', 'Developer Features & API Access', 'Custom Branding & Domain'],
                excluded: []
            }
        }
    }

    constructor(
        private decimalPipe: DecimalPipe,
        public ls: AppLocalizationService
    ) {}

    ngOnChanges(changes) {
        let product = this.products[this.productInfo.code];
        if (product) {
            this.saveAmountPerMonth = product.saveAmount;
            this.background = product.background;
            this.features = product.features;
        }

        //this.selectedEdition = this.getSelectedEdition();
        //this.isActive = this.editions && !!this.selectedEdition;
    }

    // getSelectedEdition(): PackageEditionConfigDto {
    //     return this.editions.find(edition => this.usersAmount <= edition.maxUserCount);
    // }

    // get selectedOrLastEdition(): PackageEditionConfigDto {
    //     return this.selectedEdition || this.editions[this.editions.length - 1];
    // }

    // get selectedEditionUsersAmount(): number {
    //     return +this.selectedOrLastEdition.maxUserCount;
    // }

    // get displayedUsersAmount(): number {
    //     return this.isActive ? this.usersAmount : this.selectedOrLastEdition.maxUserCount;
    // }

    // get features(): PackageEditionConfigFeatureDto[] {
    //     return this.selectedOrLastEdition.features;
    // }

    get pricePerMonth(): number {
        let productMonthly = this.productInfo.productSubscriptionOptions.find(x => x.frequency == RecurringPaymentFrequency.Monthly),
            productAnnual = this.productInfo.productSubscriptionOptions.find(x => x.frequency == RecurringPaymentFrequency.Annual);
        return this.billingPeriod === BillingPeriod.Monthly 
            ? (productMonthly ? productMonthly.fee : 0)
            : (productAnnual ? Math.round(productAnnual.fee / 12) : 0)
    }

    // get editionPricePerMonth(): number {
    //     return this.billingPeriod === BillingPeriod.Monthly ?
    //             this.selectedOrLastEdition.monthlyPrice :
    //             +(this.selectedOrLastEdition.annualPrice / 12).toFixed(2);
    // }

    // get monthlyPricePerYear(): number {
    //     return this.selectedOrLastEdition.monthlyPrice * 12 / this.usersCoefficient;
    // }

    // get totalPrice(): number {
    //     return this.billingPeriod === BillingPeriod.Monthly
    //         ? this.selectedOrLastEdition.monthlyPrice / this.usersCoefficient
    //         : this.selectedOrLastEdition.annualPrice / this.usersCoefficient;
    // }

    // get pricePerUserPerMonth(): number {
    //     return (+(this.editionPricePerMonth / this.selectedEditionUsersAmount).toFixed(2));
    // }

    // get usersCoefficient() {
    //     return this.selectedEditionUsersAmount / this.displayedUsersAmount;
    // }

    // getFeatureValue(feature: PackageEditionConfigFeatureDto): string {
    //     let featureValue = '';
    //     if (feature.value) {
    //         if (feature.definition.isVariable && feature.value !== '-1') {
    //             featureValue += +feature.value / this.usersCoefficient;
    //         } else if (feature.value === '-1') {
    //             featureValue += this.ls.l('Unlimited');
    //         } else {
    //             featureValue += feature.value;
    //         }
    //         /** If value is number - transform it to US format */
    //         featureValue = ': ' + (!isNaN(+(featureValue)) && isFinite(+featureValue)
    //                                   ? this.decimalPipe.transform(featureValue, '1.0-0', 'en-En')
    //                                   : featureValue
    //                               );
    //     }
    //     return featureValue;
    // }

}
