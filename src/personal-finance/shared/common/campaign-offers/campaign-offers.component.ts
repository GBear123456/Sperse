import { Component, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    OfferServiceProxy,
    SubmitApplicationInput
} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'campaign-offers',
    templateUrl: './campaign-offers.component.html',
    styleUrls: ['./campaign-offers.component.less'],
    providers: [OfferServiceProxy]
})
export class CampaignOffersComponent extends AppComponentBase {
    offers: any[] = [];

    constructor(injector: Injector,
        private offerServiceProxy: OfferServiceProxy
    ) {
        super(injector);
        offerServiceProxy.getMemberInfo().subscribe((memberInfo) => {
            offerServiceProxy.getAll(
                memberInfo.testMode,
                memberInfo.isDirectPostSupported,
                undefined, undefined, undefined, undefined,
                undefined, undefined, undefined, undefined,
                undefined, [3174, 3179]
            ).subscribe((offers) => {
                this.offers = offers.map((item) => {
                    return {
                        url: item.redirectUrl,
                        campaignId: item.campaignId,
                        systemType: item.systemType
                    };
                });
            });
        });
    }

    open(offer) {
        window.open(offer.url, '_blank');
        const submitApplicationInput = SubmitApplicationInput.fromJS({
            campaignId: offer.campaignId,
            systemType: offer.systemType
        });
        this.offerServiceProxy.submitApplication(submitApplicationInput)
            .subscribe(() => {});
    }
}
