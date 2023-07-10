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
import { CustomPeriodType, PackageEditionConfigDto, ProductInfo, ProductSubscriptionOptionInfo, RecurringPaymentFrequency } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModuleType } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { PaymentService } from '../../payment.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'package-card',
    templateUrl: './package-card.component.html',
    styleUrls: ['./package-card.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [DecimalPipe]
})
export class PackageCardComponent implements OnChanges {
    currentBillingPeriod: BillingPeriod;

    @Input() productInfo: ProductInfo;
    @Input() set billingPeriod(value: BillingPeriod) {
        this.currentBillingPeriod = value;

        if (this.productInfo) {
            let period = PaymentService.getRecurringPaymentFrequency(value);
            let hasPeriodConfig = !!this.productInfo.productSubscriptionOptions.find(x => x.frequency == period);
            this.display = hasPeriodConfig ? 'block' : 'none';
            this.isActive = hasPeriodConfig;
        }
    }
    get billingPeriod() {
        return this.currentBillingPeriod;
    }
    @Input() currencySymbol = '$';
    @Input() usersAmount: number;
    @Input() module: ModuleType;
    @HostBinding('class.isActive') @Input() public isActive: boolean;
    @HostBinding('class.bestValue') @Input() bestValue = false;
    @HostBinding('style.background') @Input() background;
    @HostBinding('style.display') display = 'block';

    billingPeriodEnum = BillingPeriod;
    saveAmountPerMonth: number;
    baseUrl = AppConsts.appBaseHref;
    selectedEdition: PackageEditionConfigDto;
    price: number;

    descriptionHtml;
    features;
    products = {
        Solo: {
            saveAmount: 159,
            background: '#a0bc51',
            features: {
                included: ['Single Team Admin User', '1,000 Leads & Contacts', 'Customer Relationship Manager'],
                excluded: ['Sales Management', 'Affiliate Tracking System', 'Member Portal & Management', 'Developer Features & API Access', 'Custom Branding & Domain']
            }
        },
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
            background: '#D27C2A',
            features: {
                included: ['Up to 5 Team Admin & Users', '10,000 Leads & Contacts', 'Customer Relationship Manager', 'Sales Management', 'Affiliate Tracking System', 'Member Portal & Management'],
                excluded: ['Developer Features & API Access', 'Custom Branding & Domain']
            }
        },
        Growth: {
            saveAmount: 3795,
            background: '#6D4A89',
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
        private sanitizer: DomSanitizer,
        public ls: AppLocalizationService
    ) { }

    ngOnChanges(changes) {
        let product = this.products[this.productInfo.code];
        if (product) {
            this.saveAmountPerMonth = product.saveAmount;
            this.background = product.background;
            this.features = product.features;
        }
        this.descriptionHtml = this.productInfo.descriptionHtml && this.sanitizer.bypassSecurityTrustHtml(this.productInfo.descriptionHtml);

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

    get pricePerPeriod(): number {
        let productFrequencyInfo = this.getFrequencyInfo();
        return this.billingPeriod === BillingPeriod.Yearly ?
            (productFrequencyInfo ? Math.round(productFrequencyInfo.fee / 12) : 0) :
            (productFrequencyInfo ? productFrequencyInfo.fee : 0);
    }

    getPriceDescription(): string {
        if (this.billingPeriod == BillingPeriod.Custom) {
            let productFrequencyInfo = this.getFrequencyInfo();

            if (productFrequencyInfo)
                return this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'RecurringPaymentFrequency_CustomDescription', productFrequencyInfo.customPeriodCount,
                    this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'CustomPeriodType_' + CustomPeriodType[productFrequencyInfo.customPeriodType]));
            return '';
        } else {
            return this.ls.l('price' + BillingPeriod[this.billingPeriod]);
        }
    }

    getFrequencyInfo(): ProductSubscriptionOptionInfo {
        let recurringFrequency = PaymentService.getRecurringPaymentFrequency(this.billingPeriod);
        return this.productInfo.productSubscriptionOptions.find(x => x.frequency == recurringFrequency);
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
