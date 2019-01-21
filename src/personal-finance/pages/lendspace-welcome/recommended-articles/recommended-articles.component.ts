import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'recommended-articles',
    templateUrl: './recommended-articles.component.html',
    styleUrls: ['./recommended-articles.component.less']
})
export class RecommendedArticlesComponent implements OnInit {
    articles = [
        {
            img: 'Article2.png',
            text: 'Lorem ipsum dolor sit amet adipiscing'
        },
        {
            img: 'Article6.png',
            text: 'Lorem ipsum dolor sit amet adipiscing'
        }
    ];

    constructor() {
    }

    ngOnInit() {
    }

}
