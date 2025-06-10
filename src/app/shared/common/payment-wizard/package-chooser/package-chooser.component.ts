/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    EventEmitter,
    OnInit,
    Input,
    Output,
    ViewChildren,
    QueryList,
    HostBinding
} from '@angular/core';

/** Third party imports */
import { MatSlider } from '@angular/material/slider';
import { Observable, forkJoin } from 'rxjs';
import { first, map } from 'rxjs/operators';
import uniq from 'lodash/uniq';
import flatMap from 'lodash/flatMap';
import countBy from 'lodash/countBy';

/** Application imports */
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { PackageCardComponent } from '@app/shared/common/payment-wizard/package-chooser/package-card/package-card.component';
import { PaymentOptions } from '@app/shared/common/payment-wizard/models/payment-options.model';
import { AppConsts } from '@shared/AppConsts';
import {
    PaymentPeriodType,
    RecurringPaymentFrequency,
    ProductInfo,
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LocalizationResolver } from '@root/shared/common/localization-resolver';
import { AppService } from '@app/app.service';

@Component({
    selector: 'package-chooser',
    templateUrl: './package-chooser.component.html',
    styleUrls: [
        './package-chooser.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackageChooserComponent implements OnInit {
    @ViewChildren(PackageCardComponent) packageCardComponents: QueryList<PackageCardComponent>;
    @ViewChildren(MatSlider) slider: MatSlider;
    @Input() widgettitle: string;
    @Input() subtitle = this.ls.l('ChoosePlan');
    @Input() yearDiscount = 20;
    @Input() nextStepButtonText = this.ls.l('Next');
    @Input() nextButtonPosition: 'right' | 'center' = 'right';
    @Input() showDowngradeLink = false;
    @Input() subscription: any;
    @Input() upgradeProductId: number;
    @Input() productsGroupName: string;

    private _preselect = true;
    @Input('preselect')
    get preselect(): boolean {
        return this._preselect;
    }
    set preselect(value: boolean) {
        this._preselect = '' + value !== 'false';
    }
    @Output() onPlanChosen: EventEmitter<PaymentOptions> = new EventEmitter();
    @Output() moveToNextStep: EventEmitter<null> = new EventEmitter();
    @HostBinding('class.withBackground') @Input() showBackground;
    packages: ProductInfo[];
    maxFrequencyCount: number = 1;
    currentProductId: number;
    currentPriceOptionId: number;

    selectedPriceOptionId: number;
    selectedPackageCardComponent: PackageCardComponent;
    selectedPaymentFrequency = RecurringPaymentFrequency.Annual;
    recurringPaymentFrequency = RecurringPaymentFrequency;

    packagesConfig$: Observable<ProductInfo[]>;// = this.paymentService.packagesConfig$;

    backgroundColors: string[] = [
        '#a27cbf',
        '#4862aa',
        '#0079be',
        '#008dc2',
        '#7d7483',
        '#b2a8b8',
        '#008b7a'
    ];

    crmLocalizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
    PRODUCT_GROUP_ADD_ON = AppConsts.PRODUCT_GROUP_ADD_ON;
    static availablePeriodsOrder = [RecurringPaymentFrequency.Monthly, RecurringPaymentFrequency.Annual, RecurringPaymentFrequency.LifeTime, RecurringPaymentFrequency.Custom];
    availablePeriods: RecurringPaymentFrequency[] = [];

    constructor(
        public localizationService: AppLocalizationService,
        private localizationResolver: LocalizationResolver,
        private paymentService: PaymentService,
        private changeDetectionRef: ChangeDetectorRef,
        private appService: AppService,
        public ls: AppLocalizationService
    ) { }

    ngOnInit() {
        let packagesConfig$: Observable<ProductInfo[]>;
        if (this.upgradeProductId) {
            packagesConfig$ = this.paymentService.getUpgradeConfig(this.upgradeProductId);
        } else {
            packagesConfig$ = this.productsGroupName == AppConsts.PRODUCT_GROUP_ADD_ON ?
                this.paymentService.addOnConfig$ : this.paymentService.packagesConfig$;
        }

        this.packagesConfig$ = packagesConfig$.pipe(map(
            (products: ProductInfo[]) => {
                return products.filter((product: ProductInfo) => !product.priceOptions.some(option => option.frequency == RecurringPaymentFrequency.OneTime))
            }
        ));

        forkJoin([
            this.localizationResolver.checkLoadLocalization(AppConsts.localization.defaultLocalizationSourceName),
            this.localizationResolver.checkLoadLocalization(AppConsts.localization.CFOLocalizationSourceName),
            this.localizationResolver.checkLoadLocalization(AppConsts.localization.CRMLocalizationSourceName)
        ]).subscribe(() => {
            this.loadPackages();
        });

        if (this.appService.moduleSubscriptions.length) {
            let moduleSubscriptionExpired = this.findSubscriptionByProductId(this.upgradeProductId) || this.subscription || this.appService.moduleSubscriptions[0];
            if (moduleSubscriptionExpired.paymentPeriodType != PaymentPeriodType.OneTime &&
                this.appService.subscriptionInGracePeriodBySubscription(moduleSubscriptionExpired)
            ) {
                this.currentProductId = moduleSubscriptionExpired.productId;
                this.currentPriceOptionId = moduleSubscriptionExpired.priceOptionId;
                this.selectedPaymentFrequency = PaymentService.getRecurringFrequencyByPaymentPeriodType(moduleSubscriptionExpired.paymentPeriodType)
            }

            if (this.upgradeProductId) {
                this.widgettitle = this.ls.l('UpgradeSubscriptionOptions', moduleSubscriptionExpired.productName);
                this.subtitle = this.ls.l('UpgradeSubscriptionOptionsHint', moduleSubscriptionExpired.productName);
            }

            if (!this.widgettitle) {
                this.widgettitle = this.ls.l('ModuleExpired', moduleSubscriptionExpired.productName, this.appService.getSubscriptionStatusBySubscription(moduleSubscriptionExpired));
            }
        }
    }

    private findSubscriptionByProductId(productId: number) {
        if (!productId)
            return;

        return this.appService.moduleSubscriptions.find(x => x.productId == productId);
    }

    getProductMonthlyOption(product: ProductInfo) {
        return product.priceOptions.filter(option => option.frequency == RecurringPaymentFrequency.Monthly)[0];
    }

    loadPackages() {
        this.packagesConfig$.pipe(first()).subscribe((products: ProductInfo[]) => {
            this.packages = products.sort((prev: ProductInfo, next: ProductInfo) => {
                let prevOption = this.getProductMonthlyOption(prev),
                    nextOption = this.getProductMonthlyOption(next);
                return (prevOption ? prevOption.fee : 0) > (nextOption ? nextOption.fee : 0) ? 1 : -1;
            });
            this.initAvailablePeriods();
            this.preselectPackage();

            if (this.packages.length == 1)
                setTimeout(() => {
                    this.selectPriceOption(this.packages[0].priceOptions[0].id);
                    this.changeDetectionRef.detectChanges();
                }, 100);
            else
                this.changeDetectionRef.detectChanges();
        });
    }

    initAvailablePeriods() {
        const allFrequencies = flatMap(this.packages, v => v.priceOptions.map(option => option.frequency));

        let periods: RecurringPaymentFrequency[] = uniq(allFrequencies);
        this.availablePeriods = [];
        PackageChooserComponent.availablePeriodsOrder.forEach(v => {
            if (periods.indexOf(v) >= 0)
                this.availablePeriods.push(v);
        });

        const frequencyCount = countBy(allFrequencies);
        this.maxFrequencyCount = Math.max(...Object.values(frequencyCount));
    }

    /** Preselect package if current edition is in list of not free packages, else - preselect best value package */
    private preselectPackage() {
        let selectedPackage = this.packages.find(packageConfig => packageConfig.id == this.currentProductId);
        let selectedPriceOption = null;
        if (selectedPackage) {
            selectedPriceOption = selectedPackage.priceOptions.find(v => v.id == this.currentPriceOptionId);
            if (selectedPriceOption) {
                /** Update selected package with the active status to handle next button status */
                setTimeout(() => {
                    this.selectPriceOption(this.selectedPriceOptionId);
                    this.onPlanChosen.emit(this.getPaymentOptions());
                }, 10);
            }
        } else
            selectedPackage = this.packages.reverse()[0];

        let productSubscriptionOption = selectedPriceOption || (selectedPackage && selectedPackage.priceOptions.reverse()[0]);
        if (productSubscriptionOption)
            this.selectedPaymentFrequency = productSubscriptionOption.frequency;
    }

    selectPriceOption(priceOptionId: number) {
        const selectedPlanCardComponent = this.packageCardComponents.find(v => v.priceOptionInfo.id == priceOptionId);
        if (selectedPlanCardComponent.isActive) {
            this.selectedPriceOptionId = priceOptionId;
            this.selectedPackageCardComponent = selectedPlanCardComponent;
        }
    }

    getActiveStatus(frequency: RecurringPaymentFrequency) {
        return this.selectedPaymentFrequency == frequency;
    }

    toggle(frequency: RecurringPaymentFrequency) {
        this.selectedPaymentFrequency = frequency;
        this.emitPlanChange();
    }

    getSliderValue(): number {
        var periodIndex = this.availablePeriods.findIndex(v => v == this.selectedPaymentFrequency);
        var value = (this.availablePeriods.length > 1 ? periodIndex : 1) * (100 / this.availablePeriods.length);
        return +value.toFixed();
    }

    emitPlanChange() {
        setTimeout(() => {
            let paymentOptions = this.getPaymentOptions();
            if (paymentOptions)
                this.onPlanChosen.emit(paymentOptions);
        }, 10);
    }

    goToNextStep() {
        if (!this.selectedPackageCardComponent) {
            if (!this.selectedPriceOptionId) {
                /** Get last package if noone hasn't been chosen */
                let lastProductOptions = this.packages[this.packages.length - 1].priceOptions;
                let lastOptionId = lastProductOptions[lastProductOptions.length - 1].id;
                this.selectedPriceOptionId = lastOptionId;
            }
            this.selectPriceOption(this.selectedPriceOptionId);
        }

        this.onPlanChosen.emit(this.getPaymentOptions());
        this.moveToNextStep.next();
    }

    getPaymentOptions(): PaymentOptions {
        if (this.selectedPackageCardComponent) {
            let productInfo = this.selectedPackageCardComponent.productInfo;
            let selectedOption = this.selectedPackageCardComponent.priceOptionInfo;

            const paymentOptions: PaymentOptions = {
                productId: productInfo.id,
                productName: productInfo.name,
                priceOptionId: selectedOption.id,
                currencyId: productInfo.currencyId,
                currencySymbol: this.selectedPackageCardComponent.currencySymbol,
                paymentPeriodType: PaymentService.getPaymentPeriodType(this.selectedPaymentFrequency),
                customPeriodDescription: this.selectedPaymentFrequency == RecurringPaymentFrequency.Custom ? this.selectedPackageCardComponent.getPriceDescription() : null,
                total: selectedOption.fee,
                signUpFee: this.selectedPackageCardComponent.signupFee,
                trialDayCount: this.selectedPackageCardComponent.trialDayCount
            };
            return paymentOptions;
        }
    }

    isProductPurchased(priceOptionId: number) {
        return this.productsGroupName == this.PRODUCT_GROUP_ADD_ON && this.appService.moduleSubscriptions.length &&
            this.appService.moduleSubscriptions.some(sub => sub.priceOptionId == priceOptionId);
    }

    get nextButtonDisabled(): boolean {
        return !this.selectedPriceOptionId || (this.selectedPackageCardComponent && !this.selectedPackageCardComponent.isActive);
    }
}