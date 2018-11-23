import {
    Component,
    Injector,
    Input,
    HostListener,
    AfterViewInit,
    Renderer2,
    ViewChildren,
    QueryList,
    ElementRef
} from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-area-navigation',
    templateUrl: './app-area-navigation.component.html',
    styleUrls: ['./app-area-navigation.component.less']
})
export class AppAreaNavigationComponent extends AppComponentBase implements AfterViewInit {
    @Input() memberAreaLinks: any[];
    @ViewChildren('sublinks') sublinksRefs: QueryList<ElementRef>;
    responsiveMemberAreaLinks = [];
    inlineMemberAreaLinks = [];
    resizeTimeout: any;
    loggedUserId: number;
    currentUrl = this._router.url;
    @HostListener('window:click') onClick() {
        this.closeAllOpenedMenuItems();
    }

    @HostListener('window:resize') onResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => this.checkMenuWidth());
    }

    constructor(
        injector: Injector,
        private renderer: Renderer2
    ) {
        super(injector);
        this._router.events.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.currentUrl = this._router.url;
        });
        this.loggedUserId = this.appSession.userId;
    }

    ngAfterViewInit() {
        this.checkMenuWidth();
    }

    checkMenuWidth() {
        const itemWidth = 150;
        let menuItemsLength = itemWidth;
        let menuSpace = Math.round(innerWidth / 2 - itemWidth);

        this.responsiveMemberAreaLinks.length = 0;
        this.inlineMemberAreaLinks.length = 0;

        this.memberAreaLinks.forEach((item, index) => {
            if (menuItemsLength > menuSpace)
                this.responsiveMemberAreaLinks.push(this.memberAreaLinks[index]);
            else {
                menuItemsLength += itemWidth;
                this.inlineMemberAreaLinks.push(this.memberAreaLinks[index]);
            }
        });
    }

    navigationItemClick(e, link) {
        if (link.routerUrl) {
            this._router.navigate([link.routerUrl]);
        } else {
            this.closeAllOpenedMenuItems();
            const currentSublinksElement = e.target.parentElement.querySelector('.sublinks');
            if (currentSublinksElement) {
                setTimeout(() => this.renderer.addClass(currentSublinksElement, 'opened'));
            }
        }
    }

    private closeAllOpenedMenuItems() {
        this.sublinksRefs.toArray().forEach(sublinkRef => this.renderer.removeClass(sublinkRef.nativeElement, 'opened'));
    }
}
