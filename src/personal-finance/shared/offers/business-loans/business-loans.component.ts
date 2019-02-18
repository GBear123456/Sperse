import { Component, OnInit, ViewChild } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { OffersLayoutComponent } from '@root/personal-finance/shared/offers/offers-layout.component';
import { IAdvantage } from '@root/personal-finance/shared/offers/offers-category-details/advantage.interface';

@Component({
    selector: 'business-loans',
    templateUrl: './business-loans.component.html',
    styleUrls: ['./business-loans.component.less']
})
export class BusinessLoansComponent implements OnInit {
    @ViewChild(OffersLayoutComponent) offersLayoutComponent: OffersLayoutComponent;
    advantages: IAdvantage[] = [
        {
            value: this.ls.l('BusinessLoans_Choose6or12months'),
            disclaimerNumber: 1
        },
        {
            value: this.ls.l('BusinessLoans_QuickDecisioning'),
            disclaimerNumber: 2
        },
        {
            value: this.ls.l('BusinessLoans_TransparentTerms'),
        },
        {
            value: this.ls.l('BusinessLoans_RevolvingLines'),
            disclaimerNumber: 1
        }
    ];
    constructor(
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {}

}
