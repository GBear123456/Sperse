/** Core imports */
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Params } from '@angular/router/src/shared';

/** Third party imports */
import { camelCase, lowerCase, upperFirst } from 'lodash';
import { Observable } from 'rxjs';
import { finalize, map, pluck } from 'rxjs/operators';
import { capitalize } from 'lodash';

/** Application imports */
import {
    CampaignDto,
    Category,
    CreditScore,
    SubmitApplicationInput,
    SubmitApplicationOutput,
    OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CreditScoreInterface } from '@root/personal-finance/shared/offers/interfaces/credit-score.interface';

@Injectable()
export class OffersService {

    readonly creditScores = {
        'poor': {
            min: 0,
            max: 649
        },
        'fair': {
            min: 650,
            max: 699
        },
        'good': {
            min: 700,
            max: 749
        },
        'excellent': {
            min: 750,
            max: 850
        }
    };

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

    getCreditScoreName(value: number): string {
        for (let scoreName in this.creditScores) {
            if (value >= this.creditScores[scoreName].min && value <= this.creditScores[scoreName].max) {
                return scoreName;
            }
        }
    }

    covertCreditScoreToNumber(score: CreditScore): number {
        const creditScoreObj: CreditScoreInterface = this.getCreditScoreObject(score);
        return creditScoreObj ? creditScoreObj.max : 700;
    }

    covertNumberToCreditScore(scoreNumber: number): CreditScore {
        let scoreName = capitalize(this.getCreditScoreName(scoreNumber));
        return CreditScore[scoreName] ? CreditScore[scoreName] : CreditScore.NotSure;
    }

    getCreditScoreObject(creditScore: CreditScore): CreditScoreInterface {
        if (creditScore) {
            const scoreName = (creditScore as string).toLowerCase();
            if (this.creditScores[scoreName]) {
                return {
                    name: scoreName,
                    min: this.creditScores[scoreName].min,
                    max: this.creditScores[scoreName].max
                };
            }
        }
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
