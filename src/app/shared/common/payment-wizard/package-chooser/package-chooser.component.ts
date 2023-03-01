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
import { MatSliderChange, MatSlider } from '@angular/material/slider';
import { Observable, forkJoin } from 'rxjs';
import { first, concatAll, map, max, pluck, publishReplay, refCount } from 'rxjs/operators';
import partition from 'lodash/partition';

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
    PackageServiceProxy,
    ProductInfo,
    ProductServiceProxy
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
    private defaultUsersAmount = 5;
    private currentPackage: PackageConfigDto;
    private currentEdition: PackageEditionConfigDto;
    private enableSliderScalingChange = false;

    public freePackages: PackageConfigDto[];
    packagesConfig$: Observable<ProductInfo[]>;// = this.paymentService.packagesConfig$;
    configurator = 'billingPeriod';
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

    constructor(
        public localizationService: AppLocalizationService,
        private localizationResolver: LocalizationResolver,
        private packageServiceProxy: PackageServiceProxy,
        private paymentService: PaymentService,
        private changeDetectionRef: ChangeDetectorRef,
        private appService: AppService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        if (this.upgradeProductId) {
            this.packagesConfig$ = this.paymentService.getUpgradeConfig(this.upgradeProductId);
        } else {
            this.packagesConfig$ = this.paymentService.packagesConfig$;
        }

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
                this.selectedBillingPeriod = this.getBillingPeriod(moduleSubscriptionExpired.paymentPeriodType)
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

    private getBillingPeriod(paymentPeriodType: PaymentPeriodType): BillingPeriod {
        switch (paymentPeriodType)
        {
            case PaymentPeriodType.Monthly:
                return BillingPeriod.Monthly;
            case PaymentPeriodType.Annual:
                return BillingPeriod.Yearly;
            default: 
                return undefined;
        }
    }

    getProductMonthlyOption(product: ProductInfo) {
        return product.productSubscriptionOptions.filter(option => option.frequency == RecurringPaymentFrequency.Monthly)[0];
    }

    loadPackages() {
        this.packagesConfig$.pipe(first()).subscribe((products: ProductInfo[]) => {
            this.packages = products.sort((prev: ProductInfo, next: ProductInfo) => {
                let prevOption = this.getProductMonthlyOption(prev), 
                    nextOption = this.getProductMonthlyOption(next);
                return prevOption.fee > nextOption.fee ? 1: -1;
            });
            this.preselectPackage();
            // this.splitPackagesForFreeAndNotFree(packagesConfig);
            // this.getCurrentSubscriptionInfo(packagesConfig.currentSubscriptionInfo);
            // this.getCurrentPackageAndEdition(packagesConfig);
            // this.changeDefaultSettings(packagesConfig.currentSubscriptionInfo);
            // if (this.preselectionIsNeeded) {
            //     this.preselectPackage();
            // }
            this.changeDetectionRef.detectChanges();
        });
        // this.getMaxUsersAmount(this.packagesConfig$).subscribe(maxAmount => {
        //     this.packagesMaxUsersAmount = maxAmount;
        //     this.changeDetectionRef.detectChanges();
        // });
    }

    // get preselectionIsNeeded() {
    //     return this.preselect && !this.tenantSubscriptionIsFree && !this.tenantSubscriptionIsTrial;
    // }

    // private getCurrentSubscriptionInfo(currentSubscriptionInfo: ModuleSubscriptionInfoExtended): void {
    //     if (currentSubscriptionInfo) {
    //         this.tenantSubscriptionIsTrial = currentSubscriptionInfo.isTrial;
    //         this.tenantSubscriptionIsFree = this.freePackages && this.freePackages.length ? currentSubscriptionInfo.editionId === this.freePackages[0].editions[0].id : false;
    //     }
    // }

    // private getCurrentPackageAndEdition(packagesConfig: GetPackagesConfigOutput): void {
    //     let currentEditionId = packagesConfig.currentSubscriptionInfo ? packagesConfig.currentSubscriptionInfo.editionId : undefined;
    //     this.currentPackage = this.packages.find(packageConfig => {
    //         this.currentEdition = packageConfig.editions.find(edition => edition.id === currentEditionId);
    //         return !!this.currentEdition;
    //     });
    // }

    /** Preselect package if current edition is in list of not free packages, else - preselect best value package */
    private preselectPackage() {
        const selectedPackage = this.packages.find(packageConfig => packageConfig.id == this.currentProductId);
        if (selectedPackage) {
            this.selectedPackageIndex = this.packages.indexOf(selectedPackage);
            /** Update selected package with the active status to handle next button status */
            setTimeout(() => {
                this.selectPackage(this.selectedPackageIndex);
                this.onPlanChosen.emit(this.getPaymentOptions());
            }, 10);
        }
    }

    /** Get values of usersAmount and billing period from user previous choice */
    // private changeDefaultSettings(currentSubscriptionInfo: ModuleSubscriptionInfoExtended) {
    //     this.usersAmount = this.getDefaultUserAmount(currentSubscriptionInfo);
    //     this.selectedBillingPeriod = this.getDefaultBillingPeriod(currentSubscriptionInfo);
    // }

    // private getDefaultUserAmount(currentSubscriptionInfo: ModuleSubscriptionInfoExtended): number {
    //     let usersAmount: number = this.defaultUsersAmount;
    //     if (!this.tenantSubscriptionIsTrial && !this.tenantSubscriptionIsFree) {
    //         if (currentSubscriptionInfo) {
    //             const currentEditionMaxUserCount = this.currentEdition && this.currentEdition.maxUserCount;
    //             /** If both are available - then exclude case when current subscription value is bigger then in new packages*/
    //             if (currentSubscriptionInfo.maxUserCount && currentEditionMaxUserCount) {
    //                 usersAmount = currentSubscriptionInfo.maxUserCount > currentEditionMaxUserCount
    //                     ? currentEditionMaxUserCount
    //                     : currentSubscriptionInfo.maxUserCount;
    //             } else if (currentSubscriptionInfo.maxUserCount || currentEditionMaxUserCount) {
    //                 usersAmount = currentSubscriptionInfo.maxUserCount || currentEditionMaxUserCount;
    //             }
    //         }
    //         usersAmount = this.round(usersAmount);
    //         usersAmount = usersAmount > this.sliderInitialMaxValue || usersAmount < this.sliderInitialMinValue
    //             ? this.sliderInitialMaxValue
    //             : usersAmount;
    //     }
    //     return usersAmount;
    // }

    // private getDefaultBillingPeriod(currentSubscriptionInfo: ModuleSubscriptionInfoExtended) {
    //     return currentSubscriptionInfo && currentSubscriptionInfo.frequency === PaymentPeriodType.Monthly
    //         && !this.tenantSubscriptionIsFree && !this.tenantSubscriptionIsTrial
    //         ? BillingPeriod.Monthly
    //         : BillingPeriod.Yearly;
    // }

    // private round(amount: number): number {
    //     return Math.ceil(amount / this.sliderInitialStep) * this.sliderInitialStep;
    // }

    /** Return the highest users count from all packages */
    // private getMaxUsersAmount(packagesConfig$: Observable<GetPackagesConfigOutput>): Observable<number> {
    //     return packagesConfig$.pipe(
    //         pluck('packages'),
    //         concatAll(),
    //         map((packageConfig: PackageConfigDto) => packageConfig.editions),
    //         concatAll(),
    //         map((edition: PackageEditionConfigDto) => edition.maxUserCount),
    //         max()
    //     );
    // }

    billingPeriodChanged(e) {
        this.selectedBillingPeriod = e.checked ? BillingPeriod.Yearly : BillingPeriod.Monthly;

        setTimeout(() => {
            let paymentOptions = this.getPaymentOptions();
            if (paymentOptions)
                this.onPlanChosen.emit(paymentOptions);
        }, 10);
    }

    selectPackage(packageIndex: number) {
        const selectedPlanCardComponent = this.packageCardComponents.toArray()[packageIndex];
        if (selectedPlanCardComponent.isActive) {
            this.selectedPackageIndex = packageIndex;
            this.selectedPackageCardComponent = selectedPlanCardComponent;
        }
    }

    getActiveStatus(status: 'month' | 'year') {
        return (status === 'month' && this.selectedBillingPeriod === BillingPeriod.Monthly) ||
            (status === 'year' && this.selectedBillingPeriod === BillingPeriod.Yearly);
    }

    // onActiveUsersChange(event: MatSliderChange) {
    //     this.usersAmount = event.value;
    // }

    // decreaseUserCount() {
    //     if (this.usersAmount <= this.sliderInitialMinValue) return;
    //     if (this.enableSliderScalingChange) {
    //         if (this.sliderStep !== this.sliderInitialStep && this.usersAmount === this.sliderInitialMaxValue) {
    //             this.repaintSlider(this.sliderInitialMinValue, this.sliderInitialMaxValue, this.sliderInitialStep);
    //         }
    //     }
    //     this.usersAmount = this.usersAmount - this.sliderStep;
    // }

    // increaseUserCount() {
    //     if (this.enableSliderScalingChange) {
    //         if (this.usersAmount >= this.packagesMaxUsersAmount) return;
    //         if (this.usersAmount > (this.sliderInitialMaxValue - this.sliderStep) && this.packagesMaxUsersAmount > this.sliderInitialMaxValue) {
    //             const step = (this.packagesMaxUsersAmount - this.sliderInitialMaxValue) / 8;
    //             this.repaintSlider(this.sliderInitialMaxValue, this.packagesMaxUsersAmount, step);
    //         }
    //     } else {
    //         if (this.usersAmount >= this.sliderInitialMaxValue) return;
    //     }
    //     this.usersAmount = this.usersAmount + this.sliderStep;
    // }

    // repaintSlider(min: number, max: number, step: number) {
    //     this.slider['first']._min = min;
    //     this.slider['first']._max = max;
    //     this.slider['first']._step = this.sliderStep = step;
    // }

    private getSubscriptionFrequency(): PaymentPeriodType {
        return this.selectedBillingPeriod === BillingPeriod.Monthly
            ? PaymentPeriodType.Monthly
            : PaymentPeriodType.Annual;
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
            const paymentOptions: PaymentOptions = {
                productId: this.selectedPackageCardComponent.productInfo.id,
                productName: this.selectedPackageCardComponent.productInfo.name,
                paymentPeriodType: this.getSubscriptionFrequency(),
                total: this.selectedPackageCardComponent.pricePerMonth * (
                    this.selectedBillingPeriod === BillingPeriod.Yearly ? 12 : 1
                )
            };
            return paymentOptions;
        }
    }

    get nextButtonDisabled(): boolean {
        let disabled = false;
        if (!this.preventNextButtonDisabling) {
            disabled = this.selectedPackageIndex === undefined || this.selectedPackageIndex < 0 || (this.selectedPackageCardComponent && !this.selectedPackageCardComponent.isActive);
        }
        return disabled;
    }
}
