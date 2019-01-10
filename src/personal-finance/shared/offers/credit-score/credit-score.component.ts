/** Core imports */
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, UrlSegment } from '@angular/router';

/** Third party imports */
import * as moment from 'moment';
import { Observable, combineLatest } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';
import { camelCase, upperFirst } from 'lodash';

/** Application imports */
import { Category, GetMemberInfoResponse, OfferDto, OfferServiceProxy } from 'shared/service-proxies/service-proxies';
import { AppLocalizationService } from 'app/shared/common/localization/app-localization.service';
import { OffersService } from 'personal-finance/shared/offers/offers.service';

@Component({
    templateUrl: './credit-score.component.html',
    styleUrls: [ './credit-score.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditScoreComponent implements OnInit {
    @ViewChild('content') contentElementRef: ElementRef;
    bureauAmount = '3';
    logoes = [
        'transunion',
        'equifax',
        'experian'
    ];
    advantages = [
        this.ls.l('CreditScore_InstantlyAccessYourCreditScores'),
        this.ls.l('CreditScore_SecureOnlineDelivery'),
        this.ls.l('CreditScore_DailyBureauCreditMonitoring'),
        this.ls.l('CreditScore_RoadsideAssistance')
    ];
    currentDate = moment().format('MMM DD, YYYY');
    category$: Observable<Category>;
    offers$: Observable<OfferDto[]>;

    constructor(
        public ls: AppLocalizationService,
        private offersServiceProxy: OfferServiceProxy,
        public offersService: OffersService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.category$ = this.route.url.pipe(map((urlSegment: UrlSegment) => upperFirst(camelCase(urlSegment[0].path))));
        abp.ui.setBusy(this.contentElementRef.nativeElement);
        this.offers$ = combineLatest(
                this.category$,
                this.offersService.memberInfo$
            ).pipe(
                switchMap(([category, memberInfo]: [Category, GetMemberInfoResponse]) =>
                    this.offersServiceProxy.getAll(
                        memberInfo.testMode,
                        memberInfo.isDirectPostSupported,
                        category,
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
