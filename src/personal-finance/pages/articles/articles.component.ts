/** Core imports */
import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/** Third party imports */
import { Observable, from } from 'rxjs';
import { first, map, takeUntil, switchMap, finalize } from 'rxjs/operators';

/** Core imports */
import { environment } from 'environments/environment';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { OfferProviderType, OfferServiceProxy, GetMemberInfoResponse } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'articles',
    templateUrl: './articles.component.html',
    styleUrls: ['./articles.component.less']
})
export class ArticlesComponent extends AppComponentBase implements OnInit, OnDestroy {
    articles$: Observable<SafeHtml>;
    memberInfo$: Observable<GetMemberInfoResponse> = this.offersService.memberInfo$.pipe( first(), takeUntil(this.destroy$));
    constructor(injector: Injector,
        private sanitizer: DomSanitizer,
        private offerServiceProxy: OfferServiceProxy,
        private offersService: OffersService
    ) {
        super(injector);
    }

    ngOnInit() {
        window['openOffer'] = (campaignId, redirectUrl) => {
            const offerInfo: any = {
                campaignId: campaignId,
                redirectUrl: redirectUrl,
                systemType: OfferProviderType.EPCVIP
            };
            this.offersService.applyOffer(offerInfo);
        };
        this.startLoading(true);
        this.articles$ = this.memberInfo$.pipe(
            switchMap(() => from(
                $.ajax({
                    url: environment.LENDSPACE_DOMAIN + '/documents/articles.html',
                    method: 'GET'
                })
            )),
            map(html => this.sanitizer.bypassSecurityTrustHtml(html)),
            finalize(() => this.finishLoading(true))
        );
    }

    ngOnDestroy() {
        window['openOffer'] = undefined;
        super.ngOnDestroy();
    }
}
