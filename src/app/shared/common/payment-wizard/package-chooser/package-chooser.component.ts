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
import { concatAll, map, max, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { PackageCardComponent } from '@app/shared/common/payment-wizard/package-chooser/package-card/package-card.component';
import { PackageOptions } from '@app/shared/common/payment-wizard/models/package-options.model';
import { AppConsts } from '@shared/AppConsts.ts';
import { Module, PackageConfigDto, PackageServiceProxy } from '@shared/service-proxies/service-proxies';
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
    @Input() packages: PackageConfigDto[];
    @Input() nextStepButtonText = this.l('Next');
    @Output() onPlanChosen: EventEmitter<PackageOptions> = new EventEmitter();
    @Output() moveToNextStep: EventEmitter<null> = new EventEmitter();
    @HostBinding('class.withBackground') @Input() showBackground;
    selectedBillingPeriod = BillingPeriod.Yearly;
    usersAmount = 25;
    sliderInitialMinValue = 5;
    sliderInitialStep = 5;
    sliderInitialMaxValue = 100;
    sliderStep = 5;
    selectedPackageIndex: number;
    selectedPackageCardComponent: PackageCardComponent;
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
        this.title = this.l('TrialExpired', this.module);
        const packagesConfig$ = this.packageServiceProxy.getPackagesConfig(this.module).pipe(
            publishReplay(),
            refCount(),
            map(packages => packages.filter(packageConfig => packageConfig.name !== 'Free ' + this.module))
        );
        packagesConfig$.subscribe(packages => {
            this.packages = packages;
            this.selectedPackageIndex = this.packages.indexOf(this.packages.find(packageConfig => packageConfig.bestValue));
            this.changeDetectionRef.detectChanges();
        });
        packagesConfig$.pipe(
            concatAll(),
            map(packages => packages.editions),
            concatAll(),
            map(editions => +editions.features[this.module + '.MaxUserCount']),
            max()
        ).subscribe(maxAmount => {
            this.packagesMaxUsersAmount = maxAmount;
            this.changeDetectionRef.detectChanges();
        });
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

    goToNextStep() {
        if (!this.selectedPackageCardComponent) {
            this.selectPackage(this.selectedPackageIndex);
        }

        const totalPrice = this.selectedPackageCardComponent.totalPrice;
        const plan: PackageOptions = {
            name: this.selectedPackageCardComponent.name,
            billingPeriod: this.selectedPackageCardComponent.billingPeriod,
            pricePerUserPerMonth: this.selectedPackageCardComponent.pricePerUserPerMonth,
            subtotal: this.selectedBillingPeriod === BillingPeriod.Yearly ? this.selectedPackageCardComponent.monthlyPricePerYear : totalPrice,
            discount: this.selectedBillingPeriod === BillingPeriod.Yearly ? this.yearDiscount : 0,
            total: totalPrice,
            usersAmount: this.selectedPackageCardComponent.selectedEditionUsersAmount,
            selectedEditionId: this.selectedPackageCardComponent.selectedEdition.id
        };
        this.onPlanChosen.emit(plan);
        this.moveToNextStep.next();
    }

}
