/** Core imports */
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { camelCase, capitalize, cloneDeep, lowerCase, upperFirst } from 'lodash';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';
import { Store } from '@ngrx/store';

/** Application imports */
import {
    OfferDto,
    Category,
    CreditScore,
    SubmitApplicationInput,
    SubmitApplicationOutput,
    OfferServiceProxy,
    GetMemberInfoResponse
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CreditScoreInterface } from '@root/personal-finance/shared/offers-b/interfaces/credit-score.interface';
import { ApplyOfferDialogComponent } from '@root/personal-finance/shared/offers-b/apply-offer-modal/apply-offer-dialog.component';
import { CategoryGroupEnum } from '@root/personal-finance/shared/offers-b/category-group.enum';
import { AppStore } from '@app/store';

@Injectable()
export class OffersService {
    memberInfo$: Observable<GetMemberInfoResponse> = this.offerServiceProxy.getMemberInfo().pipe(publishReplay(), refCount()); //, finalize(abp.ui.clearBusy)
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
    readonly routeToCategoryMapping = {
        'credit-scores': Category.CreditScore,
        'id-theft-protection': Category.CreditMonitoring
    };
    readonly categoriesDisplayNames = {
        [Category.CreditScore]: this.ls.l('CreditScore_CreditScores')
    };
    readonly creditScores = {
        'notsure': {
            min: 0,
            max: 299
        },
        'poor': {
            min: 300,
            max: 629
        },
        'fair': {
            min: 630,
            max: 689
        },
        'good': {
            min: 690,
            max: 719
        },
        'excellent': {
            min: 720,
            max: 850
        }
    };
    readonly creditCardsLogoUrl = './assets/common/images/offers/credit-land.png';
    displayedCards: OfferDto[];
    defaultCategoryDisplayName: string = this.ls.l('Offers_Offers');
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ls: AppLocalizationService,
        private offerServiceProxy: OfferServiceProxy,
        private dialog: MatDialog
    ) {}

    getCategoryFromRoute(route: ActivatedRoute): Observable<Category> {
        return route.url.pipe(
            map((urlSegment: UrlSegment) => this.routeToCategoryMapping[urlSegment[0].path] || Category[upperFirst(camelCase(urlSegment[0].path))])
        );
    }

    getCategoryDisplayName(category: Category): string {
        return category ? this.categoriesDisplayNames[category] || lowerCase(category) : this.defaultCategoryDisplayName;
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

    applyOffer(offer: OfferDto, isCreditCard = false) {
        const linkIsDirect = !!offer.redirectUrl;
        const submitApplicationInput = SubmitApplicationInput.fromJS({
            campaignId: offer.campaignId,
            systemType: offer.systemType
        });
        const modalData = {
            processingSteps: [null, null, null, null],
            completeDelays: [ 250, 250, 250, 250 ],
            delayMessages: null,
            title: 'Offers_ConnectingToPartners',
            subtitle: 'Offers_NewWindowWillBeOpen',
            redirectUrl: offer.redirectUrl,
            logoUrl: isCreditCard ? this.creditCardsLogoUrl : offer.logoUrl
        };
        if (!linkIsDirect) {
            modalData.processingSteps = cloneDeep(this.processingSteps);
            modalData.title = 'Offers_ProcessingLoanRequest';
            modalData.subtitle = 'Offers_WaitLoanRequestProcessing';
            modalData.completeDelays = [ 1000, 1000, 1000, null ];
            modalData.delayMessages = <any>[ null, null, null, this.ls.l('Offers_TheNextStepWillTake') ];
        }

        const applyOfferDialog = this.dialog.open(ApplyOfferDialogComponent, {
            width: '530px',
            panelClass: 'apply-offer-dialog',
            data: modalData
        });
        this.offerServiceProxy.submitApplication(submitApplicationInput)
            .subscribe(
                (output: SubmitApplicationOutput) => {
                    if (!linkIsDirect) {
                        /** If window opening is blocked - show message for allowing popups opening, else - close popup and redirect to the link (code for redirect in the popup component) */
                        !window.open(output.redirectUrl, '_blank')
                            ? applyOfferDialog.componentInstance.showBlockedMessage = true
                            : applyOfferDialog.close();
                    }
                },
                () => applyOfferDialog.close()
            );
    }

    getCreditScore(category: Category, creditScoreNumber: number): CreditScore {
        const categoryGroup = this.getCategoryGroup(category);
        let creditScore = categoryGroup === CategoryGroupEnum.Loans
            || categoryGroup === CategoryGroupEnum.CreditCards
            ? this.covertNumberToCreditScore(creditScoreNumber)
            : undefined;
        return categoryGroup === CategoryGroupEnum.Loans && creditScore === CreditScore.NotSure
               ? CreditScore.Poor
               : creditScore;
    }

    getCategoryGroup(category: Category): CategoryGroupEnum {
        let categoryGroup: CategoryGroupEnum;
        switch (category) {
            case Category.PersonalLoans:
            case Category.PaydayLoans:
            case Category.InstallmentLoans:
            case Category.BusinessLoans:
            case Category.AutoLoans: {
                categoryGroup = CategoryGroupEnum.Loans;
                break;
            }
            case Category.CreditCards: {
                categoryGroup = CategoryGroupEnum.CreditCards;
                break;
            }
            default: {
                categoryGroup = CategoryGroupEnum.Default;
            }
        }
        return categoryGroup;
    }

    getParamDisplayValue(paramValue: string, valuesToConvert: { [value: string]: string } = null): string {
        const loweredParamValue = paramValue && paramValue.toLowerCase ? paramValue.toLowerCase() : paramValue;
        const defaultValuesToConvert = {
            'null': 'N/A',
            '-' : 'N/A',
            'no' : 'None',
            'false': 'None',
            'true': 'Applicable'
        };
        valuesToConvert = { ...defaultValuesToConvert, ...valuesToConvert };
        return valuesToConvert && valuesToConvert[loweredParamValue] || paramValue;
    }
}
