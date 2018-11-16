import { Component, Injector, Input, HostListener, AfterViewInit } from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-area-navigation',
  templateUrl: './app-area-navigation.component.html',
  styleUrls: ['./app-area-navigation.component.less']
})
export class AppAreaNavigationComponent extends AppComponentBase implements AfterViewInit {
    @Input() memberAreaLinks: any[];
    responsiveMemberAreaLinks = [];
    inlineMemberAreaLinks = [];
    resizeTimeout: any;
    loggedUserId: number;

    @HostListener('window:resize') onResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(
            () => this.checkMenuWidth());
    }

    constructor(injector: Injector) {
        super(injector);

        this.loggedUserId = this.appSession.userId;
    }

    ngAfterViewInit() {
        this.checkMenuWidth();
    }

    checkMenuWidth() {
        const itemWidth = 150;
        let menuItemsLength = itemWidth,
            maxItemWidth = 0;
        let menuSpace = Math.round(innerWidth / 2  - itemWidth);

        this.responsiveMemberAreaLinks = [];
        this.inlineMemberAreaLinks = [];

        this.memberAreaLinks.forEach((item, index) => {
            if (menuItemsLength > menuSpace)
                this.responsiveMemberAreaLinks.push(this.memberAreaLinks[index]);
            else {
              menuItemsLength += itemWidth;
              this.inlineMemberAreaLinks.push(this.memberAreaLinks[index]);
            }
        });
    }
}