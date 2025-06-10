/** Core imports */
import { Component, ElementRef, OnInit, Inject, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    CampaignCategory,
    GetMemberInfoResponse,
    OfferDto,
    OfferServiceProxy,
    GetAllInput
} from '@shared/service-proxies/service-proxies';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'credit-monitoring',
    templateUrl: './credit-monitoring.component.html',
    styleUrls: ['./credit-monitoring.component.less']
})
export class CreditMonitoringComponent implements OnInit {
    @ViewChild('content', { static: true }) contentElementRef: ElementRef;
    offers$: Observable<OfferDto[]>;
    features = [
        {
            iconSrc: 'curriculum.svg',
            title: this.ls.l('CreditScore_CreditScoreTitle'),
            text: this.ls.l('CreditMonitoring_CreditScoreText')
        },
        {
            iconSrc: 'hacker.svg',
            title: this.ls.l('CreditScore_StopCyberThievesTitle'),
            text: this.ls.l('CreditMonitoring_StopCyberThievesText')
        },
        {
            iconSrc: 'cash.svg',
            title: this.ls.l('CreditScore_MilionProtectionTitle'),
            text: this.ls.l('CreditMonitoring_MilionProtectionText')
        }
    ];
    constructor(
        public ls: AppLocalizationService,
        private offersServiceProxy: OfferServiceProxy,
        public offersService: OffersService,
        @Inject(DOCUMENT) private document
    ) {}

    ngOnInit() {
        abp.ui.setBusy(this.contentElementRef.nativeElement);
        this.offers$ = this.offersService.memberInfo$.pipe(
            switchMap((memberInfo: GetMemberInfoResponse) =>
                this.offersServiceProxy.getAll(GetAllInput.fromJS({
                    testMode: memberInfo.testMode,
                    category: CampaignCategory.CreditMonitoring,
                    country: AppConsts.defaultCountryCode,
                    isOfferCollection: false
                })).pipe(
                    finalize(() => {
                        abp.ui.clearBusy(this.contentElementRef.nativeElement);
                        this.document.body.scrollTo(0, 0);
                    })
                )
            ),
        );
    }
}
