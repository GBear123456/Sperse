import { Component, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

import { kebabCase } from 'lodash';

@Component({
  selector: 'app-lendspace-welcome2',
  templateUrl: './lendspace-welcome2.component.html',
  styleUrls: ['./lendspace-welcome2.component.less']
})

export class LendspaceWelcome2Component extends AppComponentBase {
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
            router: 'personal-finance/offers/credit-cards/home/Best',
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
            button: 'SeeOffers',
            router: 'personal-finance/my-finances',
            hidden: !this.feature.isEnabled('CFO.Partner'),
        }
    ];

    constructor(injector: Injector) {
        super(injector, AppConsts.localization.PFMLocalizationSourceName);
    }

    navigate(route) {
        this._router.navigate(route);
    }
}