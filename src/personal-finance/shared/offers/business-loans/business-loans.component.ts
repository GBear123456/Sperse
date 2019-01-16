import { Component, OnInit, ViewChild } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { OffersLayoutComponent } from '@root/personal-finance/shared/offers/offers-layout.component';
import { OfferDto } from '@shared/service-proxies/service-proxies';
import { Observable } from 'rxjs';

@Component({
    selector: 'business-loans',
    templateUrl: './business-loans.component.html',
    styleUrls: ['./business-loans.component.less']
})
export class BusinessLoansComponent implements OnInit {
    @ViewChild(OffersLayoutComponent) offersLayoutComponent: OffersLayoutComponent;
    advantages = [
        this.ls.l('BusinessLoans_Choose6or12months'),
        this.ls.l('BusinessLoans_QuickDecisioning'),
        this.ls.l('BusinessLoans_TransparentTerms'),
        this.ls.l('BusinessLoans_RevolvingLines')
    ];
    offers$: Observable<OfferDto[]>;
    constructor(
        private ls: AppLocalizationService
    ) {}

    ngOnInit() {}

}
