/** Core imports */
import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

/** Third party imports */
import kebabCase from 'lodash/kebabCase';

/** Application imports */
import { AppFeatures } from '@shared/AppFeatures';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';

@Component({
    selector: 'app-lendspace-welcome2',
    templateUrl: './lendspace-welcome2.component.html',
    styleUrls: ['./lendspace-welcome2.component.less']
})

export class LendspaceWelcome2Component implements OnInit {
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
        public ls: AppLocalizationService,
        @Inject(DOCUMENT) private document: any
    ) {
    }

    ngOnInit() {
        this.document.body.scrollTo(0, 0);
    }

    navigate(route) {
        this.router.navigate(route);
    }
}
