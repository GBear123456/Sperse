import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { Observable } from '@node_modules/rxjs';
import { finalize, switchMap } from '@node_modules/rxjs/internal/operators';
import { Category, GetMemberInfoResponse, OfferDto, OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';

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
            title: 'ID Protection',
            text: this.ls.l('CreditMonitoring_CreditScoreText')
        },
        {
            iconSrc: 'hacker.svg',
            title: 'Stop Cyber Thieves',
            text: this.ls.l('CreditMonitoring_StopCyberThievesText')
        },
        {
            iconSrc: 'cash.svg',
            title: '$1,000,000 Protection',
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
                this.offersServiceProxy.getAll(
                    memberInfo.testMode,
                    memberInfo.isDirectPostSupported,
                    Category.CreditMonitoring,
                    undefined,
                    'US',
                    undefined,
                    false,
                    undefined
                ).pipe(
                    finalize(() => abp.ui.clearBusy(this.contentElementRef.nativeElement))
                )
            ),
        );
    }

}
