/** Core imports */
import { Component, Injector, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';

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
export class LendSpaceLayoutComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    currentDate = new Date();
    currentYear: number = moment().year();

    appAreaLinks = [
/*
        {
            name: 'Products',
            routerUrl: '/personal-finance/products'
        },
        {
            name: 'Features',
            routerUrl: '/personal-finance/features'
        },
*/
        {
            name: 'About',
            routerUrl: '/personal-finance/about'
        },
        {
            name: 'Contact Us',
            routerUrl: '/personal-finance/contact-us'
        }
    ];

    constructor(
        injector: Injector,
        private renderer: Renderer2
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.renderer.addClass(document.body, 'lend-space-landing'));
    }

    ngOnDestroy() {
        this.renderer.removeClass(document.body, 'lend-space-landing');
    }
}