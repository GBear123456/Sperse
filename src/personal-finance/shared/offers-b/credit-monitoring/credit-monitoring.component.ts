import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { Observable } from '@node_modules/rxjs';
import { finalize, switchMap } from '@node_modules/rxjs/internal/operators';
import {
    GetAllInput,
    GetMemberInfoResponse,
    OfferDto,
    OfferFilterCategory,
    OfferServiceProxy
} from '@shared/service-proxies/service-proxies';
import { OffersService } from '@root/personal-finance/shared/offers-b/offers.service';

@Component({
    selector: 'credit-monitoring',
    templateUrl: './credit-monitoring.component.html',
    styleUrls: ['./credit-monitoring.component.less']
})
export class CreditMonitoringComponent implements OnInit {
    @ViewChild('content') contentElementRef: ElementRef;
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
        public offersService: OffersService
    ) {}

    ngOnInit() {
        abp.ui.setBusy(this.contentElementRef.nativeElement);
        this.offers$ = this.offersService.memberInfo$.pipe(
            switchMap((memberInfo: GetMemberInfoResponse) =>
                this.offersServiceProxy.getAll(GetAllInput.fromJS({
                    testMode: memberInfo.testMode,
                    isDirectPostSupported: memberInfo.isDirectPostSupported,
                    category: OfferFilterCategory.CreditMonitoring,
                    country: 'US',
                    isOfferCollection: false
                })).pipe(
                    finalize(() => abp.ui.clearBusy(this.contentElementRef.nativeElement))
                )
            ),
        );
    }
}
