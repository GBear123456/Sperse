/** Core imports */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */

/** Application imports */
import { EditionPaymentType, SubscriptionStartType } from '@shared/AppEnums';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    EditionSelectDto,
    EditionWithFeaturesDto,
    EditionsSelectOutput,
    FlatFeatureSelectDto,
    TenantRegistrationServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './select-edition.component.html',
    styleUrls: ['./select-edition.component.less', './pricing.min.css'],
    encapsulation: ViewEncapsulation.None,
    animations: [accountModuleAnimation()]
})
export class SelectEditionComponent implements OnInit {

    editionsSelectOutput: EditionsSelectOutput = new EditionsSelectOutput();
    isUserLoggedIn = false;
    editionPaymentType: typeof EditionPaymentType = EditionPaymentType;
    subscriptionStartType: typeof SubscriptionStartType = SubscriptionStartType;
    /*you can change your edition icons order within editionIcons variable */
    editionIcons: string[] = ['flaticon-open-box', 'flaticon-rocket', 'flaticon-gift', 'flaticon-confetti', 'flaticon-puzzle', 'flaticon-app', 'flaticon-coins', 'flaticon-piggy-bank', 'flaticon-bag', 'flaticon-lifebuoy', 'flaticon-technology-1', 'flaticon-cogwheel-1', 'flaticon-infinity', 'flaticon-interface-5', 'flaticon-squares-3', 'flaticon-interface-6', 'flaticon-mark', 'flaticon-business', 'flaticon-interface-7', 'flaticon-list-2', 'flaticon-bell', 'flaticon-technology', 'flaticon-squares-2', 'flaticon-notes', 'flaticon-profile', 'flaticon-layers', 'flaticon-interface-4', 'flaticon-signs', 'flaticon-menu-1', 'flaticon-symbol'];

    constructor(
        private tenantRegistrationService: TenantRegistrationServiceProxy,
        private appSessionService: AppSessionService,
        private router: Router
    ) {}

    ngOnInit() {
        this.isUserLoggedIn = abp.session.userId > 0;

        this.tenantRegistrationService.getEditionsForSelect()
            .subscribe((result) => {
                this.editionsSelectOutput = result;

                if (!this.editionsSelectOutput.editionsWithFeatures || this.editionsSelectOutput.editionsWithFeatures.length <= 0) {
                    this.router.navigate(['/account/register-tenant']);
                }
            });
    }

    isFree(edition: EditionSelectDto): boolean {
        return !edition.monthlyPrice && !edition.annualPrice;
    }

    isTrueFalseFeature(feature: FlatFeatureSelectDto): boolean {
        return feature.inputType.name === 'CHECKBOX';
    }

    featureEnabledForEdition(feature: FlatFeatureSelectDto, edition: EditionWithFeaturesDto): boolean {
        const featureValues = edition.featureValues.filter(featureValue => featureValue.name === feature.name);
        if (!featureValues || featureValues.length <= 0) {
            return false;
        }

        const featureValue = featureValues[0];
        return featureValue.value.toLowerCase() === 'true';
    }

    getFeatureValueForEdition(feature: FlatFeatureSelectDto, edition: EditionWithFeaturesDto): string {
        const featureValues = edition.featureValues.filter(featureValue => featureValue.name === feature.name);
        if (!featureValues || featureValues.length <= 0) {
            return '';
        }

        const featureValue = featureValues[0];
        return featureValue.value;
    }

    canUpgrade(edition: EditionSelectDto): boolean {
        if (this.appSessionService.tenant.edition.id === edition.id) {
            return false;
        }

        const currentMonthlyPrice = this.appSessionService.tenant.edition.monthlyPrice
            ? this.appSessionService.tenant.edition.monthlyPrice
            : 0;

        const targetMonthlyPrice = edition && edition.monthlyPrice ? edition.monthlyPrice : 0;

        return this.isUserLoggedIn &&
            this.appSessionService.tenant.edition &&
            currentMonthlyPrice <= targetMonthlyPrice;
    }

    upgrade(upgradeEdition: EditionSelectDto, editionPaymentType: EditionPaymentType): void {
        this.router.navigate(['/account/upgrade'], {
            queryParams: {
                upgradeEditionId: upgradeEdition.id,
                editionPaymentType: editionPaymentType
            }
        });
    }

    upgradeIsFree(upgradeEdition: EditionSelectDto): boolean {
        if (!this.appSessionService.tenant || !this.appSessionService.tenant.edition) {
            return false;
        }

        const bothEditionsAreFree = this.appSessionService.tenant.edition.isFree && upgradeEdition.isFree;

        const bothEditionsHasSamePrice = !upgradeEdition.isFree &&
            upgradeEdition.monthlyPrice === this.appSessionService.tenant.edition.monthlyPrice &&
            upgradeEdition.annualPrice === this.appSessionService.tenant.edition.annualPrice;

        return bothEditionsAreFree || bothEditionsHasSamePrice;
    }
}
