import { Component, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    GetAllInput,
    OfferServiceProxy
} from '@shared/service-proxies/service-proxies';
import { OffersService } from '../../offers/offers.service';

@Component({
    selector: 'campaign-offers',
    templateUrl: './campaign-offers.component.html',
    styleUrls: ['./campaign-offers.component.less']
})
export class CampaignOffersComponent extends AppComponentBase {
    offers: any[] = [];

    constructor(injector: Injector,
        private _offerServiceProxy: OfferServiceProxy,
        private _offersService: OffersService
    ) {
        super(injector);
        _offersService.memberInfo$.subscribe((memberInfo) => {
            if (_offerServiceProxy['caampaignOffersData'])
                this.offers = _offerServiceProxy['caampaignOffersData'];
            else
                _offerServiceProxy.getAll(GetAllInput.fromJS({
                    testMode: memberInfo.testMode,
                    isDirectPostSupported: memberInfo.isDirectPostSupported,
                    campaignIds: [3945, 3171]
                })).subscribe((offers) => {
                    this.offers = _offerServiceProxy['caampaignOffersData'] = offers.map((item) => {
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
        this._offersService.applyOffer(offer);
    }
}
