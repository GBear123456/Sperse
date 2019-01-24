import { Component, OnInit } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'recommended-articles',
    templateUrl: './recommended-articles.component.html',
    styleUrls: ['./recommended-articles.component.less']
})
export class RecommendedArticlesComponent implements OnInit {
    articles = [
        {
            img: 'Article1.png',
            title: 'Earn $100s by Opening up an Online Checking Account',
            text: 'In Best of, Featured, Find Credit, Our Favorites. - Last Updated Dec 13 2018.',
            url: 'https://blog.wiki.credit/2018/06/19/earn-100s-by-opening-up-an-online-checking-account/?sid=epcvip-LS-Articles'
        },
        {
            img: 'Article2.png',
            title: 'Fly and Stay for FREE with these Credit Cards!',
            text: 'In Best of, Credit Tips, Featured, Find a Credit Card, Fun Facts, How To, Our Favorites, Travel.',
            url: 'https://blog.wiki.credit/2018/07/31/fly-and-stay-for-free-with-these-5-travel-tips/?sid=epcvip-LS-Articles'
        },
        {
            img: 'Article3.png',
            title: '2018 Top Loans for Less Than Perfect Credit',
            text: 'In Best of, Find a Loan, Find Credit.',
            url: 'https://blog.wiki.credit/2018/11/27/2018-top-loans-for-less-than-perfect-credit-2/?sid=epcvip-LS-Articles'
        }
    ];

    constructor(
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
    }

    openLink(url) {
        window.open(url);
    }
}
