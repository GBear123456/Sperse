import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
    Input,
    HostBinding,
    ViewEncapsulation
} from '@angular/core';
import { DecimalPipe, getCurrencySymbol } from '@angular/common';
import { CustomPeriodType, ProductInfo, PriceOptionInfo, RecurringPaymentFrequency } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
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
    currentFrequency: RecurringPaymentFrequency;

    @Input() productInfo: ProductInfo;
    @Input() priceOptionInfo: PriceOptionInfo;
    @Input() set paymentFrequency(value: RecurringPaymentFrequency) {
        this.currentFrequency = value;

        if (this.priceOptionInfo) {
            let isCurrentPeriodConfig = this.priceOptionInfo.frequency == value;
            this.display = isCurrentPeriodConfig ? 'block' : 'none';
            this.isActive = isCurrentPeriodConfig;
        }
    }

    @Input() currencySymbol = '';
    @HostBinding('class.isActive') @Input() public isActive: boolean;
    @HostBinding('class.bestValue') @Input() bestValue = false;
    @HostBinding('style.background') @Input() background;
    @HostBinding('style.display') display = 'block';

    saveAmountPerMonth: number;
    baseUrl = AppConsts.appBaseHref;

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
        this.currencySymbol = getCurrencySymbol(this.productInfo.currencyId, 'narrow');
    }
    get pricePerPeriod(): number {
        return this.currentFrequency === RecurringPaymentFrequency.Annual ?
            Math.round(this.priceOptionInfo.fee / 12) :
            this.priceOptionInfo.fee;
    }

    get signupFee(): number {
        return this.priceOptionInfo.signupFee;
    }

    get trialDayCount(): number {
        return this.priceOptionInfo.trialDayCount;
    }

    getPriceDescription(): string {
        if (this.currentFrequency == RecurringPaymentFrequency.Custom) {
            return this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'RecurringPaymentFrequency_CustomDescription', this.priceOptionInfo.customPeriodCount,
                this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'CustomPeriodType_' + CustomPeriodType[this.priceOptionInfo.customPeriodType]));
        } else {
            return this.currentFrequency === RecurringPaymentFrequency.Annual ?
                this.ls.l('moBilledYearly') :
                this.ls.l('price' + this.priceOptionInfo.frequency);
        }
    }
}
