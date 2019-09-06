import { Component, OnInit } from '@angular/core';
import { AppFeatures } from '@shared/AppFeatures';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import kebabCase from 'lodash/kebabCase';
import { Router } from '@angular/router';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'host-home-component',
    templateUrl: 'host-home.component.html',
    styleUrls: [ './host-home.component.less' ]
})

export class HostHomeComponent implements OnInit {
    kebabCase = kebabCase;
    categoryItems = [
        {
            name: 'CreditReports',
            button: 'GetMyScore',
            router: 'personal-finance/credit-reports',
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
    ) { }

    ngOnInit() {}

    navigate(route) {
        this.router.navigate(route);
    }
}
