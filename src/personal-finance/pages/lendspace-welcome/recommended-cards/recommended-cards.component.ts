import { Component, OnInit } from '@angular/core';

import { OfferDto, OfferProviderType, OfferCollection } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';

@Component({
    selector: 'recommended-cards',
    templateUrl: './recommended-cards.component.html',
    styleUrls: ['./recommended-cards.component.less']
})
export class RecommendedCardsComponent implements OnInit {
    recommendedCards: OfferDto[] = new Array<OfferDto>(
        OfferDto.fromJS({
            campaignId: 2654,
            name: '0% on Purchases',
            systemType: OfferProviderType.EPCVIP,
            redirectUrl: 'https://offer.epcvip.com?aid=501643&acid=23&subid=test-LS-0onPurchasesCards',
            logoUrl: 'https://s3.us-west-2.amazonaws.com/epcvip.com/uploads/images/d794760d5eefd3cd3ec37fd10fb43625e4a59db6.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJIJNPZVRUIYDRIMA%2F20190118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20190118T062307Z&X-Amz-SignedHeaders=host&X-Amz-Expires=604800&X-Amz-Signature=bcaa555d2062315cc41dfb0631d40ccd86475f57765b2596663893ab8a866d36',
            offerCollection: OfferCollection.ZeroPercentageOnPurchases
        }),
        OfferDto.fromJS({
            campaignId: 2664,
            name: 'No Annual Fee Credit Cards',
            systemType: OfferProviderType.EPCVIP,
            redirectUrl: 'https://offer.epcvip.com?aid=501643&acid=32&subid=test-LS-NoAnnualFeeCards',
            logoUrl: 'https://s3.us-west-2.amazonaws.com/epcvip.com/uploads/images/3c7f71c64caf09201a5ba7ee71475520b38a7356.jpeg?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJIJNPZVRUIYDRIMA%2F20190118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20190118T062309Z&X-Amz-SignedHeaders=host&X-Amz-Expires=604800&X-Amz-Signature=7d80030552b8c52c0f93f20d50840d7a31f32b98fdf28c939f3590a8dfedcca4',
            offerCollection: OfferCollection.NoAnnualFees
        }),
        OfferDto.fromJS({
            campaignId: 2666,
            name: 'Secured Credit Cards',
            systemType: OfferProviderType.EPCVIP,
            redirectUrl: 'https://offer.epcvip.com?aid=501643&acid=34&subid=test-LS-SecuredCreditCards',
            logoUrl: 'https://s3.us-west-2.amazonaws.com/epcvip.com/uploads/images/c65df591354d83ecb4351d0ec25a9fea9e354565.jpeg?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJIJNPZVRUIYDRIMA%2F20190118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20190118T062310Z&X-Amz-SignedHeaders=host&X-Amz-Expires=604800&X-Amz-Signature=486d2def859ca5ae60854d125f27806f7ceff9c739c250e7eed4d45a121eaf70',
            offerCollection: OfferCollection.SecuredOrPrepaid
        }),
        OfferDto.fromJS({
            campaignId: 2655,
            name: 'Best Credit Cards',
            systemType: OfferProviderType.EPCVIP,
            redirectUrl: 'https://offer.epcvip.com?aid=501643&acid=24&subid=test-LS-BestCreditCards',
            logoUrl: 'https://s3.us-west-2.amazonaws.com/epcvip.com/uploads/images/6cdc9ad0b120c400d436739468d64a3f1c964f37.jpeg?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJIJNPZVRUIYDRIMA%2F20190118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20190118T062308Z&X-Amz-SignedHeaders=host&X-Amz-Expires=604800&X-Amz-Signature=eb8961dfc20fbfed52f2ca8dd9e8ac97bbabb239abc2689b12f193bf34849dde',
            offerCollection: OfferCollection.RewardPoints
        })
    );
    discoverData: OfferDto = OfferDto.fromJS({
        campaignId: 2785,
        systemType: OfferProviderType.EPCVIP,
        name: 'Discover it® Cash Back',
        redirectUrl: 'https://offer.epcvip.com?aid=501643&acid=73&subid=test-LS-DiscoverItCashBack',
        logoUrl: 'https://s3.us-west-2.amazonaws.com/epcvip.com/uploads/images/c4f070e103170f051c8c2d9155709db674251e30.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJIJNPZVRUIYDRIMA%2F20190118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20190118T062318Z&X-Amz-SignedHeaders=host&X-Amz-Expires=604800&X-Amz-Signature=939fba9bf072ef47e68d12dacb4d73b947720bcf2e4e091ed4c2a98a6946851f',
        issuingBank: 'Discover Card',
        overallRating: 5
    });

    constructor(
        private offersService: OffersService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
    }

    applyOffer(offer: OfferDto) {
        this.offersService.applyOffer(offer);
    }
}
