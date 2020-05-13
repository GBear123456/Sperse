/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    Inject,
    OnDestroy,
    OnInit,
    Renderer2,
    ViewEncapsulation
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Event, NavigationEnd, Router } from '@angular/router';

/** Third party imports */
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '../../../../app/shared/common/localization/app-localization.service';

@Component({
    selector: 'products-menu',
    templateUrl: 'products-menu.component.html',
    styleUrls: [
        '../../../../shared/common/styles/dx-customs.less',
        'products-menu.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class ProductsMenuComponent implements OnInit, OnDestroy {
    products = [
        {
            key: this.ls.l('Tools'),
            items: [
                {
                    firstWord: this.ls.l('BankCode_Bank'),
                    secondWord: this.ls.l('Books'),
                    noSpace: true,
                    route: 'code-breaker/books'
                },
                {
                    firstWord: this.ls.l('BankCode_Bank'),
                    secondWord: this.ls.l('Cards'),
                    noSpace: true,
                    route: 'code-breaker/cards'
                }
            ]
        },
        {
            key: this.ls.l('Training'),
            items: [
                {
                    firstWord: this.ls.l('BankCode_Bank'),
                    secondWord: this.ls.l('BankCode_Vault'),
                    noSpace: true,
                    route: 'code-breaker/products/bankvault'
                },
                {
                    firstWord: this.ls.l('BankCode_Codebreaker'),
                    secondWord: this.ls.l('Summit'),
                    route: 'code-breaker/summit'
                },
                {
                    firstWord: this.ls.l('BankCode_Codebreaker'),
                    secondWord: this.ls.l('Coaching'),
                    route: 'code-breaker/coaching'
                }
            ]
        },
        {
            key: this.ls.l('Technologies'),
            items: [
                {
                    firstWord: this.ls.l('BankCode_Codebreaker'),
                    secondWord: this.ls.l('BankCode_AI'),
                    route: 'code-breaker/products/codebreaker-ai'
                },
                {
                    firstWord: this.ls.l('BankCode_Bank'),
                    secondWord: this.ls.l('BankCode_Pass'),
                    noSpace: true,
                    route: 'code-breaker/products/bankpass'
                }
            ]
        },
        {
            key: this.ls.l('Certifications'),
            items: [
                {
                    firstWord: this.ls.l('BankCode_Codebreaker'),
                    secondWord: this.ls.l('Coach'),
                    route: 'code-breaker/coach'
                },
                {
                    firstWord: this.ls.l('BankCode_Codebreaker'),
                    secondWord: this.ls.l('Trainer'),
                    route: 'code-breaker/trainer'
                }
            ]
        }
    ];
    selectedProductRoute: BehaviorSubject<string> = new BehaviorSubject<string>(this.router.url.slice(1));
    selectedProductRoute$: Observable<string> = this.selectedProductRoute.asObservable();
    eventsSubscription: Subscription;

    constructor(
        private router: Router,
        private renderer: Renderer2,
        public ls: AppLocalizationService,
        @Inject(DOCUMENT) private document
    ) {}

    ngOnInit() {
        this.eventsSubscription = this.router.events.pipe(
            filter((event: Event) => event instanceof NavigationEnd),
            map((event: NavigationEnd) => event.urlAfterRedirects.slice(1))
        ).subscribe((productRoute: string) => {
            this.selectedProductRoute.next(productRoute);
        });
    }

    displayExpr = (item) => {
        return item
            ? item.firstWord + (item.secondWord ? (item.noSpace ? '' : ' ') + item.secondWord : '')
            : null;
    }

    onPopupOpened() {
        this.renderer.addClass(
            this.document.body.querySelector('.dx-selectbox-popup-wrapper'),
            'bank-code-product-menu-popup'
        );
    }

    itemClick(e) {
        this.router.navigateByUrl(e.itemData.route);
    }

    ngOnDestroy() {
        this.eventsSubscription.unsubscribe();
    }
}