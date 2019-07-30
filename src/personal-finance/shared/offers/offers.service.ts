/** Core imports */
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { HttpParams } from '@angular/common/http';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import camelCase from 'lodash/camelCase';
import kebabCase from 'lodash/kebabCase';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import lowerCase from 'lodash/lowerCase';
import upperFirst from 'lodash/upperFirst';
import { ReplaySubject, Observable } from 'rxjs';
import { map, first, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import {
    OfferDto,
    OfferFilterCategory,
    GetMemberInfoResponseCreditScore,
    SubmitRequestInput,
    SubmitRequestOutput,
    OfferServiceProxy,
    GetMemberInfoResponse,
    OfferDtoCampaignProviderType
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CreditScoreInterface } from '@root/personal-finance/shared/offers/interfaces/credit-score.interface';
import { ApplyOfferDialogComponent } from '@root/personal-finance/shared/offers/apply-offer-modal/apply-offer-dialog.component';
import { CategoryGroupEnum } from '@root/personal-finance/shared/offers/category-group.enum';
import { CurrencyPipe } from '@angular/common';

@Injectable()
export class OffersService {
    static readonly routeToCategoryMapping: { [key: string]: OfferFilterCategory } = {
        'credit-scores': OfferFilterCategory.CreditScore,
        'id-theft-protection': OfferFilterCategory.CreditMonitoring
    };
    static readonly categoryToRouteMapping = {
        [OfferFilterCategory.CreditScore]: 'credit-scores',
        [OfferFilterCategory.CreditMonitoring]: 'id-theft-protection'
    };

    state$: ReplaySubject<string> = new ReplaySubject<string>();
    memberInfo$: Observable<GetMemberInfoResponse> = this.offerServiceProxy.getMemberInfo().pipe(publishReplay(), refCount());
    memberInfo: GetMemberInfoResponse;
    memberInfoApplyOfferParams: string;
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
    demoUserOffers = [
        OfferDto.fromJS({
            campaignId: 1,
            details: ["APR: 5.73%-16.59%", "Loan Term: 24-84 months", "Credit Score: Good/Excellent"],
            logoUrl: "./assets/images/credit-report/offers/demo/sofi.svg",
            maxLoanAmount: 100000,
            name: "SoFi",
            regularAPR: "5.73%-16.59%",
            systemType: "EPCVIP"
        }),
        OfferDto.fromJS({
            campaignId: 2,
            details: [
                'Fixed rates from 5.99% to 28.99% APR. For NY residents, rates range from 5.99% to 24.99% APR.',
                'Only the most creditworthy applicants qualify for the lowest rates and largest loans amounts. Rates will generally be higher for longer-term loans.',
                'Marcus is backed by Goldman Sachs\' 150 years of financial expertise.',
                'No origination fee, prepayment fee, or late fee - You only pay interest for the additional days.'
            ],
            logoUrl: './assets/images/credit-report/offers/demo/marcus.png',
            maxLoanAmount: 40000,
            minLoanAmount: 3500,
            redirectUrl: 'marcus-details',
            name: 'Marcus by Goldman Sachs',
            systemType: 'EPCVIP'
        }),
        OfferDto.fromJS({
            campaignId: 3,
            details: ["APR: 3.99%-35.99%", "Loan Term: 3-180 months", "Credit Score: Poor/Fair/Good/Excellent"],
            logoUrl: "./assets/images/credit-report/offers/demo/lending.png",
            name: "Lending Tree",
            regularAPR: "3.99%-35.99%",
            systemType: "EPCVIP"
        }),
        OfferDto.fromJS({
            campaignId: 4,
            details: ["APR: 4.99%-35.99%", "Loan Term: 24-84 months", "Credit Score: Fair/Good/Excellent"],
            logoUrl: "./assets/images/credit-report/offers/demo/credible.svg",
            name: "Credible",
            regularAPR: "4.99%-35.99%",
            systemType: "EPCVIP"
        })
    ];
    readonly creditLandLogoUrl = './assets/common/images/offers/credit-land.png';
    displayedCards: OfferDto[];
    defaultCategoryDisplayName: string = this.ls.l('Offers_Offers');
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ls: AppLocalizationService,
        private offerServiceProxy: OfferServiceProxy,
        private currencyPipe: CurrencyPipe,
        private dialog: MatDialog
    ) {
        this.memberInfo$.pipe(first()).subscribe(
            (memberInfo: GetMemberInfoResponse) => {
                this.memberInfo = memberInfo;
                this.state$.next(memberInfo.stateCode || 'all');
                this.memberInfoApplyOfferParams = this.getApplyOffersParams(memberInfo);
            }
        );
    }

    static getCategoryFromRoute(route: ActivatedRoute): Observable<OfferFilterCategory> {
        return route.url.pipe(
            map((urlSegment: UrlSegment) => OffersService.routeToCategoryMapping[urlSegment[0].path] || OfferFilterCategory[upperFirst(camelCase(urlSegment[0].path))])
        );
    }

    static getCategoryRouteNameByCategoryEnum(category: OfferFilterCategory): string {
        return OffersService.categoryToRouteMapping[category] || kebabCase(category);
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

    convertCreditScoreToNumber(score: GetMemberInfoResponseCreditScore): number {
        const creditScoreObj: CreditScoreInterface = this.getCreditScoreObject(score);
        return creditScoreObj ? creditScoreObj.max : 700;
    }

    convertNumberToCreditScore(scoreNumber: number): GetMemberInfoResponseCreditScore {
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

    applyOffer(offer: OfferDto, isCreditCard = false) {
        const linkIsDirect = !!offer.redirectUrl;
        let submitRequestInput = SubmitRequestInput.fromJS({
            campaignId: offer.campaignId,
            systemType: offer.systemType,
            ...this.memberInfo
        });
        let redirectUrl = !linkIsDirect ? offer.redirectUrl : offer.redirectUrl + '&' + this.memberInfoApplyOfferParams;
        const modalData = {
            processingSteps: [null, null, null, null],
            completeDelays: [ 250, 250, 250, 250 ],
            delayMessages: null,
            title: 'Offers_ConnectingToPartners',
            subtitle: 'Offers_NewWindowWillBeOpen',
            redirectUrl: redirectUrl,
            logoUrl: offer.campaignProviderType === OfferDtoCampaignProviderType.CreditLand
                     ? this.creditLandLogoUrl
                     : (isCreditCard ? null : offer.logoUrl)
        };
        if (!linkIsDirect) {
            modalData.processingSteps = cloneDeep(this.processingSteps);
            modalData.title = 'Offers_ProcessingLoanRequest';
            modalData.subtitle = 'Offers_WaitLoanRequestProcessing';
            modalData.completeDelays = [ 1000, 1000, 1000, null ];
            modalData.delayMessages = <any>[ null, null, null, this.ls.l('Offers_TheNextStepWillTake') ];
        } else {
            submitRequestInput.redirectUrl = redirectUrl;
        }

        const applyOfferDialog = this.dialog.open(ApplyOfferDialogComponent, {
            width: '530px',
            panelClass: 'apply-offer-dialog',
            data: modalData
        });
        this.offerServiceProxy.submitRequest(submitRequestInput)
            .subscribe(
                (output: SubmitRequestOutput) => {
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
            ? this.convertNumberToCreditScore(creditScoreNumber)
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

    private getApplyOffersParams(memberInfo: GetMemberInfoResponse): string {
        const options = {
            xi_resid: memberInfo.applicantId,
            xi_oclkid: memberInfo.clickId,
            fname: memberInfo.firstName,
            lname: memberInfo.lastName,
            email: memberInfo.emailAddress,
            dob: memberInfo.doB && memberInfo.doB.utc().format('Y-MM-DD'),
            phone: memberInfo.phoneNumber,
            haddress1: memberInfo.streetAddress,
            city: memberInfo.city,
            hpostal: memberInfo.zipCode,
            state: memberInfo.stateCode
        };
        let params = new HttpParams();
        for (let key in options) {
            if (options[key]) {
                params = params.set(key, options[key]);
            }
        }
        return params.toString();
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
