import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'recommended-lenders',
    templateUrl: './recommended-lenders.component.html',
    styleUrls: ['./recommended-lenders.component.less']
})
export class RecommendedLendersComponent implements OnInit {
    recommendedLenders = [
        {
            imgName: 'lendingtree.png',
            title: 'Lending Tree',
            rating: 5
        },
        {
            imgName: '5kfunds.png',
            title: '5k funds',
            rating: 5
        },
        {
            imgName: 'loansunder36.png',
            title: 'Loans Under 36',
            rating: 5
        }
    ];

    constructor() {
    }

    ngOnInit() {
    }

}
