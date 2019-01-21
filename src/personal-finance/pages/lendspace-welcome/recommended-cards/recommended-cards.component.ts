import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'recommended-cards',
    templateUrl: './recommended-cards.component.html',
    styleUrls: ['./recommended-cards.component.less']
})
export class RecommendedCardsComponent implements OnInit {
    recommendedCards = [
        {
            imgName: 'ZeroPercentageOnPurchases.svg',
            title: '5% on purchases'
        },
        {
            imgName: 'BusinessCards.svg',
            title: 'No anual fees'
        },
        {
            imgName: 'SecuredOrPrepaid.svg',
            title: 'Secured or prepaid'
        },
        {
            imgName: 'RewardPoints.svg',
            title: 'Best credit cards offers'
        }
    ];

    constructor() {
    }

    ngOnInit() {
    }

}
