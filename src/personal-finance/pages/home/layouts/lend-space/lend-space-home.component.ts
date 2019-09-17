import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import kebabCase from 'lodash/kebabCase';
import { AppFeatures } from '@shared/AppFeatures';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'lend-space-home',
    templateUrl: 'lend-space-home.component.html',
    styleUrls: [ './lend-space-home.component.less' ]
})
export class LendSpaceHomeComponent implements OnInit {
    kebabCase = kebabCase;
    categoryItems = [
        {
            name: 'CreditScores',
            button: 'GetMyScore',
            router: 'personal-finance/offers/credit-scores',
            hidden: false
        },
        {
            name: 'CreditCards',
            button: 'SeeOffers',
            router: 'personal-finance/offers/credit-cards/home',
            hidden: false
        },
        {
            name: 'PersonalLoans',
            button: 'SeeOffers',
            router: 'personal-finance/offers/personal-loans',
            hidden: false
        },
        {
            name: 'PersonalFinance',
            button: 'AddAccounts',
            router: 'personal-finance/my-finances',
            hidden: !this.featureService.isEnabled(AppFeatures.CFOPartner),
        }
    ];
    constructor(
        private featureService: FeatureCheckerService,
        private router: Router,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() { }

    navigate(route) {
        this.router.navigate(route);
    }
}
