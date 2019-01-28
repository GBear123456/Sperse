import { Component, OnInit, Input } from '@angular/core';
import { OfferDto } from '@shared/service-proxies/service-proxies';
import { Observable } from 'rxjs';
import { OffersService } from '@root/personal-finance/shared/offers-b/offers.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
  selector: 'offers-category-details',
  templateUrl: './offers-category-details.component.html',
  styleUrls: ['./offers-category-details.component.less']
})
export class OffersCategoryDetailsComponent implements OnInit {
    @Input() offers$: Observable<OfferDto[]>;
    @Input() advantages: string[];
    @Input() logoes: string[];
    @Input() descriptionTitle: string;
    @Input() descriptionText: string;
    constructor(
        public offersService: OffersService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {}

}
