import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MaskPipe } from 'ngx-mask';

import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { GetMemberInfoResponse, OfferDto, OfferProviderType, OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { AppConsts } from '@shared/AppConsts';
import { GetStateCodeFromZipService } from '@shared/utils/get-state-code-from-zip.service';

@Component({
    selector: 'recommended-lenders',
    templateUrl: './recommended-lenders.component.html',
    styleUrls: ['./recommended-lenders.component.less'],
    providers: [MaskPipe, GetStateCodeFromZipService]
})
export class RecommendedLendersComponent implements OnInit {
    set stateCode(value: string ) {
        this.offersService.state$.next(value);
    }
    memberInfo: GetMemberInfoResponse = new GetMemberInfoResponse();
    zipRegex = AppConsts.regexPatterns.zipUsPattern;
    recommendedLenders: OfferDto[] = new Array<OfferDto>(
        OfferDto.fromJS({
            campaignId: 2595,
            name: 'LendingTree',
            systemType: OfferProviderType.EPCVIP,
            redirectUrl: 'https://offer.epcvip.com?aid=501643&acid=16&subid=test-LS-',
            logoUrl: 'https://s3.us-west-2.amazonaws.com/epcvip.com/uploads/images/e650a1486f9e1d8131ed580118b2aa51cea19565.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJIJNPZVRUIYDRIMA%2F20190118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20190118T062306Z&X-Amz-SignedHeaders=host&X-Amz-Expires=604800&X-Amz-Signature=4f43f91cda381bdc6b86fadcd76cc1bc5243552d1b6702660355e904ce60d85f',
            overallRating: 5,
        }),
        OfferDto.fromJS({
            campaignId: 2586,
            name: '5kfunds',
            systemType: OfferProviderType.EPCVIP,
            redirectUrl: 'https://offer.5kfunds.com?aid=501643&acid=7&subid=test-LS-',
            logoUrl: 'https://s3.us-west-2.amazonaws.com/epcvip.com/uploads/images/ebf147eab9c431264f3e0e1540c0448b.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJIJNPZVRUIYDRIMA%2F20190118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20190118T062304Z&X-Amz-SignedHeaders=host&X-Amz-Expires=604800&X-Amz-Signature=ab540e7a518d668f56817cec82adef619a1c49c4f136d7a251ca1bb671a0ed0b',
            overallRating: 5
        }),
        OfferDto.fromJS({
            campaignId: 2582,
            name: 'LoansUnder36',
            systemType: OfferProviderType.EPCVIP,
            redirectUrl: 'https://offer.loansunder36.com?aid=501643&acid=3&subid=test-LS-',
            logoUrl: 'https://s3.us-west-2.amazonaws.com/epcvip.com/uploads/images/569fab85cfafae8eae8d843c573e068c31bd70e3.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJIJNPZVRUIYDRIMA%2F20190118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20190118T062303Z&X-Amz-SignedHeaders=host&X-Amz-Expires=604800&X-Amz-Signature=0a704af3c1c18b0e28509ae490e336264e8f9b713a4b04d064d2703032b187e6',
            overallRating: 5
        })
    );

    constructor(
        private router: Router,
        private offersService: OffersService,
        private maskPipe: MaskPipe,
        private offerServiceProxy: OfferServiceProxy,
        private getStateCodeFromZip: GetStateCodeFromZipService,
        public ls: AppLocalizationService
    ) {
        this.offerServiceProxy.getMemberInfo().subscribe(
            res => {
                if (res) {
                    this.memberInfo = res;
                } else {
                    this.memberInfo.zipCode = '';
                }
            }
        );
    }

    ngOnInit() {}

    applyOffer(offer: OfferDto) {
        this.offersService.applyOffer(offer);
    }

    onInput(e, maxLength: number, mask?: string) {
        const inputElement = e.event.target;
        if (inputElement.value.length > maxLength)
            inputElement.value = inputElement.value.slice(0, maxLength);
        if (mask)
            inputElement.value = this.maskPipe.transform(inputElement.value, mask);
    }

    getLoans(zipCode) {
        this.stateCode = this.getStateCodeFromZip.getStateCode(zipCode);
        this.router.navigate(['/personal-finance/offers/auto-loans']);
    }
}
