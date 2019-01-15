import {
    Component,
    Injector,
    Input,
    HostListener,
    AfterViewInit,
    Renderer2,
    ViewChild,
    ViewChildren,
    QueryList,
    ElementRef,
    OnChanges,
    SimpleChanges
} from '@angular/core';

import { AppComponentBase } from 'shared/common/app-component-base';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-area-navigation',
    templateUrl: './app-area-navigation.component.html',
    styleUrls: ['./app-area-navigation.component.less']
})
export class AppAreaNavigationComponent extends AppComponentBase implements AfterViewInit, OnChanges {
    @Input() memberAreaLinks: any[];
    @Input() actionsButtons: any[];
    @ViewChildren('sublinks') sublinksRefs: QueryList<ElementRef>;
    @ViewChild('linksList') linksList: ElementRef;
    responsiveMemberAreaLinks = [];
    inlineMemberAreaLinks = [];
    resizeTimeout: any;
    loggedUserId: number;
    currentUrl = this._router.url;

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

    ngOnChanges(changes: SimpleChanges) {
        if (changes.memberAreaLinks) {
            this.checkMenuWidth();
        }
    }

    ngAfterViewInit() {
        this.checkMenuWidth();
    }

    checkMenuWidth() {
        const itemWidth = 9, maxInnerWidth = 1140, logoAndMenuWidth = 400;
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

        if (window.innerWidth < 530 && !this.loggedUserId) {
            this.responsiveMemberAreaLinks.push(...this.actionsButtons);
        }
    }

    navigationItemEnter(e, link) {
        if (link.sublinks && link.sublinks.length) {
            setTimeout(() => this.renderer.addClass(e.target, 'opened'));
        } else {
            return;
        }
    }

    navigationItemLeave(e) {
        if (!this.getElementRef().nativeElement.contains(e.relatedTarget) ||
            this.linksList.nativeElement.contains(e.relatedTarget)
        ) {
            this.closeAllOpenedMenuItems();
        }
    }

    private closeAllOpenedMenuItems() {
        this.sublinksRefs.toArray().forEach(sublinkRef => this.renderer.removeClass(sublinkRef.nativeElement.parentElement, 'opened'));
    }
}
