import { Component } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    GetAllInput,
    OfferServiceProxy
} from '@shared/service-proxies/service-proxies';
import { OffersService } from '../../offers/offers.service';
import { AppLocalizationService } from '../../../../app/shared/common/localization/app-localization.service';

@Component({
    selector: 'campaign-offers',
    templateUrl: './campaign-offers.component.html',
    styleUrls: ['./campaign-offers.component.less']
})
export class CampaignOffersComponent {
    offers: any[] = [];

    constructor(
        private offerServiceProxy: OfferServiceProxy,
        private offersService: OffersService,
        public ls: AppLocalizationService
    ) {
        offersService.memberInfo$.subscribe((memberInfo) => {
            if (offerServiceProxy['campaignOffersData'])
                this.offers = offerServiceProxy['campaignOffersData'];
            else
                offerServiceProxy.getAll(GetAllInput.fromJS({
                    testMode: memberInfo.testMode,
                    campaignIds: [3989, 4049]
                })).subscribe((offers) => {
                    this.offers = offerServiceProxy['campaignOffersData'] = offers.map((item) => {
                        return {
                            redirectUrl: item.redirectUrl,
                            campaignId: item.campaignId,
                            systemType: item.systemType
                        };
                    });
                });
        });
    }

    open(offer) {
        this.offersService.applyOffer(offer);
    }
}
