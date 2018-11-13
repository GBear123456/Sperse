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
    ViewEncapsulation,
    QueryList,
    HostBinding
} from '@angular/core';

/** Third party imports */
import { MatSliderChange, MatSlider } from '@angular/material';
import { Observable } from 'rxjs';
import { concatAll, map, max, pluck, publishReplay, refCount } from 'rxjs/operators';
import { partition } from 'lodash';

/** Application imports */
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { PackageCardComponent } from '@app/shared/common/payment-wizard/package-chooser/package-card/package-card.component';
import { PackageOptions } from '@app/shared/common/payment-wizard/models/package-options.model';
import { AppConsts } from '@shared/AppConsts.ts';
import {
    GetPackagesConfigOutput,
    ModuleSubscriptionInfoFrequency,
    Module,
    PackageConfigDto,
    PackageEditionConfigDto,
    PackageServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'package-chooser',
    templateUrl: './package-chooser.component.html',
    styleUrls: ['./package-chooser.component.less'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackageChooserComponent implements OnInit {
    @ViewChildren(PackageCardComponent) packageCardComponents: QueryList<PackageCardComponent>;
    @ViewChildren(MatSlider) slider: MatSlider;
    @Input() module: Module;
    @Input() title: string;
    @Input() subtitle = this.l('ChoosePlan');
    @Input() yearDiscount = 33;
    @Input() packagesMaxUsersAmount: number;
    @Input() nextStepButtonText = this.l('Next');
    @Input() nextButtonPosition: 'right' | 'center' = 'right';
    @Input() showDowngradeLink = false;
    @Output() onPlanChosen: EventEmitter<PackageOptions> = new EventEmitter();
    @Output() moveToNextStep: EventEmitter<null> = new EventEmitter();
    @HostBinding('class.withBackground') @Input() showBackground;
    packages: PackageConfigDto[];
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
    private freePackages: PackageConfigDto[];
    private enableSliderScalingChange = false;

    constructor(
        private localizationService: AppLocalizationService,
        private packageServiceProxy: PackageServiceProxy,
        private changeDetectionRef: ChangeDetectorRef
    ) {}

    l(key: string, ...args: any[]): string {
        return this.localizationService.l(key, AppConsts.localization.defaultLocalizationSourceName, ...args);
    }

    ngOnInit() {
        if (!this.title) {
            /** Default value for title if any was set in input */
            this.title = this.l('TrialExpired', this.module);
        }
        const packagesConfig$: Observable<GetPackagesConfigOutput> = this.packageServiceProxy.getPackagesConfig(this.module).pipe(
            publishReplay(),
            refCount()
        );
        packagesConfig$.subscribe((packagesConfig: GetPackagesConfigOutput) => {
            this.splitPackagesForFreeAndNotFree(packagesConfig);
            this.getCurrentPackageAndEdition(packagesConfig);
            this.changeDefaultSettings(packagesConfig);
            this.preselectPackage();
            this.changeDetectionRef.detectChanges();
        });
        this.getMaxUsersAmount(packagesConfig$).subscribe(maxAmount => {
            this.packagesMaxUsersAmount = maxAmount;
            this.changeDetectionRef.detectChanges();
        });
    }

    getCurrentPackageAndEdition(packagesConfig: GetPackagesConfigOutput) {
        let currentEditionId = packagesConfig.currentSubscriptionInfo ? packagesConfig.currentSubscriptionInfo.editionId : undefined;
        this.currentPackage = this.packages.find(packageConfig => packageConfig.editions.some(edition => edition.id === currentEditionId));
        this.currentEdition = this.currentPackage ? this.currentPackage.editions[currentEditionId] : null;
    }

    /** Split packages to free packages and notFreePackages */
    splitPackagesForFreeAndNotFree(packagesConfig: GetPackagesConfigOutput) {
        let [ notFreePackages, freePackages ] = partition(packagesConfig.packages, packageConfig => !!packageConfig.editions[0].annualPrice);
        this.freePackages = freePackages;
        this.packages = notFreePackages;
    }

    /** Preselect package if current edition is in list of not free packages, else - preselect best value package */
    preselectPackage() {
        const selectedPackage = this.currentPackage || this.packages.find(packageConfig => packageConfig.bestValue);
        this.selectedPackageIndex = this.packages.indexOf(selectedPackage);
        /** Update selected package with the active status to handle next button status */
        setTimeout(() => {
            this.selectPackage(this.selectedPackageIndex);
            const plan = this.getPlan();
            this.onPlanChosen.emit(plan);
        }, 10);
    }

    /** Get values of usersAmount and billing period from user previous choice */
    changeDefaultSettings(packagesConfig: GetPackagesConfigOutput) {
        this.usersAmount = this.round(
            packagesConfig.currentSubscriptionInfo &&
                   (
                       packagesConfig.currentSubscriptionInfo.maxUserCount ||
                       (this.currentEdition && this.currentEdition.maxUserCount)
                   ) ||
                  this.defaultUsersAmount
            );
        if (packagesConfig.currentSubscriptionInfo && packagesConfig.currentSubscriptionInfo.frequency) {
            this.selectedBillingPeriod = packagesConfig.currentSubscriptionInfo.frequency === ModuleSubscriptionInfoFrequency._30 ? BillingPeriod.Monthly : BillingPeriod.Yearly;
        }
    }

    private round(amount: number): number {
        return Math.ceil(amount / this.sliderInitialStep) * this.sliderInitialStep;
    }

    /** Return the highest users count from all packages */
    getMaxUsersAmount(packagesConfig$: Observable<GetPackagesConfigOutput>): Observable<number> {
        return packagesConfig$.pipe(
            pluck('packages'),
            concatAll(),
            map((packageConfig: PackageConfigDto) => packageConfig.editions),
            concatAll(),
            map((edition: PackageEditionConfigDto) => edition.maxUserCount),
            max()
        );
    }

    billingPeriodChanged(e) {
        this.selectedBillingPeriod = e.checked ? BillingPeriod.Yearly : BillingPeriod.Monthly;
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

    onActiveUsersChange(event: MatSliderChange) {
        this.usersAmount = event.value;
    }

    decreaseUserCount() {
        if (this.usersAmount <= this.sliderInitialMinValue) return;
        if (this.enableSliderScalingChange) {
            if (this.sliderStep !== this.sliderInitialStep && this.usersAmount === this.sliderInitialMaxValue) {
                this.repaintSlider(this.sliderInitialMinValue, this.sliderInitialMaxValue, this.sliderInitialStep);
            }
        }
        this.usersAmount = this.usersAmount - this.sliderStep;
    }

    increaseUserCount() {
        if (this.enableSliderScalingChange) {
            if (this.usersAmount >= this.packagesMaxUsersAmount) return;
            if (this.usersAmount > ( this.sliderInitialMaxValue - this.sliderStep ) && this.packagesMaxUsersAmount > this.sliderInitialMaxValue ) {
                const step = (this.packagesMaxUsersAmount - this.sliderInitialMaxValue) / 8;
                this.repaintSlider(this.sliderInitialMaxValue, this.packagesMaxUsersAmount, step);
            }
        } else {
            if (this.usersAmount >= this.sliderInitialMaxValue) return;
        }
        this.usersAmount = this.usersAmount + this.sliderStep;
    }

    repaintSlider(min: number, max: number, step: number) {
        this.slider['first']._min = min;
        this.slider['first']._max = max;
        this.slider['first']._step = this.sliderStep = step;
    }

    downGradeToFree() {
        if (this.showDowngradeLink) {
            const freePlan = this.getFreePlan();
            this.onPlanChosen.emit(freePlan);
            this.moveToNextStep.next();
        }
    }

    private getSubscriptionFrequency(): ModuleSubscriptionInfoFrequency {
        return this.selectedPackageCardComponent.billingPeriod === BillingPeriod.Monthly
            ? ModuleSubscriptionInfoFrequency._30
            : ModuleSubscriptionInfoFrequency._365;
    }

    goToNextStep() {
        if (!this.selectedPackageCardComponent) {
            this.selectPackage(this.selectedPackageIndex);
        }

        const plan = this.getPlan();
        this.onPlanChosen.emit(plan);
        this.moveToNextStep.next();
    }

    getFreePlan() {
        return {
            name: this.freePackages[0].editions[0].displayName,
            billingPeriod: this.selectedPackageCardComponent.billingPeriod,
            subscriptionFrequency: this.getSubscriptionFrequency(),
            pricePerUserPerMonth: 0,
            subtotal: 0,
            discount: 0,
            total: 0,
            usersAmount: +this.freePackages[0].editions[0].maxUserCount,
            selectedEditionId: this.freePackages[0].editions[0].id,
            selectedEditionName: this.freePackages[0].editions[0].name
        };
    }

    /** @todo refactor - calculate data in payment service instead of calculating of the plan values from the plan components */
    getPlan() {
        const totalPrice = this.selectedPackageCardComponent.totalPrice;
        const plan: PackageOptions = {
            name: this.selectedPackageCardComponent.name,
            billingPeriod: this.selectedPackageCardComponent.billingPeriod,
            subscriptionFrequency: this.getSubscriptionFrequency(),
            pricePerUserPerMonth: this.selectedPackageCardComponent.pricePerUserPerMonth,
            subtotal: this.selectedBillingPeriod === BillingPeriod.Yearly ? this.selectedPackageCardComponent.monthlyPricePerYear : totalPrice,
            discount: this.selectedBillingPeriod === BillingPeriod.Yearly ? this.yearDiscount : 0,
            total: totalPrice,
            usersAmount: this.usersAmount,
            selectedEditionId: this.selectedPackageCardComponent.selectedEdition.id,
            selectedEditionName: this.selectedPackageCardComponent.selectedEdition.name
        };
        return plan;
    }

}
