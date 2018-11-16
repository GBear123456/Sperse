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
    loggedUserId: number;

    @HostListener('window:resize') onResize() {
        this.checkMenuWidth();
    }

    constructor(injector: Injector) {
        super(injector);

        this.loggedUserId = this.appSession.userId;
    }

    ngAfterViewInit() {
        this.checkMenuWidth();
    }

    checkMenuWidth() {
        let menuItemsLength = 55,
            maxItemWidth = 0;
        let menuSpace = document.getElementById('header-app-menu').clientWidth;
        let menuItems = Array.from(document.getElementsByClassName('app-list-item'));

        menuItems.forEach(item => {
          menuItemsLength += item.clientWidth;
          if (maxItemWidth < item.clientWidth) maxItemWidth = item.clientWidth;
        });

        if (menuItemsLength > menuSpace && this.memberAreaLinks.length) {
          this.responsiveMemberAreaLinks.push(this.memberAreaLinks.pop());
        } else if (menuSpace - menuItemsLength > maxItemWidth && this.responsiveMemberAreaLinks.length) {
          this.memberAreaLinks.push(this.responsiveMemberAreaLinks.pop());
        }
    }
}