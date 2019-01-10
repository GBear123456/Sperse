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
            title: 'Identity restoration',
            text: 'Vestibulum rutrum quam vitae fringilla tincidunt. Suspendisse nec tortor urna. Ut laoreet sodales nisi.'
        },
        {
            iconSrc: 'hacker.svg',
            title: 'Stop cyber thieves',
            text: 'Vestibulum rutrum quam vitae fringilla tincidunt. Suspendisse nec tortor urna. Ut laoreet sodales nisi.'
        },
        {
            iconSrc: 'cash.svg',
            title: '$1,000,000 protection',
            text: 'Vestibulum rutrum quam vitae fringilla tincidunt. Suspendisse nec tortor urna. Ut laoreet sodales nisi.'
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
