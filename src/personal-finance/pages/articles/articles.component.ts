import {Component, Injector, OnInit} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from 'environments/environment';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'articles',
    templateUrl: './articles.component.html',
    styleUrls: ['./articles.component.less']
})
export class ArticlesComponent extends AppComponentBase implements OnInit {
    articles$: Observable<SafeHtml>;

    constructor(injector: Injector,
        private sanitizer: DomSanitizer
    ) {
        super(injector);
    }

    ngOnInit() {
        this.startLoading(true);
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

}
