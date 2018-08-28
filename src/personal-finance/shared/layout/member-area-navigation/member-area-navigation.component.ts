import { Component, Injector, Input, HostListener, AfterViewInit } from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'member-area-navigation',
  templateUrl: './member-area-navigation.component.html',
  styleUrls: ['./member-area-navigation.component.less']
})
export class MemberAreaNavigationComponent extends AppComponentBase implements AfterViewInit {
  @Input() memberAreaLinks: any[];
  responsiveMemberAreaLinks = [];

  @HostListener('window:resize') onResize() {
    this.checkMenuWidth();
  }

  constructor(injector: Injector) {
    super(injector);
  }

  ngAfterViewInit() {
    this.checkMenuWidth();
  }

  checkMenuWidth() {
    let menuItemsLength = 55,
        maxItemWidth = 0;
    let menuSpace = document.getElementById('header-menu').clientWidth;
    let menuItems = Array.from(document.getElementsByClassName('member-list-item'));

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
