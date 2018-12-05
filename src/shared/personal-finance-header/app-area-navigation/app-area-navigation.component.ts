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

import { AppComponentBase } from 'shared/common/app-component-base';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-area-navigation',
    templateUrl: './app-area-navigation.component.html',
    styleUrls: ['./app-area-navigation.component.less']
})
export class AppAreaNavigationComponent extends AppComponentBase implements AfterViewInit {
    @Input() memberAreaLinks: any[];
    @Input() actionsButtons: any[];
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
        const itemWidth = 10, maxInnerWidth = 1140, logoAndMenuWidth = 400;
        let menuSpace = Math.round(Math.min(innerWidth, maxInnerWidth) - logoAndMenuWidth);
        let menuItemsLength = 0;

        this.responsiveMemberAreaLinks.length = 0;
        this.inlineMemberAreaLinks.length = 0;

        this.memberAreaLinks.forEach((item, index) => {
            menuItemsLength += (itemWidth * this.memberAreaLinks[index].name.length + 50);
            if (menuItemsLength > menuSpace)
                this.responsiveMemberAreaLinks.push(this.memberAreaLinks[index]);
            else
                this.inlineMemberAreaLinks.push(this.memberAreaLinks[index]);
        });

        if (window.innerWidth < 530) {
            this.responsiveMemberAreaLinks.push(...this.actionsButtons);
        }
    }

    navigationItemClick(e, link) {
        if (!link.routerUrl && (!link.sublinks || !link.sublinks.length))
            return;

        if (link.routerUrl) {
            this._router.navigate([link.routerUrl]);
        } else {
            this.closeAllOpenedMenuItems();
            setTimeout(() => this.renderer.addClass(e.target.parentElement, 'opened'));
        }
    }

    private closeAllOpenedMenuItems() {
        this.sublinksRefs.toArray().forEach(sublinkRef => this.renderer.removeClass(sublinkRef.nativeElement.parentElement, 'opened'));
    }
}
