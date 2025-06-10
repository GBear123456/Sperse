import { Component } from '@angular/core';
import { AppFeatures } from '@shared/AppFeatures';
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
  selector: 'app-lendspace-welcome',
  templateUrl: './lendspace-welcome.component.html',
  styleUrls: ['./lendspace-welcome.component.less']
})
export class LendspaceWelcomeComponent {
    categoryItems = [
        {
            imgName: 'personal-loans',
            icon: 'shopping-cart-verified-symbol.svg',
            title: 'Personal Loans',
            text: 'Find lowest rates for',
            router: '/personal-finance/offers/personal-loans',
            hidden: false
        },
        {
            imgName: 'credit-cards',
            icon: 'credit-card-with-check-symbol.svg',
            title: 'Credit Cards',
            text: 'Search for the right',
            router: '/personal-finance/offers/credit-cards/home',
            hidden: false
        },
        {
            imgName: 'credit-reports',
            icon: 'gauge.svg',
            title: 'Credit Scores',
            text: 'Access your 3-Bureau',
            router: '/personal-finance/offers/credit-score',
            hidden: false
        },
        {
            imgName: 'personal-finance',
            icon: 'chart-bar.svg',
            title: 'Personal Finances',
            text: 'Track your combined',
            router: '/personal-finance/my-finances',
            hidden: !this.featureCheckerService.isEnabled(AppFeatures.CFOPartner),
        }
    ];

    constructor(
        private featureCheckerService: FeatureCheckerService,
        public ls: AppLocalizationService
    ) {}

}
