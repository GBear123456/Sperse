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
    OfferDto,
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
            name: 'Verifying Loan Request'
        },
        {
            name: 'Accessing Loan Provider Database'
        },
        {
            name: 'Confirming Availability'
        },
        {
            name: 'Retrieving Response'
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

    displayedCards: OfferDto[];
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

    applyOffer(offer: OfferDto) {
        const linkIsDirect = !!offer.redirectUrl;
        const submitApplicationInput = SubmitApplicationInput.fromJS({
            campaignId: offer.campaignId,
            systemType: 'EPCVIP'
        });
        const modalData = {
            processingSteps: [null, null, null, null],
            completeDelays: [ 250, 250, 250, 250 ],
            delayMessages: null,
            title: 'Offers_ConnectingToPartners',
            subtitle: 'Offers_NewWindowWillBeOpen',
            redirectUrl: offer.redirectUrl
        };
        if (!linkIsDirect) {
            modalData.processingSteps = cloneDeep(this.processingSteps);
            modalData.title = 'Offers_ProcessingLoanRequest';
            modalData.subtitle = 'Offers_WaitLoanRequestProcessing';
            modalData.completeDelays = [ 1000, 1000, 1000, null ];
            modalData.delayMessages = [ null, null, null, this.ls.l('Offers_TheNextStepWillTake') ];
        }

        const applyOfferDialog = this.dialog.open(ApplyOfferDialogComponent, {
            width: '500px',
            panelClass: 'apply-offer-dialog',
            data: modalData
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
