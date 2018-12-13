/** Core imports */
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Params } from '@angular/router/src/shared';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { camelCase, lowerCase, upperFirst } from 'lodash';
import { Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { capitalize, cloneDeep } from 'lodash';

/** Application imports */
import {
    CampaignDto,
    Category,
    CreditScore,
    SubmitApplicationInput,
    SubmitApplicationOutput,
    OfferServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CreditScoreInterface } from '@root/personal-finance/shared/offers/interfaces/credit-score.interface';
import { ApplyOfferDialogComponent } from '@root/personal-finance/shared/offers/apply-offer-modal/apply-offer-dialog.component';

@Injectable()
export class OffersService {

    processingSteps = [
        {
            name: 'Verifying Loan Request',
            completed: false
        },
        {
            name: 'Accessing Loan Provider Database',
            completed: false
        },
        {
            name: 'Confirming Availability',
            completed: false
        },
        {
            name: 'Retrieving Response',
            completed: false
        }
    ];

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
        private offerServiceProxy: OfferServiceProxy,
        private dialog: MatDialog
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
        const linkIsDirect = !!offer.redirectUrl;
        const submitApplicationInput = SubmitApplicationInput.fromJS({
            campaignId: offer.id,
            systemType: 'EPCVIP',
            subId: category
        });
        const applyOfferDialog = this.dialog.open(ApplyOfferDialogComponent, {
            width: '370px',
            panelClass: 'apply-offer-dialog',
            data: {
                processingSteps: cloneDeep(this.processingSteps),
                completeDelays: linkIsDirect
                                    ? [ 250, 250, 250, 250 ]
                                    : [ 1000, 1000, 1000, null ],
                delayMessages: linkIsDirect ? null : [ null, null, null, this.ls.l('Offers_TheNextStepWillTake') ],
                redirectUrl: offer.redirectUrl
            }
        });
        this.offerServiceProxy.submitApplication(submitApplicationInput)
            .subscribe((output: SubmitApplicationOutput) => {
                if (!linkIsDirect) {
                    window.open(output.redirectUrl, '_blank');
                    applyOfferDialog.componentInstance.showBlockedMessage = true;
                }
            });
    }
}
