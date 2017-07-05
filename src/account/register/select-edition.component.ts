import { Component, Injector, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { TenantRegistrationServiceProxy, EditionsSelectOutput, EditionSelectDto, FlatFeatureSelectDto, EditionWithFeaturesDto } from '@shared/service-proxies/service-proxies'
import { AppComponentBase } from '@shared/common/app-component-base';
import { EditionPaymentType, SubscriptionStartType } from "@shared/AppEnums";
import { AppSessionService } from '@shared/common/session/app-session.service';

import * as _ from 'lodash';

@Component({
    templateUrl: './select-edition.component.html',
    styleUrls: ["./select-edition.component.less", "./pricing.min.css"],
    encapsulation: ViewEncapsulation.None,
    animations: [accountModuleAnimation()]
})
export class SelectEditionComponent extends AppComponentBase implements OnInit {

    editionsSelectOutput: EditionsSelectOutput = new EditionsSelectOutput();
    isUserLoggedIn: boolean = false;
    isSetted: boolean = false;
    editionPaymentType: typeof EditionPaymentType = EditionPaymentType;
    subscriptionStartType: typeof SubscriptionStartType = SubscriptionStartType;

    constructor(
        injector: Injector,
        private _tenantRegistrationService: TenantRegistrationServiceProxy,
        private _appSessionService: AppSessionService,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnInit() {
        this.isUserLoggedIn = abp.session.userId > 0;

        this._tenantRegistrationService.getEditionsForSelect()
            .subscribe((result) => {
                this.editionsSelectOutput = result;
                
                if (!this.editionsSelectOutput.editionsWithFeatures || this.editionsSelectOutput.editionsWithFeatures.length <= 0) {
                    this._router.navigate(['/account/register-tenant']);
                }
            });
    }

    isFree(edition: EditionSelectDto): boolean {
        return !edition.monthlyPrice && !edition.annualPrice;
    }

    isTrueFalseFeature(feature: FlatFeatureSelectDto): boolean {
        return feature.inputType.name === "CHECKBOX";
    }

    featureEnabledForEdition(feature: FlatFeatureSelectDto, edition: EditionWithFeaturesDto): boolean {
        let featureValues = _.filter(edition.featureValues, { name: feature.name });
        if (!featureValues || featureValues.length <= 0) {
            return false;
        }

        let featureValue = featureValues[0];
        return featureValue.value.toLowerCase() === "true";
    }

    getFeatureValueForEdition(feature: FlatFeatureSelectDto, edition: EditionWithFeaturesDto): string {
        let featureValues = _.filter(edition.featureValues, { name: feature.name });
        if (!featureValues || featureValues.length <= 0) {
            return '';
        }

        let featureValue = featureValues[0];
        return featureValue.value;
    }

    canUpgrade(edition: EditionSelectDto): boolean {
        let currentMonthlyPrice = this._appSessionService.tenant.edition.monthlyPrice
            ? this._appSessionService.tenant.edition.monthlyPrice
            : 0;

        let targetMonthlyPrice = edition && edition.monthlyPrice ? edition.monthlyPrice : 0;

        return this.isUserLoggedIn &&
            this._appSessionService.tenant.edition &&
            currentMonthlyPrice < targetMonthlyPrice;
    }
}