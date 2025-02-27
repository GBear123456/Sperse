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
import uniqBy from 'lodash/uniqBy';

/** Application imports */
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { PackageCardComponent } from '@app/shared/common/payment-wizard/package-chooser/package-card/package-card.component';
import { PaymentOptions } from '@app/shared/common/payment-wizard/models/payment-options.model';
import { AppConsts } from '@shared/AppConsts';
import {
    PaymentPeriodType,
    ModuleType,
    PackageConfigDto,
    PackageEditionConfigDto,
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
    @Input() packagesMaxUsersAmount: number;
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
    @Input() preventNextButtonDisabling = false;
    @Output() onPlanChosen: EventEmitter<PaymentOptions> = new EventEmitter();
    @Output() moveToNextStep: EventEmitter<null> = new EventEmitter();
    @HostBinding('class.withBackground') @Input() showBackground;
    modules = ModuleType;
    packages: ProductInfo[];
    currentProductId: number;
    usersAmount = null;
    sliderInitialMinValue = 5;
    sliderInitialStep = 5;
    sliderInitialMaxValue = 100;
    sliderStep = 5;
    selectedPackageIndex: number;
    selectedPackageCardComponent: PackageCardComponent;
    selectedBillingPeriod = BillingPeriod.Yearly;
    billingPeriod = BillingPeriod;
    recurringPaymentFrequency = RecurringPaymentFrequency;

    public freePackages: PackageConfigDto[];
    packagesConfig$: Observable<ProductInfo[]>;// = this.paymentService.packagesConfig$;
    tenantSubscriptionIsTrial: boolean;
    tenantSubscriptionIsFree: boolean;

    backgroundColors: string[] = [
        '#a27cbf',
        '#4862aa',
        '#0079be',
        '#008dc2',
        '#7d7483',
        '#b2a8b8',
        '#008b7a'
    ];

    PRODUCT_GROUP_ADD_ON = AppConsts.PRODUCT_GROUP_ADD_ON;
    static availablePeriodsOrder = [BillingPeriod.Monthly, BillingPeriod.Yearly, BillingPeriod.LifeTime, BillingPeriod.Custom];
    availablePeriods: BillingPeriod[] = [];
    selectedPeriodIndex = 0;

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
                return products.filter((product: ProductInfo) => !product.productSubscriptionOptions.some(option => option.frequency == RecurringPaymentFrequency.OneTime))
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
                this.selectedBillingPeriod = PaymentService.getBillingPeriod(moduleSubscriptionExpired.paymentPeriodType)
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
        return product.productSubscriptionOptions.filter(option => option.frequency == RecurringPaymentFrequency.Monthly)[0];
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
                    this.selectPackage(0);
                    this.changeDetectionRef.detectChanges();
                }, 100);
            else
                this.changeDetectionRef.detectChanges();
        });
    }

    initAvailablePeriods() {
        let periods: RecurringPaymentFrequency[] = this.packages.reduce((acc, val) => {
            if (val.productSubscriptionOptions)
                return uniqBy(acc.concat(val.productSubscriptionOptions.map(option => option.frequency)), (val) => val);
            return acc;
        }, []);

        let billingPeriods = periods.map(v => PaymentService.getBillingPeriodByPaymentFrequency(v));
        this.availablePeriods = [];
        PackageChooserComponent.availablePeriodsOrder.forEach(v => {
            if (billingPeriods.indexOf(v) >= 0)
                this.availablePeriods.push(v);
        });
    }

    /** Preselect package if current edition is in list of not free packages, else - preselect best value package */
    private preselectPackage() {
        let selectedPackage = this.packages.find(packageConfig => packageConfig.id == this.currentProductId);
        if (selectedPackage) {
            this.selectedPackageIndex = this.packages.indexOf(selectedPackage);
            /** Update selected package with the active status to handle next button status */
            setTimeout(() => {
                this.selectPackage(this.selectedPackageIndex);
                this.onPlanChosen.emit(this.getPaymentOptions());
            }, 10);
        } else
            selectedPackage = this.packages.reverse()[0];

        let productSubscriptionOption = selectedPackage && selectedPackage.productSubscriptionOptions.reverse()[0];
        if (productSubscriptionOption)
            this.selectedBillingPeriod = PaymentService.getBillingPeriodByPaymentFrequency(productSubscriptionOption.frequency);
    }

    selectPackage(packageIndex: number) {
        const selectedPlanCardComponent = this.packageCardComponents.toArray()[packageIndex];
        if (selectedPlanCardComponent.isActive) {
            this.selectedPackageIndex = packageIndex;
            this.selectedPackageCardComponent = selectedPlanCardComponent;
        }
    }

    getActiveStatus(period: BillingPeriod) {
        return this.selectedBillingPeriod == period;
    }

    toggle(value: BillingPeriod) {
        this.selectedBillingPeriod = value;
        this.emitPlanChange();
    }

    getSliderValue(): number {
        var periodIndex = this.availablePeriods.findIndex(v => v == this.selectedBillingPeriod);
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
            if (!this.selectedPackageIndex) {
                /** Get last package if noone hasn't been chosen */
                this.selectedPackageIndex = this.packages.length - 1;
            }
            this.selectPackage(this.selectedPackageIndex);
        }

        this.onPlanChosen.emit(this.getPaymentOptions());
        this.moveToNextStep.next();
    }

    getPaymentOptions(): PaymentOptions {
        if (this.selectedPackageCardComponent) {
            let selectedOption = this.selectedPackageCardComponent.productInfo.productSubscriptionOptions.find(option =>
                option.frequency == PaymentService.getRecurringPaymentFrequency(this.selectedBillingPeriod));

            const paymentOptions: PaymentOptions = {
                productId: this.selectedPackageCardComponent.productInfo.id,
                productName: this.selectedPackageCardComponent.productInfo.name,
                priceOptionId: selectedOption ? selectedOption.id : undefined,
                currencyId: this.selectedPackageCardComponent.productInfo.currencyId,
                currencySymbol: this.selectedPackageCardComponent.currencySymbol,
                paymentPeriodType: PaymentService.getPaymentPeriodType(this.selectedBillingPeriod),
                customPeriodDescription: this.selectedBillingPeriod == BillingPeriod.Custom ? this.selectedPackageCardComponent.getPriceDescription() : null,
                total: selectedOption ? selectedOption.fee : this.selectedPackageCardComponent.pricePerPeriod,
                signUpFee: this.selectedPackageCardComponent.signupFee,
                trialDayCount: this.selectedPackageCardComponent.trialDayCount
            };
            return paymentOptions;
        }
    }

    isProductPurchased(product) {
        return this.productsGroupName == this.PRODUCT_GROUP_ADD_ON &&
            product && this.appService.moduleSubscriptions.length &&
            this.appService.moduleSubscriptions.some(sub => sub.productId == product.id);
    }

    get nextButtonDisabled(): boolean {
        let disabled = false;
        if (!this.preventNextButtonDisabling) {
            disabled = this.selectedPackageIndex === undefined || this.selectedPackageIndex < 0 || (this.selectedPackageCardComponent && !this.selectedPackageCardComponent.isActive);
        }
        return disabled;
    }
}