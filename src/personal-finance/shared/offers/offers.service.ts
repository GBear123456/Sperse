/** Core imports */
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { camelCase, capitalize, cloneDeep, lowerCase, upperFirst } from 'lodash';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import {
    OfferDto,
    OfferFilterCategory,
    GetMemberInfoResponseCreditScore,
    SubmitApplicationInput,
    SubmitApplicationOutput,
    OfferServiceProxy,
    GetMemberInfoResponse,
    CreditScores,
    OfferDtoCampaignProviderType
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CreditScoreInterface } from '@root/personal-finance/shared/offers/interfaces/credit-score.interface';
import { ApplyOfferDialogComponent } from '@root/personal-finance/shared/offers/apply-offer-modal/apply-offer-dialog.component';
import { CategoryGroupEnum } from '@root/personal-finance/shared/offers/category-group.enum';
import { CurrencyPipe } from '@angular/common';

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
        'credit-scores': OfferFilterCategory.CreditScore,
        'id-theft-protection': OfferFilterCategory.CreditMonitoring
    };
    readonly categoriesDisplayNames = {
        [OfferFilterCategory.CreditScore]: this.ls.l('CreditScore_CreditScores')
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
        private currencyPipe: CurrencyPipe,
        private dialog: MatDialog
    ) {}

    getCategoryFromRoute(route: ActivatedRoute): Observable<OfferFilterCategory> {
        return route.url.pipe(
            map((urlSegment: UrlSegment) => this.routeToCategoryMapping[urlSegment[0].path] || OfferFilterCategory[upperFirst(camelCase(urlSegment[0].path))])
        );
    }

    getCategoryDisplayName(category: OfferFilterCategory): string {
        return category ? this.categoriesDisplayNames[category] || lowerCase(category) : this.defaultCategoryDisplayName;
    }

    getCreditScoreName(value: number): string {
        for (let scoreName in this.creditScores) {
            if (value >= this.creditScores[scoreName].min && value <= this.creditScores[scoreName].max) {
                return scoreName;
            }
        }
    }

    covertCreditScoreToNumber(score: GetMemberInfoResponseCreditScore): number {
        const creditScoreObj: CreditScoreInterface = this.getCreditScoreObject(score);
        return creditScoreObj ? creditScoreObj.max : 700;
    }

    covertNumberToCreditScore(scoreNumber: number): GetMemberInfoResponseCreditScore {
        let scoreName = capitalize(this.getCreditScoreName(scoreNumber));
        return GetMemberInfoResponseCreditScore[scoreName] ? GetMemberInfoResponseCreditScore[scoreName] : GetMemberInfoResponseCreditScore.NotSure;
    }

    getCreditScoreObject(creditScore: GetMemberInfoResponseCreditScore): CreditScoreInterface {
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
            systemType: offer.systemType
        });
        const modalData = {
            processingSteps: [null, null, null, null],
            completeDelays: [ 250, 250, 250, 250 ],
            delayMessages: null,
            title: 'Offers_ConnectingToPartners',
            subtitle: 'Offers_NewWindowWillBeOpen',
            redirectUrl: offer.redirectUrl,
            logoUrl: offer.campaignProviderType === OfferDtoCampaignProviderType.CreditLand ? this.creditCardsLogoUrl : offer.logoUrl
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

    getCreditScore(category: OfferFilterCategory, creditScoreNumber: number): GetMemberInfoResponseCreditScore {
        const categoryGroup = this.getCategoryGroup(category);
        let creditScore = categoryGroup === CategoryGroupEnum.Loans
            || categoryGroup === CategoryGroupEnum.CreditCards
            ? this.covertNumberToCreditScore(creditScoreNumber)
            : undefined;
        return creditScore;
    }

    getCategoryGroup(category: OfferFilterCategory): CategoryGroupEnum {
        let categoryGroup: CategoryGroupEnum;
        switch (category) {
            case OfferFilterCategory.PersonalLoans:
            case OfferFilterCategory.PaydayLoans:
            case OfferFilterCategory.InstallmentLoans:
            case OfferFilterCategory.BusinessLoans:
            case OfferFilterCategory.AutoLoans: {
                categoryGroup = CategoryGroupEnum.Loans;
                break;
            }
            case OfferFilterCategory.CreditCards: {
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

    formatLoanAmountValues(minAmount: number = null, maxAmount: number = null): string {
        let minAmountStr = minAmount ? this.currencyPipe.transform(minAmount, 'USD', 'symbol', '0.0-2') : null;
        let maxAmountStr = this.currencyPipe.transform(maxAmount, 'USD', 'symbol', '0.0-2');

        return this.formatFromTo(minAmountStr, maxAmountStr);
    }

    private formatFromTo(from, to): string {
        if (from && to)
            return from + ' - ' + to;
        if (from)
            return 'from ' + from;
        if (to)
            return 'to ' + to;

        return null;
    }
}
