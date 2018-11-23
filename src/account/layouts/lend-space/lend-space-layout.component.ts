/** Core imports */
import { Component, Injector, OnInit } from '@angular/core';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';

@Component({
    templateUrl: './lend-space-layout.component.html',
    styleUrls: [
        './lend-space-layout.component.less'
    ]
})
export class LendSpaceLayoutComponent extends AppComponentBase implements OnInit {
    currentYear: number = moment().year();

    appAreaLinks = [
        {
            name: 'Products',
            routerUrl: '/personal-finance/products'
        },
        {
            name: 'Features',
            routerUrl: '/personal-finance/features'
        },
        {
            name: 'About',
            routerUrl: '/personal-finance/about-us'
        },
        {
            name: 'Contact Us',
            routerUrl: '/personal-finance/contact-us'
        }
    ];

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit(): void {
    }
}