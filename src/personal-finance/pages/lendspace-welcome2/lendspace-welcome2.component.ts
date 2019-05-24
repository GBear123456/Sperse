import { Component, Inject, Injector, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import kebabCase from 'lodash/kebabCase';

@Component({
  selector: 'app-lendspace-welcome2',
  templateUrl: './lendspace-welcome2.component.html',
  styleUrls: ['./lendspace-welcome2.component.less']
})

export class LendspaceWelcome2Component extends AppComponentBase implements OnInit {
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
            hidden: !this.feature.isEnabled('CFO.Partner'),
        }
    ];

    constructor(injector: Injector, @Inject(DOCUMENT) private document: any) {
        super(injector, AppConsts.localization.PFMLocalizationSourceName);
    }

    ngOnInit() {
        this.document.body.scrollTo(0, 0);
    }

    navigate(route) {
        this._router.navigate(route);
    }
}
