/** Core imports */
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Params } from '@angular/router/src/shared';

/** Third party imports */
import { camelCase, lowerCase, upperFirst } from 'lodash';
import { Observable } from 'rxjs';
import { finalize, first, map, pluck } from 'rxjs/operators';

/** Application imports */
import {
    CampaignDto,
    Category,
    SubmitApplicationInput,
    SubmitApplicationOutput,
    OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Injectable()
export class OffersService {

    displayedCards: CampaignDto[];
    defaultCategoryDisplayName: string = this.ls.l('Offers_Offers');

    constructor(
        private route: ActivatedRoute,
        private ls: AppLocalizationService,
        private offerServiceProxy: OfferServiceProxy
    ) {}

    getCategoryFromRoute(routeParams: Observable<Params>): Observable<Category> {
        return routeParams.pipe(
            pluck('category'),
            map((category: string) => Category[upperFirst(camelCase(category))])
        );
    }

    getCategoryDisplayName(category: Category): string {
        return category ? lowerCase(category) : this.defaultCategoryDisplayName;
    }

    applyOffer(offer: CampaignDto, category: string) {
        const submitApplicationInput = SubmitApplicationInput.fromJS({
            campaignId: offer.id,
            systemType: 'EPCVIP',
            subId: category
        });
        abp.ui.setBusy();
        this.offerServiceProxy.submitApplication(submitApplicationInput)
            .pipe(finalize(() => abp.ui.clearBusy()))
            .subscribe((output: SubmitApplicationOutput) => {
                if (!offer.redirectUrl) {
                    window.open(output.redirectUrl, '_blank');
                }
            });
        if (offer.redirectUrl) {
            window.open(offer.redirectUrl, '_blank');
        }
    }
}
