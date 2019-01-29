import { Component, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { OfferServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'campaign-offers',
    templateUrl: './campaign-offers.component.html',
    styleUrls: ['./campaign-offers.component.less'],
    providers: [OfferServiceProxy]
})
export class CampaignOffersComponent extends AppComponentBase {
    offersUrls: string[] = [];

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
                undefined, [3009, 3011]
            ).subscribe((offers) => {
                this.offersUrls = offers.map((item) => item.redirectUrl);
            });
        });
    }

    open(url) { 
        window.open(url, '_blank');
    }
}