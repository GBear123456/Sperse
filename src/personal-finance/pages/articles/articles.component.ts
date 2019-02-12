import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'articles',
    templateUrl: './articles.component.html',
    styleUrls: ['./articles.component.less']
})
export class ArticlesComponent extends AppComponentBase implements OnInit {
    articles$: Observable<SafeHtml>;

    constructor(injector: Injector,
        private sanitizer: DomSanitizer,
        private offersService: OffersService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.startLoading(true);
        this.offersService.memberInfo$.subscribe(
            () => {
                this.articles$ = from(
                    $.ajax({
                        url: './assets/articles.html',
                        method: 'GET'
                    })
                ).pipe(
                    map((html) => {
                        html = html.replace('var apiUiOrigin', 'var apiUiOrigin = "' + AppConsts.remoteServiceBaseUrl + '"');
                        html = html.replace('var applyOfferParams', 'var applyOfferParams = "' + this.offersService.memberInfoApplyOfferParams + '"');
                        html = html.replace('var authorization', 'var authorization = "Bearer ' + abp.auth.getToken() + '"');
                        eval(html.match(new RegExp('<script>(.+?)<\/script>', 's')).pop());
                        return html;
                    }),
                    map((html) => {
                        this.finishLoading(true);
                        return this.sanitizer.bypassSecurityTrustHtml(html);
                    })
                );
            }
        );
    }
}
