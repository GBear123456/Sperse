import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'environments/environment';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { SubmitRequestInput, SubmitRequestOutput, OfferDtoSystemType, OfferServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'articles',
    templateUrl: './articles.component.html',
    styleUrls: ['./articles.component.less']
})
export class ArticlesComponent extends AppComponentBase implements OnInit, OnDestroy {
    articles$: Observable<SafeHtml>;

    constructor(injector: Injector,
        private sanitizer: DomSanitizer,
        private offerServiceProxy: OfferServiceProxy,
        private offersService: OffersService
    ) {
        super(injector);
    }

    ngOnInit() {
        window['openOffer'] = (campaignId, redirectUrl) => {
            let submitRequestInput = SubmitRequestInput.fromJS({
                campaignId: campaignId,
                redirectUrl: redirectUrl,
                systemType: OfferDtoSystemType.EPCVIP
            });
            window.open(redirectUrl, '_blank');
            this.offerServiceProxy.submitRequest(submitRequestInput)
                .subscribe((output: SubmitRequestOutput) => {});
        };

        this.startLoading(true);
        this.offersService.memberInfo$.subscribe(
            () => {
                this.articles$ = from(
                    $.ajax({
                        url: environment.LENDSPACE_DOMAIN + '/documents/articles.html',
                        method: 'GET'
                    })
                ).pipe(
                    map((html) => {
                        this.finishLoading(true);
                        return this.sanitizer.bypassSecurityTrustHtml(html);
                    })
                );
            }
        );
    }

    ngOnDestroy() {
        window['openOffer'] = undefined;
    }
}
